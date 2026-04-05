const STORAGE_KEY = "petrocal.dataset.v3";
const REPORT_SESSION_KEY = "petrocal.report.dataset";
const VISUAL_INSPECTION_QUESTIONS = [
  "1. Does the dispenser comply with its certificate/s of approval (CofA)?",
  "2. Are all mandatory descriptive markings clearly and permanently on a data plate that is fixed to the dispenser?",
  "3. Is the instrument wire sealed in line with the CofA, is there a Verifier Mark on the meter(s)?",
  "4. Is the dispenser firmly fixed on its foundations?",
  "5. Are all panels secure and cover windows not broken?",
  "6. Do the indications of volume, unit price and total price correspond with the hose selected?",
  "7. Are all indications clearly visible under all conditions, day and night?",
  "8. Are the hoses in reasonable condition, e.g.: they are not badly chafed, split or worn?",
  "9. Does each nozzle terminate the delivery when returned to its holsters?",
  "10. Is the dispenser free from any leaks?",
  "11. For self-service systems: do the dispenser number/s correspond with the console?",
  "12. For continuous indicators: do the price-posting wheels line up with, and follow, the internal price-setting ranger lever?"
];
const COMPLIANCE_QUESTIONS = [
  "Checking facility for indicating devices (clause 3.2)",
  "Zero setting (clause 3.3)",
  "Price computing (clause 3.4)",
  "Nozzle cut-off (clause 3.5)",
  "Interlock (clause 3.6)",
  "Pre-set indications (clause 3.11)"
];
const PERFORMANCE_CODE_LABELS = {
  A: "A- new instrument",
  B: "B- routine inspection or contract requirement (without recalibration or repair)",
  C: "C- routine inspection or contract requirement (within MPE but recalibrated)",
  D: "D- outside MPE and recalibrated",
  E: "E- instrument repaired",
  F: "F- removed from trade",
  G: "G- modified/upgraded",
  H: "H- mark removed and not re-verified"
};

const DEFAULT_EXPORT_BASE_URL = "http://localhost:8080/petrocal/tools";
const EXPORT_BASE_URL_STORAGE_KEY = "petrocal.report.exportBaseUrl";

function resolveExportBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = (params.get("exportBaseUrl") || "").trim();
  if (fromQuery) return fromQuery.replace(/\/+$/, "");

  const fromWindow = String(window.PETROCAL_EXPORT_BASE_URL || "").trim();
  if (fromWindow) return fromWindow.replace(/\/+$/, "");

  const fromStorage = String(localStorage.getItem(EXPORT_BASE_URL_STORAGE_KEY) || "").trim();
  if (fromStorage) return fromStorage.replace(/\/+$/, "");

  return DEFAULT_EXPORT_BASE_URL;
}

