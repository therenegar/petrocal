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
  "Checking facility for indicating devices",
  "Zero setting",
  "Price computing",
  "Nozzle cut-off",
  "Interlock",
  "Pre-set indications"
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
const OPERATOR_LOGOS = [
  ["ampol", "res/logos/icon-ampol.svg"],
  ["bp", "res/logos/icon-bp.svg"],
  ["caltex", "res/logos/icon-caltex.svg"],
  ["eg", "res/logos/icon-eg.svg"],
  ["liberty", "res/logos/icon-liberty.svg"],
  ["mobil", "res/logos/icon-mobil.svg"],
  ["shell", "res/logos/icon-shell.svg"],
  ["united", "res/logos/icon-united.svg"]
];

const SUBSCRIPT_TOKENS = new Map([
  ["Qmin", ["Q", "min"]],
  ["Qmax", ["Q", "max"]],
  ["VFD", ["V", "FD"]],
  ["VREF", ["V", "REF"]],
  ["ED", ["E", "D"]],
  ["EAV", ["E", "AV"]],
  ["EFD", ["E", "FD"]]
]);

function appendSubscriptText(target, text) {
  const value = String(text ?? "");
  const fragment = document.createDocumentFragment();
  const tokenRegex = /\b(Qmin|Qmax|VFD|VREF|ED|EAV|EFD)\b/g;
  let cursor = 0;
  let match = tokenRegex.exec(value);
  while (match) {
    if (match.index > cursor) fragment.append(value.slice(cursor, match.index));
    const [base, sub] = SUBSCRIPT_TOKENS.get(match[0]) || [match[0], ""];
    fragment.append(base);
    if (sub) {
      const subNode = document.createElement("sub");
      subNode.textContent = sub;
      fragment.append(subNode);
    }
    cursor = match.index + match[0].length;
    match = tokenRegex.exec(value);
  }
  if (cursor < value.length) fragment.append(value.slice(cursor));
  target.replaceChildren(fragment);
}

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

function getOperatorLogoPath(operatorName) {
  const value = String(operatorName || "").toLowerCase();
  const match = OPERATOR_LOGOS.find(([needle]) => value.includes(needle));
  return match ? match[1] : "";
}

function pick(obj, path, fallback = undefined) {
  let current = obj;
  for (let i = 0; i < path.length; i += 1) {
    if (current === null || current === undefined) return fallback;
    current = current[path[i]];
  }
  return current === undefined ? fallback : current;
}


function syncPrintBusinessName(dataset) {
  const heading = document.querySelector("h1.header-licensee");
  if (!heading) return;

  heading.textContent = text(pick(dataset, ["form6Details", "businessName"], ""), "");
}

function syncPrintLicenseeLogo(dataset) {
  const logo = document.getElementById("licenseePrintLogo");
  if (!logo) return;

  const licenseeName = String(pick(dataset, ["form6Details", "businessName"], "") || "").toLowerCase();
  const companyLogos = [
    ["nqpetro", "res/logos/logo-nqpetro.svg"],
    ["psa", "res/logos/logo-psa.svg"],
    ["gilbarco", "res/logos/logo-gilbarco.svg"]
  ];
  const match = companyLogos.find(([name]) => licenseeName.includes(name));

  logo.src = match ? match[1] : "res/logo.svg";
  logo.alt = match ? `${match[0]} logo` : "PetroCAL";
}

function syncPrintOperatorLogo(dataset) {
  const logo = document.getElementById("operatorPrintLogo");
  if (!logo) return;

  const operatorName = pick(dataset, ["testDetails", "operator"], "");
  const logoPath = getOperatorLogoPath(operatorName);
  logo.hidden = !logoPath;

  if (logoPath) {
    logo.src = logoPath;
  } else {
    logo.removeAttribute("src");
  }
}

function decorateOutcomeElement(element, value) {
  const val = String(value || "").trim().toLowerCase();
  if (["yes", "pass"].includes(val)) element.classList.add("value-good");
  if (["no", "fail"].includes(val)) element.classList.add("value-bad");
}

function verificationMarkWithDateCode(dataset) {
  const baseMark = String(pick(dataset, ["testDetails", "verificationMark"], "") || "").trim();
  if (!baseMark) return "";
  const dateSource = parseTestDetailsDateForVerificationCode(dataset) || new Date();
  const monthCode = String.fromCharCode(65 + dateSource.getMonth());
  const yearCode = String(dateSource.getFullYear()).slice(-1);
  return `${baseMark}${monthCode}${yearCode}`;
}

