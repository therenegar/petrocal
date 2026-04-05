const STORAGE_KEY = "petrocal.dataset.v3";
const REPORT_SESSION_KEY = "petrocal.report.dataset";

const form6Main = document.getElementById("form6Main");
let dataset = normalizeDataset(loadDataset() || {});


const DEFAULT_FORM6_ENDPOINT = "http://localhost:8080/petrocal/tools/form6_generate_spreadsheet.php";
const FORM6_ENDPOINT_STORAGE_KEY = "petrocal.form6.endpoint";

function resolveForm6Endpoint() {
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("form6Endpoint") || "").trim();
  if (query) return query;

  const winValue = String(window.PETROCAL_FORM6_ENDPOINT || "").trim();
  if (winValue) return winValue;

  const stored = String(localStorage.getItem(FORM6_ENDPOINT_STORAGE_KEY) || "").trim();
  if (stored) return stored;

  return DEFAULT_FORM6_ENDPOINT;
}

function setExportStatus(message, isError = false) {
  const status = document.getElementById("form6ExportStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function buildSpreadsheetFilename() {
  const parts = [
    "form6",
    text(dataset.testDetails?.jobNumber),
    text(dataset.testDetails?.siteName),
    new Date().toISOString().slice(0, 10)
  ].filter(Boolean);

  return `${parts.join("-")}.xls`;
}

async function exportForm6Spreadsheet() {
  setExportStatus("Generating spreadsheet...");

  try {
    const response = await fetch(resolveForm6Endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dataset })
    });

    if (!response.ok) {
      const detail = await response.text();
      let message = detail || `Request failed (${response.status})`;
      try {
        const parsed = JSON.parse(detail);
        if (parsed && parsed.error) message = parsed.error;
      } catch {
        // use raw response text
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error("The server returned an empty spreadsheet file.");
    }

    downloadBlob(blob, buildSpreadsheetFilename());
    setExportStatus("Spreadsheet downloaded.");
  } catch (error) {
    setExportStatus(`Spreadsheet export failed: ${error.message || "unknown error"}`, true);
  }
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
        performanceCode: text(hose.measureCheck?.performanceCode)
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

  
  

  const columns = document.createElement("div");
  columns.className = "form6-columns";

  const left = document.createElement("section");
  left.className = "form6-block";
  left.append(
    Object.assign(document.createElement("h3"), { textContent: "Instrument Owner/User Details" }),
    labelledField("Trader's name", text(dataset.testDetails.operator)),
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
      row.performanceCode
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
    td.colSpan = 8;
    td.textContent = "No hose records available.";
    tr.append(td);
    tbody.append(tr);
  }

  tableSection.append(table);
  root.append(columns, tableSection);
  form6Main.replaceChildren(root);
}
