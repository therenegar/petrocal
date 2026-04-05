const STORAGE_KEY = "petrocal.dataset.v3";
const REPORT_SESSION_KEY = "petrocal.report.dataset";

const form6Main = document.getElementById("form6Main");
let dataset = normalizeDataset(loadDataset() || {});
const FORM6_TEMPLATE_URL = "ref/form-6-verification-notification-template.xlsx";
const FORM6_SHEET_NAME = "Form 6";
const MAX_HOSE_ROWS_PER_SPREADSHEET = 32;
const PERFORMANCE_CODE_LABELS = {
  A: "A- new instrument",
  B: "B- routine inspection or contract requirement (without recalibration or repair)",
  C: "C- routine inspection or contract requirement (within MPE but recalibrated)",
  D: "D- outside MPE and recalibrated",
  E: "E- instrument repaired",
  F: "F- removed from trade",
  G: "G- modified/upgraded",
  H: "H- mark removed and not re-verified",
};
const FORM6_DATA_CELLS = {
  B10: ["testDetails", "operator"],
  D12: ["testDetails", "suburb"],
  E12: ["testDetails", "postCode"],
  B14: ["form6Details", "licenceNumber"],
  C14: ["form6Details", "businessName"],
  D14: ["form6Details", "abnNumber"],
  B16: ["testDetails", "registrationNumber"],
  D16: ["testDetails", "verificationMark"],
  C16: ["testDetails", "verifierName"],
};
const FORM6_HOSE_TABLE = {
  startRow: 18,
  columns: {
    location: "A",
    verificationDate: "B",
    make: "C",
    model: "D",
    serialNumber: "E",
    nmiPattern: "F",
    capacity: "G",
    performanceCode: "H",
    comments: "I",
  },
};