function parseTestDetailsDateForVerificationCode(dataset) {
  const raw = String(pick(dataset, ["testDetails", "date"], "") || "").trim();
  if (!raw) return null;

  const ddMmYyyyMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    ) return date;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    ) return date;
  }

  return null;
}

function exceedsMpe(dataset, value) {
  const mpe = Number(pick(dataset, ["testDetails", "mpe"], ""));
  const numeric = Number(value);
  if (!Number.isFinite(mpe) || !Number.isFinite(numeric)) return false;
  return Math.abs(numeric) > Math.abs(mpe);
}


function antiDrainLimitForQmax(qmax) {
  const parsedQmax = Number(qmax);
  if (!Number.isFinite(parsedQmax)) return null;
  return parsedQmax <= 60 ? 20 : 50;
}

function antiDrainExceedsLimit(hose, value) {
  const antiDrainValue = Number(value);
  const limit = antiDrainLimitForQmax(hose.qmax);
  if (!Number.isFinite(antiDrainValue) || !Number.isFinite(limit)) return false;
  return antiDrainValue > limit;
}

function asFiniteNumber(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDifferenceLitres(startValue, endValue) {
  const start = asFiniteNumber(startValue);
  const end = asFiniteNumber(endValue);
  if (start === null || end === null) return "—";
  return `${end - start} L`;
}

function formatWithUnit(value, unit) {
  if (value === null || value === undefined) return "—";
  const raw = String(value).trim();
  if (!raw) return "—";
  return `${raw} ${unit}`;
}

function calculateEd(eav, efd) {
  const averageError = Number(eav);
  const gasEliminationEfd = Number(efd);
  if (!Number.isFinite(averageError) || !Number.isFinite(gasEliminationEfd)) return "";
  return (averageError - gasEliminationEfd).toFixed(2);
}

function hasPresetIndications(hose) {
  return String(pick(hose, ["compliance", "q6"], "") || "").trim().toUpperCase() !== "N/A";
}

function hoseDeliveryRows(hose, sectionKey, instrumentType) {
  const rows = [
    { label: "#1", ...pick(hose, [sectionKey, "deliveries", 0], {}) },
    { label: "#2", ...pick(hose, [sectionKey, "deliveries", 1], {}) },
    { label: "#3", ...pick(hose, [sectionKey, "deliveries", 2], {}) },
    { label: "#4", ...pick(hose, [sectionKey, "deliveries", 3], {}) }
  ];
  if (hasPresetIndications(hose)) {
    rows.push({ label: "Preset", ...pick(hose, [sectionKey, "preset"], {}) });
  }
  if (String(instrumentType || "").trim().toLowerCase() === "suction") {
    const averageError = average([
      pick(hose, [sectionKey, "deliveries", 0, "efd"], ""),
      pick(hose, [sectionKey, "deliveries", 1, "efd"], ""),
      pick(hose, [sectionKey, "deliveries", 2, "efd"], "")
    ]);
    const gasElimination = pick(hose, [sectionKey, "gasElimination"], {});
    const calculatedEd = calculateEd(averageError, gasElimination.efd);
    rows.push({
      label: "Gas elim.",
      ...gasElimination,
      ed: calculatedEd
    });
  }
  return rows;
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
    appendSubscriptText(dt, label);
    const dd = document.createElement("dd");
    dd.textContent = text(value);
    decorateOutcomeElement(dd, value);
    grid.append(dt, dd);
  });

  section.append(grid);
  return section;
}