async function readStylesheetText() {
  const stylesheet = document.querySelector('link[rel="stylesheet"][href]');
  if (!stylesheet) return "";

  try {
    const response = await fetch(stylesheet.href, { cache: "no-store" });
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
}

async function buildExportHtml() {
  const stylesheetText = await readStylesheetText();
  const reportRoot = document.getElementById("appMain");
  const reportMarkup = reportRoot ? reportRoot.outerHTML : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Petrocal Report</title>
    <style>${stylesheetText}</style>
  </head>
  <body>${reportMarkup}</body>
</html>`;
}

function setExportStatus(message, isError = false) {
  const status = document.getElementById("exportStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function buildReportFilename(dataset) {
  const job = String(pick(dataset, ["testDetails", "jobNumber"], "") || "").trim();
  const site = String(pick(dataset, ["testDetails", "siteName"], "") || "").trim();
  const stamp = new Date().toISOString().slice(0, 10);
  return ["test-report", job, site, stamp].filter(Boolean).join("-");
}

async function exportReport(format) {
  const dataset = loadDataset();
  if (!dataset) {
    setExportStatus("No dataset found to export.", true);
    return;
  }

  const endpoint = `${resolveExportBaseUrl()}/export-report.php?format=${encodeURIComponent(format)}`;

  setExportStatus(`Preparing ${format.toUpperCase()} export...`);

  try {
    const html = await buildExportHtml();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: buildReportFilename(dataset),
        html,
        dataset
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Export request failed (${response.status}).`);
    }

    const blob = await response.blob();
    const ext = format === "doc" ? "doc" : format;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${buildReportFilename(dataset)}.${ext}`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);

    setExportStatus(`${format.toUpperCase()} downloaded.`);
  } catch (error) {
    setExportStatus(`Export failed: ${error.message || "unknown error"}`, true);
  }
}

function bindExportButtons() {
  const map = [
    ["exportPdfBtn", "pdf"],
    ["exportDocBtn", "doc"],
    ["exportXlsBtn", "xls"]
  ];

  map.forEach(([id, format]) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.addEventListener("click", () => {
      exportReport(format);
    });
  });
}

function loadDataset() {
  const raw =
    sessionStorage.getItem(REPORT_SESSION_KEY) ||
    localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function text(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  return String(value);
}

function pick(obj, path, fallback = undefined) {
  let current = obj;
  for (let i = 0; i < path.length; i += 1) {
    if (current === null || current === undefined) return fallback;
    current = current[path[i]];
  }
  return current === undefined ? fallback : current;
}

function decorateOutcomeElement(element, value) {
  const val = String(value || "").trim().toLowerCase();
  if (["yes", "pass"].includes(val)) element.classList.add("value-good");
  if (["no", "fail"].includes(val)) element.classList.add("value-bad");
}

function renderKeyValueGrid(title, rows) {
  const section = document.createElement("section");
  section.className = "report-section";

  const heading = document.createElement("h2");
  heading.textContent = title;
  section.append(heading);

  const grid = document.createElement("dl");
  grid.className = "report-grid";

  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text(value);
    decorateOutcomeElement(dd, value);
    grid.append(dt, dd);
  });

  section.append(grid);
  return section;
}

function renderTwoColumnKeyValueGrid(title, leftRows, rightRows) {
  const section = document.createElement("section");
  section.className = "report-section";

  const heading = document.createElement("h2");
  heading.textContent = title;
  section.append(heading);

  const columns = document.createElement("div");
  columns.className = "report-two-column-grid";

  [leftRows, rightRows].forEach((rows) => {
    const grid = document.createElement("dl");
    grid.className = "report-grid";

    rows.forEach(([label, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = text(value);
      decorateOutcomeElement(dd, value);
      grid.append(dt, dd);
    });

    columns.append(grid);
  });

  section.append(columns);
  return section;
}

function renderMeasure(measure, index) {
  const section = document.createElement("section");
  section.className = "report-subsection";
  section.append(Object.assign(document.createElement("h3"), { textContent: `Measure ${index + 1}` }));

  const grid = document.createElement("dl");
  grid.className = "report-grid";
  [
    ["Type", measure.type],
    ["Sightglass?", measure.sightglass],
    ["Serial number", measure.serialNumber],
    ["Volume (L)", measure.volume],
    ["Certificate number", measure.certificateNumber],
    ["Certificate expiry", measure.certificateExpiry]
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text(value);
    if (label !== "Sightglass") decorateOutcomeElement(dd, value);
    grid.append(dt, dd);
  });
  section.append(grid);
  return section;
}

function visibleHoseSections(performanceCode) {
  const code = (performanceCode || "").toUpperCase();
  if (code === "A" || ["E", "F", "G", "H"].includes(code)) return ["verification", "compliance"];
  if (code === "B") return ["measureCheck", "compliance"];
  return ["measureCheck", "verification", "compliance"];
}

function formatPerformanceCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return PERFORMANCE_CODE_LABELS[code] || value;
}


function instrumentLabel(instrument, index) {
  const numbering = (instrument.numbering || "").trim();
  if (!numbering) return `Instrument ${index + 1}`;
  const clean = numbering
    .split("/")
    .map((n) => n.trim())
    .filter(Boolean)
    .join("/");
  if (!clean) return `Instrument ${index + 1}`;
  return instrument.type === "Pressurised" ? `Dispenser ${clean}` : `Pump ${clean}`;
}

function gradeStyleKey(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function renderHose(hose, index, instrument, dataset) {
  const section = document.createElement("section");
  section.className = "report-subsection";
  const heading = document.createElement("h4");
  heading.textContent = `${text(hose.number, "No POS")}/${text(hose.grade, "No grade")}`;
  heading.classList.add("grade-themed");
  const headingGradeKey = gradeStyleKey(hose.grade);
  if (headingGradeKey) heading.dataset.grade = headingGradeKey;
  section.append(heading);

  const details = document.createElement("dl");
  details.className = "report-grid";
  const rows = [
    [
      "Hose serial",
      `${text(instrument.serialNumber, "")}${instrument.serialNumber && hose.hoseSerialSuffix ? "-" : ""}${text(hose.hoseSerialSuffix, "")}` || "—"
    ],
    ["Unit price (¢/L)", hose.unitPrice],
    ["Start tote", hose.startTote],
    ["End tote", hose.endTote],
    ["Qmin (L/min)", hose.qmin],
    ["Qmax (L/min)", hose.qmax],
    ["Maximum achievable rate (L/min) (clause 3.8)", hose.maxRate],
    ["Performance code", formatPerformanceCode(pick(hose, ["measureCheck", "performanceCode"], ""))]
  ];

  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text(value);
    decorateOutcomeElement(dd, value);
    details.append(dt, dd);
  });
  section.append(details);

  const visibleSections = visibleHoseSections(pick(hose, ["measureCheck", "performanceCode"], ""));

  if (visibleSections.includes("measureCheck")) {
    const measureCheckTitle = document.createElement("h5");
    measureCheckTitle.textContent = "Measure Check";
    section.append(measureCheckTitle, renderRunsTable(pick(hose, ["measureCheck", "checks"], []), (_, idx) => String(idx + 1), false, dataset));
  }

  if (visibleSections.includes("verification")) {
    const verificationRows = [
      ...pick(hose, ["verification", "deliveries"], []).map(function(row, idx) { return ({ label: String(idx + 1), ...row }); }),
      { label: "Preset", ...pick(hose, ["verification", "preset"], {}) }
    ];
    if ((pick(instrument, ["type"], "") || "") === "Suction") {
      verificationRows.push({ label: "Gas Elim.", ...pick(hose, ["verification", "gasElimination"], {}) });
    }

    const verificationTitle = document.createElement("h5");
    verificationTitle.textContent = "Verification";
    section.append(verificationTitle, renderRunsTable(verificationRows, null, true, dataset));

    const averageError = average([
      pick(hose, ["verification", "deliveries", 0, "efd"], ""),
      pick(hose, ["verification", "deliveries", 1, "efd"], ""),
      pick(hose, ["verification", "deliveries", 2, "efd"], "")
    ]);
    const verificationMeta = document.createElement("dl");
    verificationMeta.className = "report-grid";
    [
      ["Average error (EAV) (Clause 3.12)", averageError],
      ["Anti-drain/Hose-dilation fuel volume (mL) (Clause 3.13)", pick(hose, ["verification", "antiDrainMl"], "")],
      ["Existing verification mark (if reverifying)", pick(hose, ["verification", "reverification"], "")]
    ].forEach(([label, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = text(value);
      decorateOutcomeElement(dd, value);
      verificationMeta.append(dt, dd);
    });
    section.append(verificationMeta);
  }

  if (visibleSections.includes("compliance")) {
    const complianceTitle = document.createElement("h5");
    complianceTitle.textContent = "Compliance";
    const complianceGrid = document.createElement("dl");
    complianceGrid.className = "report-grid";
    [
      ...COMPLIANCE_QUESTIONS.map((question, idx) => [question, pick(hose, ["compliance", `q${idx + 1}`], "")]),
      ["Overall result", pick(hose, ["compliance", "overall"], "")]
    ].forEach(([label, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = text(value);
      decorateOutcomeElement(dd, value);
      complianceGrid.append(dt, dd);
    });
    section.append(complianceTitle, complianceGrid);
  }

  return section;
}

function renderRunsTable(rows, runLabel = null, includeEd = false, dataset = null) {
  const table = document.createElement("table");
  table.className = "report-table";
  const header = document.createElement("thead");
  header.innerHTML = `<tr><th>Run</th><th>VFD</th><th>VREF</th><th>EFD (%)</th>${includeEd ? "<th>ED (%)</th>" : ""}</tr>`;
  table.append(header);

  const body = document.createElement("tbody");
  rows.forEach((row, idx) => {
    const tr = document.createElement("tr");
    const mpe = Number(pick(dataset, ["testDetails", "mpe"], ""));
    const efdValue = Number(row.efd);
    if (Number.isFinite(mpe) && Number.isFinite(efdValue) && Math.abs(efdValue) > Math.abs(mpe)) {
      tr.classList.add("row-error");
    }
    const label = runLabel ? runLabel(row, idx) : text(row.label, String(idx + 1));
    tr.innerHTML = `<td>${label}</td><td>${text(row.vfd)}</td><td>${text(row.vref)}</td><td>${text(row.efd)}</td>${includeEd ? `<td>${text(row.ed)}</td>` : ""}`;
    [...tr.children].forEach((cell) => decorateOutcomeElement(cell, cell.textContent));
    body.append(tr);
  });
  table.append(body);
  return table;
}

function average(values) {
  const parsed = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (!parsed.length) return "";
  return (parsed.reduce((sum, value) => sum + value, 0) / parsed.length).toFixed(2);
}

function renderInstrument(instrument, index, dataset) {
  const section = document.createElement("section");
  section.className = "report-section";

  const heading = document.createElement("h2");
  heading.textContent = instrumentLabel(instrument, index);
  section.append(heading);

  const columns = document.createElement("div");
  columns.className = "instrument-columns";

  const detailsColumn = document.createElement("section");
  detailsColumn.className = "report-subsection";
  detailsColumn.append(Object.assign(document.createElement("h3"), { textContent: "Instrument details" }));

  const detailsGrid = document.createElement("dl");
  detailsGrid.className = "report-grid";
  [
    ["Manufacturer", instrument.manufacturer],
    ["Make", instrument.make],
    ["Model number", instrument.modelNumber],
    ["Serial number", instrument.serialNumber],
    ["Manufacture date", instrument.manufactureDate],
    ["NMI pattern approval", instrument.nmiPatternApproval],
    ["Products approved for delivery", instrument.productsApproved],
    ["Type of system", instrument.type]
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text(value);
    decorateOutcomeElement(dd, value);
    detailsGrid.append(dt, dd);
  });
  detailsColumn.append(detailsGrid);

  const characteristicsColumn = document.createElement("section");
  characteristicsColumn.className = "report-subsection";
  characteristicsColumn.append(Object.assign(document.createElement("h3"), { textContent: "General chacteristics" }));

  const characteristicsGrid = document.createElement("dl");
  characteristicsGrid.className = "report-grid";
  VISUAL_INSPECTION_QUESTIONS.forEach((question, idx) => {
    const dt = document.createElement("dt");
    dt.textContent = question;
    const dd = document.createElement("dd");
    dd.textContent = text(pick(instrument, ["inspection", `q${idx + 1}`], ""));
    decorateOutcomeElement(dd, dd.textContent);
    characteristicsGrid.append(dt, dd);
  });
  characteristicsColumn.append(characteristicsGrid);

  columns.append(detailsColumn, characteristicsColumn);
  section.append(columns);

  const hosesWrapper = document.createElement("div");
  hosesWrapper.className = "report-hoses";
  if (!instrument.hoses || instrument.hoses.length === 0) {
    const none = document.createElement("p");
    none.textContent = "No hoses.";
    hosesWrapper.append(none);
  } else {
    const hoseGrid = document.createElement("div");
    hoseGrid.className = "report-card-grid";
    instrument.hoses.forEach((hose, hoseIndex) => hoseGrid.append(renderHose(hose, hoseIndex, instrument, dataset)));
    hosesWrapper.append(hoseGrid);
  }

  section.append(hosesWrapper);
  return section;
}

function renderReport() {
  const root = document.getElementById("reportContent");
  const dataset = loadDataset();

  if (!dataset) {
    root.innerHTML = "<p>No local dataset found. Open the app and load or enter data first.</p>";
    return;
  }

  root.replaceChildren(
    renderTwoColumnKeyValueGrid("Test Details", [
      ["Date of test", pick(dataset, ["testDetails", "date"], "")],
      ["Job number", pick(dataset, ["testDetails", "jobNumber"], "")],
      ["Type", pick(dataset, ["testDetails", "type"], "")],
      ["Verifier's name", pick(dataset, ["testDetails", "verifierName"], "")],
      ["Registration number", pick(dataset, ["testDetails", "registrationNumber"], "")],
      ["Verification mark", pick(dataset, ["testDetails", "verificationMark"], "")],
      ["Operator", pick(dataset, ["testDetails", "operator"], "")],
      ["Maximum permissible error (MPE) %", pick(dataset, ["testDetails", "mpe"], "")]
    ], [
      ["Site name", pick(dataset, ["testDetails", "siteName"], "")],
      ["Site number", pick(dataset, ["testDetails", "siteNumber"], "")],
      ["Contact on site", pick(dataset, ["testDetails", "contactOnSite"], "")],
      ["Street Address", pick(dataset, ["testDetails", "streetAddress"], "")],
      ["Suburb", pick(dataset, ["testDetails", "suburb"], "")],
      ["State", pick(dataset, ["testDetails", "state"], "")],
      ["Post Code", pick(dataset, ["testDetails", "postCode"], "")],
      ["Comments", pick(dataset, ["testDetails", "comments"], "")]
    ])
  );

  const measuresSection = document.createElement("section");
  measuresSection.className = "report-section";
  measuresSection.append(Object.assign(document.createElement("h2"), { textContent: "Measures" }));
  if (!dataset.measures || !dataset.measures.length) {
    measuresSection.append(Object.assign(document.createElement("p"), { textContent: "No measures." }));
  } else {
    const measureGrid = document.createElement("div");
    measureGrid.className = "report-card-grid";
    dataset.measures.forEach((measure, index) => measureGrid.append(renderMeasure(measure, index)));
    measuresSection.append(measureGrid);
  }
  root.append(measuresSection);

  const instrumentsWrapper = document.createElement("section");
  instrumentsWrapper.className = "report-section";
  instrumentsWrapper.append(Object.assign(document.createElement("h2"), { textContent: "Instruments" }));
  if (!dataset.instruments || !dataset.instruments.length) {
    instrumentsWrapper.append(Object.assign(document.createElement("p"), { textContent: "No instruments." }));
  } else {
    dataset.instruments.forEach((instrument, index) => instrumentsWrapper.append(renderInstrument(instrument, index, dataset)));
  }

  root.append(instrumentsWrapper);
}

renderReport();
bindExportButtons();