function setExportStatus(message, isError = false) {
  const status = document.getElementById("form6ExportStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function buildSpreadsheetFilename(partIndex = 0, totalParts = 1) {
  const parts = [
    "form6",
    text(dataset.testDetails?.jobNumber),
    text(dataset.testDetails?.siteName),
    new Date().toISOString().slice(0, 10)
  ].filter(Boolean);

  if (totalParts > 1) {
    parts.push(`part-${partIndex + 1}`);
  }

  return `${parts.join("-")}.xlsx`;
}

async function exportForm6Spreadsheet() {
  if (!window.ExcelJS) {
    setExportStatus("Spreadsheet export failed: ExcelJS is not available.", true);
    return;
  }

  setExportStatus("Generating spreadsheet...");

  try {
    const tableRows = hoseRows();
    const rowChunks = chunkRows(tableRows, MAX_HOSE_ROWS_PER_SPREADSHEET);

    for (let index = 0; index < rowChunks.length; index += 1) {
      const workbook = await loadTemplateWorkbook();
      const worksheet = workbook.getWorksheet(FORM6_SHEET_NAME) || workbook.worksheets[0];
      if (!worksheet) {
        throw new Error("Template workbook did not contain any worksheets.");
      }

      applyForm6FieldCells(worksheet);
      applyForm6HoseTable(worksheet, rowChunks[index]);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob(
        [buffer],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      );

      downloadBlob(blob, buildSpreadsheetFilename(index, rowChunks.length));
    }

    setExportStatus(
      rowChunks.length > 1
        ? `Downloaded ${rowChunks.length} spreadsheets.`
        : "Spreadsheet downloaded.",
    );
  } catch (error) {
    setExportStatus(`Spreadsheet export failed: ${error.message || "unknown error"}`, true);
  }
}

async function loadTemplateWorkbook() {
  const response = await fetch(FORM6_TEMPLATE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Unable to load Form 6 template at "${FORM6_TEMPLATE_URL}" (${response.status}). ` +
      "Please add the converted .xlsx template to ref/ before exporting.",
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer.byteLength) {
    throw new Error("Template workbook is empty.");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  return workbook;
}

function getAtPath(source, path) {
  return path.reduce((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return current[key];
  }, source);
}

function splitStreetAddress(fullAddress) {
  const value = text(fullAddress).trim();
  if (!value) return { streetNumber: "", streetName: "" };

  const match = value.match(/^(\d+[A-Za-z0-9/-]*)\s*(.*)$/);
  if (!match) {
    return { streetNumber: "", streetName: value };
  }

  return {
    streetNumber: text(match[1]).trim(),
    streetName: text(match[2]).trim(),
  };
}

function chunkRows(rows, chunkSize) {
  if (!rows.length) return [[]];

  const chunks = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}

function formatPerformanceCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return PERFORMANCE_CODE_LABELS[code] || text(value);
}

function buildBusinessName() {
  return [
    text(dataset.testDetails?.operator),
    text(dataset.testDetails?.siteName),
    text(dataset.testDetails?.siteNumber),
  ].filter(Boolean).join(" - ");
}

function applyForm6FieldCells(worksheet) {
  Object.entries(FORM6_DATA_CELLS).forEach(([cellRef, datasetPath]) => {
    worksheet.getCell(cellRef).value = text(getAtPath(dataset, datasetPath));
  });

  worksheet.getCell("B10").value = buildBusinessName();
  worksheet.getCell("G10").value = "Fuel Retail";

  const { streetNumber, streetName } = splitStreetAddress(dataset.testDetails?.streetAddress);
  worksheet.getCell("B12").value = streetNumber;
  worksheet.getCell("C12").value = streetName;
  worksheet.getCell("G12").value = "N";
}

function applyForm6HoseTable(worksheet, rows) {
  rows.forEach((row, index) => {
    const targetRow = FORM6_HOSE_TABLE.startRow + index;
    Object.entries(FORM6_HOSE_TABLE.columns).forEach(([key, column]) => {
      worksheet.getCell(`${column}${targetRow}`).value = text(row[key]);
    });
  });
}

function bindExportButton() {
  const button = document.getElementById("generateForm6Btn");
  if (!button) return;

  button.addEventListener("click", () => {
    exportForm6Spreadsheet();
  });
}

initForm6Page();


function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1500);
}

function initForm6Page() {
  renderForm6();
  bindExportButton();
}

function defaultDataset() {
  return {
    testDetails: {
      date: "",
      verifierName: "",
      registrationNumber: "",
      verificationMark: "",
      operator: "",
      streetAddress: "",
      suburb: "",
      state: "",
      postCode: "",
      comments: ""
    },
    form6Details: {
      licenceNumber: "",
      businessName: "",
      abnNumber: ""
    },
    instruments: []
  };
}

function normalizeDataset(input) {
  const base = defaultDataset();
  const normalized = {
    ...base,
    ...input,
    testDetails: { ...base.testDetails, ...(input?.testDetails || {}) },
    form6Details: { ...base.form6Details, ...(input?.form6Details || {}) },
    instruments: Array.isArray(input?.instruments) ? input.instruments : []
  };

  normalized.instruments = normalized.instruments.map((instrument) => ({
    manufacturer: "",
    make: "",
    modelNumber: "",
    serialNumber: "",
    nmiPatternApproval: "",
    hoses: [],
    ...instrument,
    hoses: Array.isArray(instrument?.hoses) ? instrument.hoses : []
  }));

  return normalized;
}

function loadDataset() {
  try {
    const raw =
      sessionStorage.getItem(REPORT_SESSION_KEY) ||
      localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistDataset() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  try {
    sessionStorage.setItem(REPORT_SESSION_KEY, JSON.stringify(dataset));
  } catch {
    // no-op
  }
}

function text(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function hoseRows() {
  const rows = [];
  dataset.instruments.forEach((instrument) => {
    const make = [text(instrument.manufacturer), text(instrument.make)].filter(Boolean).join(" ");

    instrument.hoses.forEach((hose) => {
      const hoseSerial = [text(instrument.serialNumber), text(hose.hoseSerialSuffix)].filter(Boolean).join("-");
      rows.push({
        location: [text(hose.number), text(hose.grade)].filter(Boolean).join(" / "),
        verificationDate: text(dataset.testDetails.date),
        make,
        model: text(instrument.modelNumber),
        serialNumber: hoseSerial,
        nmiPattern: text(instrument.nmiPatternApproval),
        capacity: text(hose.qmax),
        performanceCode: formatPerformanceCode(hose.measureCheck?.performanceCode),
        comments: (text(hose.measureCheck?.performanceCode).trim().toUpperCase() === "H")
          ? text(hose.measureCheck?.comments)
          : "",
      });
    });
  });
  return rows;
}

function labelledField(label, value) {
  const row = document.createElement("div");
  row.className = "form6-info-row";

  const labelEl = document.createElement("dt");
  labelEl.textContent = label;
  const valueEl = document.createElement("dd");
  valueEl.textContent = value || "—";

  row.append(labelEl, valueEl);
  return row;
}

function editableField(label, key) {
  const row = document.createElement("div");
  row.className = "form6-info-row";

  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  labelEl.htmlFor = `form6-${key}`;

  const input = document.createElement("input");
  input.id = `form6-${key}`;
  input.dataset.schemaName = key;
  input.value = dataset.form6Details[key] || "";
  input.addEventListener("input", () => {
    dataset.form6Details[key] = input.value;
    persistDataset();
  });

  row.append(labelEl, input);
  return row;
}

function renderForm6() {
  const root = document.createElement("section");
  root.className = "form6-sheet";

  const intro = document.createElement("p");
  intro.className = "form6-preview-note";
  intro.textContent = "A preview of the Form 6 data is shown below. Confirm the details and then click the Generate Form 6 button to create and download the Form 6 spreadsheet (Excel format).";

  const columns = document.createElement("div");
  columns.className = "form6-columns";

  const left = document.createElement("section");
  left.className = "form6-block";
  left.append(
    Object.assign(document.createElement("h3"), { textContent: "Instrument Owner/User Details" }),
    labelledField("Business name", buildBusinessName()),
    labelledField("Business type", "Fuel Retail"),
    Object.assign(document.createElement("h3"), { textContent: "Instrument Location Details" }),
    labelledField("Street address", text(dataset.testDetails.streetAddress)),
    labelledField("Suburb/locality", text(dataset.testDetails.suburb)),
    labelledField("State", text(dataset.testDetails.state)),
    labelledField("Postcode", text(dataset.testDetails.postCode))
  );

  const right = document.createElement("section");
  right.className = "form6-block";
  right.append(
    Object.assign(document.createElement("h3"), { textContent: "Servicing Licensee Details" }),
    editableField("Licence number", "licenceNumber"),
    editableField("Business name", "businessName"),
    editableField("ABN number", "abnNumber"),
    Object.assign(document.createElement("h3"), { textContent: "Verifier Details" }),
    labelledField("Registration number", text(dataset.testDetails.registrationNumber)),
    labelledField("Name of Verifier", text(dataset.testDetails.verifierName)),
    labelledField("Verifier Mark", text(dataset.testDetails.verificationMark))
  );

  columns.append(left, right);

  const tableSection = document.createElement("section");
  tableSection.className = "form6-table-section";
  tableSection.append(Object.assign(document.createElement("h3"), { textContent: "Verification Details" }));

  const table = document.createElement("table");
  table.className = "form6-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>Location of instrument on site</th>
        <th>Date of verification</th>
        <th>Make</th>
        <th>Model</th>
        <th>Serial Number</th>
        <th>NMI Pattern Approval Number</th>
        <th>Capacity (L/min)</th>
        <th>Instrument Performance Code</th>
        <th>Comments</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  hoseRows().forEach((row) => {
    const tr = document.createElement("tr");
    [
      row.location,
      row.verificationDate,
      row.make,
      row.model,
      row.serialNumber,
      row.nmiPattern,
      row.capacity,
      row.performanceCode,
      row.comments
    ].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value || "";
      tr.append(td);
    });
    tbody.append(tr);
  });

  if (!tbody.childElementCount) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.textContent = "No hose records available.";
    tr.append(td);
    tbody.append(tr);
  }

  tableSection.append(table);
  root.append(intro, columns, tableSection);
  form6Main.replaceChildren(root);
}