function renderTwoColumnKeyValueGrid(title, leftRows, rightRows, fullWidthRows = []) {
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

  if (fullWidthRows.length) {
    const fullWidthGrid = document.createElement("dl");
    fullWidthGrid.className = "report-grid";

    fullWidthRows.forEach(([label, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = text(value);
      decorateOutcomeElement(dd, value);
      fullWidthGrid.append(dt, dd);
    });

    section.append(fullWidthGrid);
  }

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
    ["Volume", formatWithUnit(measure.volume, "L")],
    ["Reg. 13 Certificate number", measure.certificateNumber],
    ["Certificate expiry", measure.certificateExpiry]
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text(value);
    if (!label.toLowerCase().startsWith("sightglass")) decorateOutcomeElement(dd, value);
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
  return instrument.type === "Pressurised" ? `⛽ Dispenser ${clean}` : `⛽ Pump ${clean}`;
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
  heading.textContent = `${text(hose.number, "No #")} / ${text(hose.grade, "Grade unspecified")}`;
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
    ["Unit price", formatWithUnit(hose.unitPrice, "¢/L")],
    ["Start tote", hose.startTote],
    ["End tote", hose.endTote],
    ["Vol. used for testing", formatDifferenceLitres(hose.startTote, hose.endTote)],
    ["Qmin", formatWithUnit(hose.qmin, "L/min")],
    ["Qmax", formatWithUnit(hose.qmax, "L/min")],
    ["Max achievable rate", formatWithUnit(hose.maxRate, "L/min")],
    ["Performance code", pick(hose, ["measureCheck", "performanceCode"], "")]
  ];
  if ((pick(hose, ["measureCheck", "performanceCode"], "") || "").toUpperCase() === "H") {
    rows.push(["Comments", pick(hose, ["measureCheck", "comments"], "")]);
  }

  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    appendSubscriptText(dt, label);
    const dd = document.createElement("dd");
    if (label === "Performance code") {
      const code = text(value).trim().toUpperCase();
      const fullLabel = formatPerformanceCode(code);
      dd.textContent = code || "—";
      dd.title = fullLabel;
    } else {
      dd.textContent = text(value);
    }
    decorateOutcomeElement(dd, value);
    details.append(dt, dd);
  });
  section.append(details);

  const visibleSections = visibleHoseSections(pick(hose, ["measureCheck", "performanceCode"], ""));

  if (visibleSections.includes("measureCheck")) {
    const measureCheckTitle = document.createElement("h5");
    measureCheckTitle.textContent = "In-service Inspection";
    section.append(measureCheckTitle, renderRunsTable(hoseDeliveryRows(hose, "measureCheck", instrument.type), null, true, dataset));

    const measureCheckAverage = average([
      pick(hose, ["measureCheck", "deliveries", 0, "efd"], ""),
      pick(hose, ["measureCheck", "deliveries", 1, "efd"], ""),
      pick(hose, ["measureCheck", "deliveries", 2, "efd"], "")
    ]);
    const measureCheckMeta = document.createElement("dl");
    measureCheckMeta.className = "report-grid";
    const measureCheckAntiDrain = pick(hose, ["measureCheck", "antiDrainMl"], "");
    [
      {
        label: "Average error runs 1-3 (EAV)",
        value: formatWithUnit(measureCheckAverage, "%"),
        numericValue: measureCheckAverage
      },
      {
        label: "Anti-drain/Hose-dilation fuel vol.",
        value: formatWithUnit(measureCheckAntiDrain, "mL"),
        numericValue: measureCheckAntiDrain
      }
    ].forEach(({ label, value, numericValue }) => {
      const dt = document.createElement("dt");
      appendSubscriptText(dt, label);
      const dd = document.createElement("dd");
      dd.textContent = text(value);
      if (label.startsWith("Average error") && exceedsMpe(dataset, numericValue ?? value)) dd.classList.add("value-bad");
      if (label.startsWith("Anti-drain")) {
        const isAntiDrainValuePresent = String(numericValue || "").trim() !== "";
        const antiDrainIsBad = antiDrainExceedsLimit(hose, numericValue);
        if (antiDrainIsBad) dd.classList.add("value-bad");
        else if (isAntiDrainValuePresent) dd.classList.add("value-good");
      }
      decorateOutcomeElement(dd, value);
      measureCheckMeta.append(dt, dd);
    });
    section.append(measureCheckMeta);
  }

  if (visibleSections.includes("verification")) {
    const verificationTitle = document.createElement("h5");
    verificationTitle.textContent = "Verification";
    section.append(verificationTitle);

    const verificationMark = document.createElement("div");
    verificationMark.className = "verification-mark";
    verificationMark.title = "Verification mark";
    verificationMark.textContent = verificationMarkWithDateCode(dataset);
    section.append(verificationMark, renderRunsTable(hoseDeliveryRows(hose, "verification", instrument.type), null, true, dataset));

    const averageError = average([
      pick(hose, ["verification", "deliveries", 0, "efd"], ""),
      pick(hose, ["verification", "deliveries", 1, "efd"], ""),
      pick(hose, ["verification", "deliveries", 2, "efd"], "")
    ]);
    const verificationMeta = document.createElement("dl");
    verificationMeta.className = "report-grid";
    const verificationAntiDrain = pick(hose, ["verification", "antiDrainMl"], "");
    [
      { label: "Average error runs 1-3 (EAV)", value: formatWithUnit(averageError, "%"), numericValue: averageError },
      {
        label: "Anti-drain/Hose-dilation fuel vol.",
        value: formatWithUnit(verificationAntiDrain, "mL"),
        numericValue: verificationAntiDrain
      },
      { label: "Existing verification mark", value: pick(hose, ["verification", "reverification"], "") }
    ].forEach(({ label, value, numericValue }) => {
      const dt = document.createElement("dt");
      appendSubscriptText(dt, label);
      const dd = document.createElement("dd");
      dd.textContent = text(value);
      if (label.startsWith("Average error") && exceedsMpe(dataset, numericValue ?? value)) dd.classList.add("value-bad");
      if (label.startsWith("Anti-drain")) {
        const isAntiDrainValuePresent = String(numericValue || "").trim() !== "";
        const antiDrainIsBad = antiDrainExceedsLimit(hose, numericValue);
        if (antiDrainIsBad) dd.classList.add("value-bad");
        else if (isAntiDrainValuePresent) dd.classList.add("value-good");
      }
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
  header.innerHTML = `<tr><th>Run</th><th></th><th></th><th></th>${includeEd ? "<th></th>" : ""}</tr>`;
  const headerCells = header.querySelectorAll("th");
  appendSubscriptText(headerCells[1], "VFD");
  appendSubscriptText(headerCells[2], "VREF");
  appendSubscriptText(headerCells[3], "EFD (%)");
  if (includeEd && headerCells[4]) appendSubscriptText(headerCells[4], "ED (%)");
  table.append(header);

  const body = document.createElement("tbody");
  rows.forEach((row, idx) => {
    const tr = document.createElement("tr");
    if (exceedsMpe(dataset, row.efd)) {
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
  characteristicsColumn.append(Object.assign(document.createElement("h3"), { textContent: "Visual inspection (clause 3.1)" }));

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

function createReportIntro() {
  const intro = document.createElement("p");
  intro.textContent = "A preview of the Test Report is shown below. Click Print Report (or the Print function in your browser) to output a specially formatted print version, or turn into a PDF file.";
  return intro;
}

function renderReport() {
  const root = document.getElementById("reportContent");
  const dataset = loadDataset();

  if (!dataset) {
    syncPrintOperatorLogo(null);
    syncPrintBusinessName(null);
    syncPrintLicenseeLogo(null);
    root.replaceChildren(
      createReportIntro(),
      Object.assign(document.createElement("p"), { textContent: "No local dataset found. Open the app and load or enter data first." })
    );
    return;
  }

  syncPrintOperatorLogo(dataset);
  syncPrintBusinessName(dataset);
  syncPrintLicenseeLogo(dataset);

  root.replaceChildren(
    createReportIntro(),
    renderTwoColumnKeyValueGrid("Test Details", [
      ["Date of test", pick(dataset, ["testDetails", "date"], "")],
      ["Job number", pick(dataset, ["testDetails", "jobNumber"], "")],
      ["Type", pick(dataset, ["testDetails", "type"], "")],
      ["Maximum permissible error (MPE)", formatWithUnit(pick(dataset, ["testDetails", "mpe"], ""), "%")],
      ["Verifier's name", pick(dataset, ["testDetails", "verifierName"], "")],
      ["Registration number", pick(dataset, ["testDetails", "registrationNumber"], "")],
      ["Verification mark", pick(dataset, ["testDetails", "verificationMark"], "")],
    ], [
      ["Operator", pick(dataset, ["testDetails", "operator"], "")],
      ["Site name", pick(dataset, ["testDetails", "siteName"], "")],
      ["Site number", pick(dataset, ["testDetails", "siteNumber"], "")],
      ["Contact on site", pick(dataset, ["testDetails", "contactOnSite"], "")],
      ["Street Address", pick(dataset, ["testDetails", "streetAddress"], "")],
      ["Suburb", pick(dataset, ["testDetails", "suburb"], "")],
      ["State", pick(dataset, ["testDetails", "state"], "")],
      ["Post Code", pick(dataset, ["testDetails", "postCode"], "")]
    ], [
      ["Comments", pick(dataset, ["testDetails", "comments"], "")],
    ])
  );

  const measuresSection = document.createElement("section");
  measuresSection.className = "report-section";
  measuresSection.append(Object.assign(document.createElement("h2"), { textContent: "Measures" }));
  measuresSection.append(Object.assign(document.createElement("p"), { textContent: "Details of the Reference Standards of Measurement used for testing (clause 2.0)." }));
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
