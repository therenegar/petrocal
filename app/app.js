const STORAGE_KEY = "petrocal.dataset.v3";
const REPORT_SESSION_KEY = "petrocal.report.dataset";
const IMPORT_SESSION_KEY = "petrocal.start.import.dataset";

const VIEW_STATE = {
  measuresTab: 0,
  instrumentsTab: 0,
  hosesInstrumentTab: 0,
  hosesTabByInstrument: {},
  hoseInnerTabByKey: {}
};

const VISUAL_INSPECTION_QUESTIONS = [
  "Does the dispenser comply with its certificate/s of approval (CofA)?",
  "Are all mandatory descriptive markings clearly and permanently on a data plate that is fixed to the dispenser?",
  "Is the instrument wire sealed in line with the CofA, is there a Verifier Mark on the meter(s)?",
  "Is the dispenser firmly fixed on its foundations?",
  "Are all panels secure and cover windows not broken?",
  "Do the indications of volume, unit price and total price correspond with the hose selected?",
  "Are all indications clearly visible under all conditions, day and night?",
  "Are the hoses in reasonable condition, e.g.: they are not badly chafed, split or worn?",
  "Does each nozzle terminate the delivery when returned to its holsters?",
  "Is the dispenser free from any leaks?",
  "For self-service systems: do the dispenser number/s correspond with the console?",
  "For continuous indicators: do the price-posting wheels line up with, and follow, the internal price-setting ranger lever?"
];

const COMPLIANCE_QUESTIONS = [
  "Checking facility for indicating devices (clause 3.2)",
  "Zero setting (clause 3.3)",
  "Price computing (clause 3.4)",
  "Nozzle cut-off (clause 3.5)",
  "Interlock (clause 3.6)",
  "Pre-set indications (clause 3.11)"
];

const PERFORMANCE_CODES = [
  { code: "A", label: "A- new instrument" },
  { code: "B", label: "B- routine inspection or contract requirement (without recalibration or repair)" },
  { code: "C", label: "C- routine inspection or contract requirement (within MPE but recalibrated)" },
  { code: "D", label: "D- outside MPE and recalibrated" },
  { code: "E", label: "E- instrument repaired" },
  { code: "F", label: "F- removed from trade" },
  { code: "G", label: "G- modified/upgraded" },
  { code: "H", label: "H- mark removed and not re-verified" }
];

const defaultDataset = () => ({
  version: 3,
  testDetails: {
    date: "",
    jobNumber: "",
    type: "",
    verifierName: "",
    registrationNumber: "",
    verificationMark: "",
    operator: "",
    mpe: 0.3,
    siteName: "",
    siteNumber: "",
    contactOnSite: "",
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
  measures: [],
  instruments: []
});


const SAMPLE_DATASET = JSON.parse(`{"version":3,"testDetails":{"date":"06/08/2024","jobNumber":54321,"type":"in-service inspection","verifierName":"Johnny Petro","registrationNumber":"VR-01234","verificationMark":"PET1234","operator":"Caltex (Chevron)","mpe":0.3,"siteName":"Caltex Laverton","siteNumber":"223344","contactOnSite":"Luke Smith","streetAddress":"1-11 Little Boundary Road","suburb":"Laverton","state":"VIC","postCode":3026,"comments":"Luke makes a really a good coffee."},"form6Details":{"licenceNumber":"","businessName":"","abnNumber":""},"measures":[{"type":"conical","sightglass":"no","serialNumber":"LMI 101","volume":15,"certificateNumber":"AB112233","certificateExpiry":"27/10/2030"},{"type":"cylindrical","sightglass":"yes","serialNumber":"LMI 202","volume":100,"certificateNumber":"AB334455","certificateExpiry":"1/12/2030"},{"type":"cylindrical","sightglass":"yes","serialNumber":"LMI 303","volume":200,"certificateNumber":"AB667788","certificateExpiry":"15/05/2030"}],"instruments":[{"numbering":"1/2","hoseCount":8,"manufacturer":"Wayne","make":"Helix 6000","modelNumber":"C(WH/LM)44-44R","serialNumber":"40-1007824","manufactureDate":"2018","nmiPatternApproval":"5/6A/232","productsApproved":["Petrol","Diesel","Bio-diesel","Ethanol","DEF/AdBlue"],"type":"Pressurised","inspection":{"q1":"Yes","q2":"Yes","q3":"Yes","q4":"Yes","q5":"Yes","q6":"Yes","q7":"Yes","q8":"Yes","q9":"Yes","q10":"Yes","q11":"Yes","q12":"N/A"},"hoses":[{"number":"1","grade":"ULP91","hoseSerialSuffix":"B1","unitPrice":"219.90","startTote":"941358","endTote":"941478","qmin":"4","qmax":"40","maxRate":"38","measureCheck":{"performanceCode":"C","checks":[{"measureId":"0","vfd":"15.04","vref":15,"efd":"0.27"},{"measureId":"0","vfd":"15.03","vref":15,"efd":"0.20"},{"measureId":"0","vfd":"15.04","vref":15,"efd":"0.27"}]},"verification":{"deliveries":[{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"14.99","vref":15,"efd":"-0.07"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"}],"preset":{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},"gasElimination":{"measureId":"","vfd":"","vref":15,"efd":"","ed":""},"antiDrainMl":"12","reverification":"ABC9876"},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"1","grade":"E-10","hoseSerialSuffix":"B2","unitPrice":"217.90","startTote":"390222","endTote":"390267","qmin":"4","qmax":"40","maxRate":"40","measureCheck":{"performanceCode":"B","checks":[{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"1","grade":"PULP98","hoseSerialSuffix":"B3","unitPrice":"242.90","startTote":"133740","endTote":"133785","qmin":"4","qmax":"40","maxRate":"40","measureCheck":{"performanceCode":"B","checks":[{"measureId":"0","vfd":"14.98","vref":15,"efd":"-0.13"},{"measureId":"0","vfd":"14.98","vref":15,"efd":"-0.13"},{"measureId":"0","vfd":"14.99","vref":15,"efd":"-0.07"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"1","grade":"Premium Diesel","hoseSerialSuffix":"B4","unitPrice":"192.90","startTote":"573440","endTote":"573740","qmin":"7","qmax":"70","maxRate":"55","measureCheck":{"performanceCode":"B","checks":[{"measureId":"1","vfd":100,"vref":"100.20","efd":"-0.20"},{"measureId":"1","vfd":100,"vref":"100.25","efd":"-0.25"},{"measureId":"1","vfd":100,"vref":"100.20","efd":"-0.20"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"2","grade":"ULP91","hoseSerialSuffix":"A1","unitPrice":"219.90","startTote":"326876","endTote":"326921","qmin":"4","qmax":"40","maxRate":"38","measureCheck":{"performanceCode":"B","checks":[{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"2","grade":"E-10","hoseSerialSuffix":"A2","unitPrice":"217.90","startTote":"793989","endTote":"794034","qmin":"4","qmax":"40","maxRate":"40","measureCheck":{"performanceCode":"B","checks":[{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.03","vref":15,"efd":"0.20"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"2","grade":"PULP98","hoseSerialSuffix":"A3","unitPrice":"242.90","startTote":"262140","endTote":"262260","qmin":"4","qmax":"40","maxRate":"40","measureCheck":{"performanceCode":"D","checks":[{"measureId":"0","vfd":"15.06","vref":15,"efd":"0.40"},{"measureId":"0","vfd":"15.05","vref":15,"efd":"0.33"},{"measureId":"0","vfd":"15.08","vref":15,"efd":"0.53"}]},"verification":{"deliveries":[{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"}],"preset":{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"8","reverification":"ABC9876"},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"2","grade":"Premium Diesel","hoseSerialSuffix":"A4","unitPrice":"192.90","startTote":"406844","endTote":"407144","qmin":"7","qmax":"70","maxRate":"55","measureCheck":{"performanceCode":"B","checks":[{"measureId":"1","vfd":100,"vref":"100.10","efd":"-0.10"},{"measureId":"1","vfd":100,"vref":"100.10","efd":"-0.10"},{"measureId":"1","vfd":100,"vref":"100.15","efd":"-0.15"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}}]}]}`);

let dataset = loadLocalDataset() || defaultDataset();
const urlParams = new URLSearchParams(window.location.search);
const START_MODE = urlParams.get("start") || "resume";
const LOAD_MODE = urlParams.get("load") || "";

const tabButtons = [...document.querySelectorAll(".tab")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];

const testDetailsPanel = document.getElementById("testDetails");
const measuresPanel = document.getElementById("measures");
const instrumentsPanel = document.getElementById("instruments");
const hosesPanel = document.getElementById("hoses");
const saveStatus = document.getElementById("saveStatus");

document.getElementById("loadDatasetBtn").addEventListener("click", () => {
  document.getElementById("datasetFileInput").click();
});

document.getElementById("datasetFileInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const imported = await importDatasetFromText(await file.text());
  if (!imported) {
    alert("Invalid JSON dataset file.");
  }
  event.target.value = "";
});

document.getElementById("saveDatasetBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildDatasetFilename();
  link.click();
  URL.revokeObjectURL(url);
});

document.querySelectorAll('a[href="report.html"], a[href="form6.html"]').forEach((link) => {
  link.addEventListener("click", () => {
    try {
      sessionStorage.setItem(REPORT_SESSION_KEY, JSON.stringify(dataset));
    } catch {
      // no-op
    }
  });
});

document.getElementById("clearDatasetBtn").addEventListener("click", () => {
  const confirmed = window.confirm("Start a new worksheet?\nWARNING: You will loose everything in the current worksheet, unless you've clicked Save to download the data file.");
  if (!confirmed) return;
  clearDatasetAndResetUi();
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => selectMainTab(button.dataset.tab));
});

function selectMainTab(tabId) {
  tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
  tabPanels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
}

function loadLocalDataset() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeDataset(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function normalizeDataset(input) {
  const base = defaultDataset();
  const normalized = {
    ...base,
    ...input,
    testDetails: { ...base.testDetails, ...(input?.testDetails || {}) },
    form6Details: { ...base.form6Details, ...(input?.form6Details || {}) },
    measures: Array.isArray(input?.measures) ? input.measures : [],
    instruments: Array.isArray(input?.instruments) ? input.instruments : []
  };

  normalized.instruments = normalized.instruments.map((instrument) => {
    const safe = {
      numbering: "",
      hoseCount: 1,
      manufacturer: "",
      make: "",
      modelNumber: "",
      serialNumber: "",
      manufactureDate: "",
      nmiPatternApproval: "",
      productsApproved: [],
      type: "",
      inspection: Object.fromEntries(VISUAL_INSPECTION_QUESTIONS.map((_, idx) => [`q${idx + 1}`, ""])),
      hoses: [],
      ...instrument
    };

    safe.hoseCount = Math.max(1, Math.min(10, Number(safe.hoseCount) || 1));
    safe.hoses = Array.isArray(safe.hoses) ? safe.hoses.map((hose) => normalizeHose(hose)) : [];
    enforceHoseCount(safe);
    return safe;
  });
  normalized.measures = normalized.measures.map((measure) => ({
    type: "",
    sightglass: "no",
    serialNumber: "",
    volume: "",
    certificateNumber: "",
    certificateExpiry: "",
    ...measure,
    certificateExpiry: toDisplayDate(measure?.certificateExpiry || "")
  }));

  return normalized;
}

function normalizeHose(hose = {}) {
  const base = {
    number: "",
    grade: "",
    hoseSerialSuffix: "",
    unitPrice: "",
    startTote: "",
    endTote: "",
    qmin: "",
    qmax: "",
    maxRate: "",
    measureCheck: {
      performanceCode: "",
      checks: [emptyCheck(), emptyCheck(), emptyCheck()]
    },
    verification: {
      deliveries: [emptyDelivery(), emptyDelivery(), emptyDelivery(), emptyDelivery()],
      preset: emptyDelivery(),
      gasElimination: { ...emptyDelivery(), ed: "" },
      antiDrainMl: "",
      reverification: ""
    },
    compliance: { ...Object.fromEntries(COMPLIANCE_QUESTIONS.map((_, idx) => [`q${idx + 1}`, ""])), overall: "Pass" }
  };

  const merged = {
    ...base,
    ...hose,
    measureCheck: {
      ...base.measureCheck,
      ...(hose.measureCheck || {}),
      checks: (hose.measureCheck?.checks || base.measureCheck.checks).map((item, idx) => ({
        ...base.measureCheck.checks[idx % 3],
        ...item
      }))
    },
    verification: {
      ...base.verification,
      ...(hose.verification || {}),
      deliveries: (hose.verification?.deliveries || base.verification.deliveries)
        .slice(0, 4)
        .map((item, idx) => ({ ...base.verification.deliveries[idx], ...item })),
      preset: { ...base.verification.preset, ...(hose.verification?.preset || {}) },
      gasElimination: { ...base.verification.gasElimination, ...(hose.verification?.gasElimination || {}) }
    },
    compliance: {
      ...base.compliance,
      ...(hose.compliance || {})
    }
  };

  while (merged.measureCheck.checks.length < 3) merged.measureCheck.checks.push(emptyCheck());
  while (merged.verification.deliveries.length < 4) merged.verification.deliveries.push(emptyDelivery());
  return merged;
}

function persistLocalDataset() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  try {
    sessionStorage.setItem(REPORT_SESSION_KEY, JSON.stringify(dataset));
  } catch {
    // no-op
  }
  saveStatus.textContent = `Locally saved @ ${formatNowDdMmYyyyHhMmSs()}`;
}

function updateAt(path, value) {
  let target = dataset;
  for (let i = 0; i < path.length - 1; i += 1) target = target[path[i]];
  target[path.at(-1)] = value;
  persistLocalDataset();
}

function schemaNameFromPath(path) {
  for (let i = path.length - 1; i >= 0; i -= 1) {
    if (typeof path[i] === "string") return path[i];
  }
  return "";
}

function setSchemaNameAttr(control, schemaName) {
  if (!schemaName) return;
  control.dataset.schemaName = schemaName;
}

function bindInput(input, path, parser = (v) => v, rerender = true) {
  setSchemaNameAttr(input, schemaNameFromPath(path));
  input.addEventListener("change", (event) => {
    updateAt(path, parser(event.target.value));
    if (rerender) renderAllPanels();
  });
}

function addMeasure() {
  dataset.measures.push({
    type: "",
    sightglass: "no",
    serialNumber: "",
    volume: "",
    certificateNumber: "",
    certificateExpiry: ""
  });
  VIEW_STATE.measuresTab = dataset.measures.length - 1;
  persistLocalDataset();
  renderMeasures();
  renderHoses();
}

function removeMeasure(index) {
  dataset.measures.splice(index, 1);
  VIEW_STATE.measuresTab = Math.max(0, Math.min(VIEW_STATE.measuresTab, dataset.measures.length - 1));
  persistLocalDataset();
  renderMeasures();
  renderHoses();
}

function addInstrument() {
  dataset.instruments.push(
    normalizeDataset({ instruments: [{}] }).instruments[0]
  );
  VIEW_STATE.instrumentsTab = dataset.instruments.length - 1;
  VIEW_STATE.hosesInstrumentTab = dataset.instruments.length - 1;
  persistLocalDataset();
  renderInstruments();
  renderHoses();
}

function removeInstrument(index) {
  dataset.instruments.splice(index, 1);
  VIEW_STATE.instrumentsTab = clampIndex(VIEW_STATE.instrumentsTab, dataset.instruments.length);
  VIEW_STATE.hosesInstrumentTab = clampIndex(VIEW_STATE.hosesInstrumentTab, dataset.instruments.length);
  persistLocalDataset();
  renderInstruments();
  renderHoses();
}

function clampIndex(index, length) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

function emptyCheck() {
  return { measureId: "", vfd: "", vref: "", efd: "" };
}

function emptyDelivery() {
  return { measureId: "", vfd: "", vref: "", efd: "" };
}

function enforceHoseCount(instrument) {
  instrument.hoses ||= [];
  while (instrument.hoses.length < instrument.hoseCount) instrument.hoses.push(normalizeHose());
  while (instrument.hoses.length > instrument.hoseCount) instrument.hoses.pop();
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

function measureLabel(measure, index) {
  const volume = measure.volume;
  return volume ? `${volume}L` : `Measure ${index + 1}`;
}

function parseInstrumentPositions(instrument) {
  return (instrument.numbering || "")
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normaliseSlashSeparatedNumbers(value) {
  return value
    .replaceAll(",", "/")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

function sanitiseFilenamePart(value, fallback) {
  const cleaned = String(value || "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .trim();
  return cleaned || fallback;
}

function dateForFilename(value) {
  const displayDate = toDisplayDate(value || "");
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(displayDate)) {
    const [day, month, year] = displayDate.split("/");
    return `${year}${month}${day}`;
  }
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${year}${month}${day}`;
}

function buildDatasetFilename() {
  const datePart = dateForFilename(dataset.testDetails?.date);
  const sitePart = sanitiseFilenamePart(dataset.testDetails?.siteName, "Unknown Site");
  const jobPart = sanitiseFilenamePart(dataset.testDetails?.jobNumber, "NoJob");
  return `${datePart}-${sitePart}-${jobPart}.cal`;
}

function toDisplayDate(value) {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
}

function formatNowDdMmYyyyHhMmSs() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function toInputDate(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  }
  return value;
}

function isValidDdMmYyyy(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value || "")) return false;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function restrictNumericInput(input) {
  input.addEventListener("input", () => {
    let value = input.value.replace(/[^\d.]/g, "");
    const firstDot = value.indexOf(".");
    if (firstDot !== -1) {
      value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replaceAll(".", "");
    }
    input.value = value;
  });
}

function getValidationKind(input) {
  if (input.dataset.validate) return input.dataset.validate;
  if (input.type === "number") return "number";
  return "text";
}

function ensureErrorNode(input) {
  let wrapper = input.parentElement;
  if (!wrapper || !wrapper.classList.contains("field-control-wrap")) {
    wrapper = document.createElement("div");
    wrapper.className = "field-control-wrap";
    input.replaceWith(wrapper);
    wrapper.append(input);
  }

  let node = wrapper.querySelector(".validation-message");
  if (!node) {
    node = document.createElement("div");
    node.className = "validation-message";
    wrapper.append(node);
  }
  return node;
}

function validateField(input) {
  const touched = input.dataset.touched === "true";
  if (!touched) {
    input.classList.remove("invalid-field");
    const node = ensureErrorNode(input);
    node.textContent = "";
    return;
  }

  const required = input.dataset.required !== "false";
  const value = input.value?.trim() || "";
  const kind = getValidationKind(input);
  let error = "";

  if (required && !value) {
    error = "This field is required";
  } else if (value) {
    if (kind === "number" && !/^\d+(\.\d+)?$/.test(value)) error = "Only numbers are allowed";
    if (kind === "date" && !isValidDdMmYyyy(value) && !isValidIsoDate(value)) error = "Use a valid date";
    if (kind === "numbering" && !/^[0-9/]+$/.test(value)) error = "Use numbers and / only";
  }

  const errorNode = ensureErrorNode(input);
  if (error) {
    input.classList.add("invalid-field");
    errorNode.textContent = error;
  } else {
    input.classList.remove("invalid-field");
    errorNode.textContent = "";
  }
}

function applySelectOutcomeStyle(select) {
  const value = String(select.value || "").trim().toLowerCase();
  select.classList.remove("select-good", "select-bad");
  if (value === "yes" || value === "pass") {
    select.classList.add("select-good");
    return;
  }
  if (value === "no" || value === "fail") {
    select.classList.add("select-bad");
  }
}

function attachOutcomeSelectStyling() {
  const selects = document.querySelectorAll("#appMain select");
  selects.forEach((select) => {
    if (!select.dataset.outcomeStyleBound) {
      select.addEventListener("change", () => applySelectOutcomeStyle(select));
      select.dataset.outcomeStyleBound = "true";
    }
    applySelectOutcomeStyle(select);
  });
}

function attachGlobalValidation() {
  const fields = document.querySelectorAll("#appMain input, #appMain select, #appMain textarea");
  fields.forEach((input) => {
    if (input.type === "hidden" || input.disabled) return;
    if (!input.dataset.required) input.dataset.required = "true";

    const kind = getValidationKind(input);
    if (!input.dataset.validationBound) {
      if (kind === "number") restrictNumericInput(input);
      input.addEventListener("blur", () => {
        input.dataset.touched = "true";
        validateField(input);
      });
      input.addEventListener("change", () => {
        if (input.dataset.touched === "true") validateField(input);
      });
      input.dataset.validationBound = "true";
    }
  });
}

function hoseLabel(hose, index) {
  const pos = hose.number?.toString().trim();
  const grade = hose.grade?.toString().trim();
  if (pos && grade) return `${pos} ${grade}`;
  if (pos) return `${pos}`;
  if (grade) return `${grade}`;
  return `Hose ${index + 1}`;
}

function gradeStyleKey(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function applyGradeStyle(element, gradeValue) {
  element.classList.add("grade-themed");
  const key = gradeStyleKey(gradeValue);
  if (key) element.dataset.grade = key;
  else delete element.dataset.grade;
}


function applyButtonIcon(button, iconPath, labelText) {
  button.classList.add("btn-with-icon");
  button.textContent = "";
  const icon = document.createElement("img");
  icon.className = "btn-icon";
  icon.src = iconPath;
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.textContent = labelText;
  button.append(icon, label);
}

function renderTabbedHeader(tabs, activeIndex, onChange, options = {}) {
  const { addAction = null, removeAction = null, extraActions = [] } = options;
  const row = document.createElement("div");
  row.className = "inner-tabs-row";

  const tabsWrap = document.createElement("div");
  tabsWrap.className = "inner-tabs";
  tabs.forEach((label, index) => {
    const btn = document.createElement("button");
    btn.className = `inner-tab ${index === activeIndex ? "active" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", () => onChange(index));
    tabsWrap.append(btn);
  });

  row.append(tabsWrap);

  const actionsWrap = document.createElement("div");
  actionsWrap.className = "tabs-toolbar";

  if (addAction) {
    const add = document.createElement("button");
    add.className = "btn small-btn";
    applyButtonIcon(add, "res/icon-add.svg", "Add another");
    add.addEventListener("click", addAction);
    actionsWrap.append(add);
  }

  if (removeAction) {
    const remove = document.createElement("button");
    remove.className = "btn small-btn";
    applyButtonIcon(remove, "res/icon-remove.svg", "Remove");
    remove.addEventListener("click", removeAction);
    actionsWrap.append(remove);
  }

  extraActions.forEach(({ label, onClick, icon = "" }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn small-btn";
    if (icon) applyButtonIcon(button, icon, label);
    else button.textContent = label;
    button.addEventListener("click", onClick);
    actionsWrap.append(button);
  });

  if (actionsWrap.childElementCount > 0) {
    row.append(actionsWrap);
  }

  return row;
}

function renderMoveControls(onLeft, onRight) {
  const wrap = document.createElement("div");
  wrap.className = "move-controls";
  const left = document.createElement("button");
  left.className = "btn small-btn";
  applyButtonIcon(left, "res/icon-move-left.svg", "Move");
  left.addEventListener("click", onLeft);
  const right = document.createElement("button");
  right.className = "btn small-btn";
  applyButtonIcon(right, "res/icon-move-right.svg", "Move");
  right.addEventListener("click", onRight);
  wrap.append(left, right);
  return wrap;
}

function buildLabelWithHelp(labelText, helpText = "") {
  const wrapper = document.createElement("span");
  wrapper.className = "label-with-help";
  const label = document.createElement("span");
  label.textContent = labelText;
  wrapper.append(label);

  if (helpText) {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "help-tip-trigger";
    trigger.textContent = "?";
    const tip = document.createElement("span");
    tip.className = "help-tip-bubble";
    tip.textContent = helpText;
    trigger.append(tip);
    wrapper.append(trigger);
  }

  return wrapper;
}

function moveInstrument(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= dataset.instruments.length) return;
  [dataset.instruments[index], dataset.instruments[target]] = [dataset.instruments[target], dataset.instruments[index]];
  VIEW_STATE.instrumentsTab = target;
  VIEW_STATE.hosesInstrumentTab = clampIndex(VIEW_STATE.hosesInstrumentTab, dataset.instruments.length);
  persistLocalDataset();
  renderInstruments();
  renderHoses();
}

function moveHose(instrument, hoseKey, direction) {
  const current = VIEW_STATE.hosesTabByInstrument[hoseKey];
  const target = current + direction;
  if (target < 0 || target >= instrument.hoses.length) return;
  [instrument.hoses[current], instrument.hoses[target]] = [instrument.hoses[target], instrument.hoses[current]];
  VIEW_STATE.hosesTabByInstrument[hoseKey] = target;
  persistLocalDataset();
  renderHoses();
}

function renderTestDetails() {
  const operatorLogos = [
    ["Ampol", "res/logos/icon-ampol.svg"],
    ["BP", "res/logos/icon-bp.svg"],
    ["Caltex", "res/logos/icon-caltex.svg"],
    ["EG", "res/logos/icon-eg.svg"],
    ["Liberty", "res/logos/icon-liberty.svg"],
    ["Mobil", "res/logos/icon-mobil.svg"],
    ["Shell", "res/logos/icon-shell.svg"],
    ["United", "res/logos/icon-united.svg"]
  ];
  const getOperatorLogoPath = (operatorName) => {
    const value = String(operatorName || "");
    const match = operatorLogos.find(([needle]) => value.includes(needle));
    return match ? match[1] : "";
  };

  const fields = [
    ["Date of test", "date", "text", null, "field-small"],
    ["Job number", "jobNumber", "number", null, "field-small"],
    ["Type of test", "type", "select", ["commissioning", "in-service inspection", "measure check", "verification"]],
    ["Verifier's name", "verifierName", "text", null, "field-medium"],
    ["Registration number", "registrationNumber", "text", null, "field-small"],
    ["Verification mark", "verificationMark", "text", null, "field-small"],
    [
      "Operator/owner",
      "operator",
      "select",
      [
        "Ampol",
        "BP",
        "Caltex (Chevron)",
        "EG Fuel",
        "Mobil (7-Eleven)",
        "Shell (VIVA)",
        "OTR (VIVA)",
        "Liberty Oil",
        "United",
        "Astron",
        "APCO",
        "Costco",
        "Freedom",
        "Gull",
        "IOR",
        "Matilda",
        "Metro Fuel",
        "Pacific Petroleum",
        "Pearl Energy",
        "Sinopec",
        "Speedway",
        "X-Convenience"
      ],
      "field-medium"
    ],
    ["Maximum permissible error (MPE) %", "mpe", "number", null, "field-small"],
    ["Site name", "siteName", "text", null, "field-medium"],
    ["Site number", "siteNumber", "text", null, "field-small"],
    ["Contact on site", "contactOnSite", "text", null, "field-medium"],
    ["Street Address", "streetAddress", "text", null, "field-large"],
    ["Suburb", "suburb", "text", null, "field-medium"],
    ["State", "state", "select", ["ACT", "NSW", "NT", "QLD", "TAS", "VIC", "WA"], "field-small"],
    ["Post Code", "postCode", "number", null, "field-small"],
    ["Comments", "comments", "textarea", null, "field-large"]
  ];

  const form = document.createElement("div");
  form.className = "form-grid";

  fields.forEach(([label, key, type, options, sizeClass]) => {
    const span = document.createElement("span");
    span.textContent = label;

    let control;
    if (type === "select") {
      control = document.createElement("select");
      control.append(new Option("", ""));
      options.forEach((option) => control.append(new Option(option, option)));
    } else if (type === "textarea") {
      control = document.createElement("textarea");
    } else {
      control = document.createElement("input");
      control.type = type;
      if (key === "date") control.placeholder = "DD/MM/YYYY";
      if (key === "mpe") control.step = "0.1";
      if (key === "jobNumber") control.min = 0;
      if (key === "postCode") {
        control.min = 1000;
        control.max = 9999;
        control.step = 1;
      }
      if (key === "date") control.dataset.validate = "date";
      if (type === "number") control.dataset.validate = "number";
    }
    if (sizeClass) control.classList.add(sizeClass);

    control.value = key === "date" ? toDisplayDate(dataset.testDetails[key]) : (dataset.testDetails[key] ?? "");
    bindInput(control, ["testDetails", key], (value) => {
      if (key === "date") return toDisplayDate(value);
      if (key === "postCode") {
        if (value === "") return "";
        const numeric = Math.trunc(Number(value));
        if (Number.isNaN(numeric)) return "";
        return Math.max(1000, Math.min(9999, numeric));
      }
      return type === "number" ? (value === "" ? "" : Number(value)) : value;
    });

    if (key === "operator") {
      const wrap = document.createElement("div");
      wrap.className = "operator-control-wrap";
      const logo = document.createElement("img");
      logo.className = "operator-logo";
      logo.alt = "Operator logo";
      const syncOperatorLogo = () => {
        const logoPath = getOperatorLogoPath(control.value);
        logo.hidden = !logoPath;
        if (logoPath) {
          logo.src = logoPath;
        } else {
          logo.removeAttribute("src");
        }
      };
      control.addEventListener("change", syncOperatorLogo);
      syncOperatorLogo();
      wrap.append(control, logo);
      form.append(span, wrap);
      return;
    }

    form.append(span, control);
  });

  testDetailsPanel.replaceChildren(form);
}

function renderMeasures() {
  const root = document.createElement("div");
  root.className = "stack";
  const intro = document.createElement("p");
  intro.textContent = "Details of the Reference Standards of Measurement in use (clause 2.0)";
  root.append(intro);

  if (dataset.measures.length === 0) {
    const addOnly = document.createElement("button");
    addOnly.className = "btn";
    addOnly.textContent = "Add Measure";
    addOnly.addEventListener("click", addMeasure);
    root.append(addOnly);
    measuresPanel.replaceChildren(root);
    return;
  }

  VIEW_STATE.measuresTab = clampIndex(VIEW_STATE.measuresTab, dataset.measures.length);

  root.append(
    renderTabbedHeader(
      dataset.measures.map((measure, index) => measureLabel(measure, index)),
      VIEW_STATE.measuresTab,
      (index) => {
        VIEW_STATE.measuresTab = index;
        renderMeasures();
      },
      {
        addAction: addMeasure,
        removeAction: () => removeMeasure(VIEW_STATE.measuresTab)
      }
    )
  );

  const current = dataset.measures[VIEW_STATE.measuresTab];
  const card = document.createElement("section");
  card.className = "card";
  const form = document.createElement("div");
  form.className = "form-grid";

  const typeSpan = document.createElement("span");
  typeSpan.textContent = "Type";
  const typeSelect = document.createElement("select");
  ["", "conical", "cylindrical"].forEach((option) => typeSelect.append(new Option(option, option)));
  typeSelect.classList.add("field-medium");
  setSchemaNameAttr(typeSelect, "type");
  typeSelect.value = current.type || "";
  typeSelect.addEventListener("change", () => {
    updateAt(["measures", VIEW_STATE.measuresTab, "type"], typeSelect.value);
    renderMeasures();
    renderHoses();
  });
  form.append(typeSpan, typeSelect);

  const sightglassSpan = document.createElement("span");
  sightglassSpan.textContent = "Has sightglass?";
  const sightglassSelect = document.createElement("select");
  sightglassSelect.classList.add("field-small");
  setSchemaNameAttr(sightglassSelect, "sightglass");
  sightglassSelect.append(new Option("", ""));
  sightglassSelect.append(new Option("Yes", "yes"));
  sightglassSelect.append(new Option("No", "no"));
  sightglassSelect.value = current.sightglass || "no";
  sightglassSelect.addEventListener("change", () => {
    updateAt(["measures", VIEW_STATE.measuresTab, "sightglass"], sightglassSelect.value || "no");
    renderHoses();
  });
  form.append(sightglassSpan, sightglassSelect);

  const fields = [
    ["Volume (L)", "volume", "number", "field-small"],
    ["Serial number", "serialNumber", "text", "field-medium"],
    ["Certificate number", "certificateNumber", "text", "field-medium"],
    ["Certificate expiry", "certificateExpiry", "text", "field-small"]
  ];

  fields.forEach(([label, key, type, sizeClass]) => {
    const span = key === "numbering"
      ? buildLabelWithHelp(
          label,
          "Enter each number assigned to the instrument at POS separated by a forward-slash /"
        )
      : document.createElement("span");
    if (key !== "numbering") span.textContent = label;
    const input = document.createElement("input");
    input.type = type;
    if (key === "certificateExpiry") input.placeholder = "DD/MM/YYYY";
    if (sizeClass) input.classList.add(sizeClass);
    if (type === "number") input.dataset.validate = "number";
    if (key === "certificateExpiry") input.dataset.validate = "date";
    input.value = key === "certificateExpiry" ? toDisplayDate(current[key]) : (current[key] ?? "");
    bindInput(input, ["measures", VIEW_STATE.measuresTab, key], (value) => {
      if (key === "certificateExpiry") return toDisplayDate(value);
      return type === "number" ? (value === "" ? "" : Number(value)) : value;
    });
    form.append(span, input);
  });

  card.append(form);
  root.append(card);
  measuresPanel.replaceChildren(root);
}

function renderInstruments() {
  const root = document.createElement("div");
  root.className = "stack";

  if (dataset.instruments.length === 0) {
    const addOnly = document.createElement("button");
    addOnly.className = "btn";
    addOnly.textContent = "Add Instrument";
    addOnly.addEventListener("click", addInstrument);
    root.append(addOnly);
    instrumentsPanel.replaceChildren(root);
    return;
  }

  VIEW_STATE.instrumentsTab = clampIndex(VIEW_STATE.instrumentsTab, dataset.instruments.length);

  root.append(
    renderTabbedHeader(
      dataset.instruments.map((instrument, index) => instrumentLabel(instrument, index)),
      VIEW_STATE.instrumentsTab,
      (index) => {
        VIEW_STATE.instrumentsTab = index;
        renderInstruments();
      },
      {
        addAction: addInstrument,
        removeAction: () => removeInstrument(VIEW_STATE.instrumentsTab),
        extraActions: [
          { label: "Move", icon: "res/icon-move-left.svg", onClick: () => moveInstrument(VIEW_STATE.instrumentsTab, -1) },
          { label: "Move", icon: "res/icon-move-right.svg", onClick: () => moveInstrument(VIEW_STATE.instrumentsTab, 1) }
        ]
      }
    )
  );

  const index = VIEW_STATE.instrumentsTab;
  const instrument = dataset.instruments[index];

  const card = document.createElement("section");
  card.className = "card";
  const columns = document.createElement("div");
  columns.className = "instrument-tab-columns";
  const detailsColumn = document.createElement("div");
  detailsColumn.className = "instrument-tab-column";
  const inspectionColumn = document.createElement("div");
  inspectionColumn.className = "instrument-tab-column";
  const form = document.createElement("div");
  form.className = "form-grid";

  const fields = [
    ["POS Numbering", "numbering", "text", "field-small"],
    ["Hose count", "hoseCount", "number", "field-small"],
    ["Manufacturer", "manufacturer", "text", "field-medium"],
    ["Make", "make", "text", "field-medium"],
    ["Model number", "modelNumber", "text", "field-medium"],
    ["Serial number", "serialNumber", "text", "field-medium"],
    ["Manufacture date", "manufactureDate", "text", "field-small"],
    ["NMI pattern approval number", "nmiPatternApproval", "text", "field-medium"]
  ];

  fields.forEach(([label, key, type, sizeClass]) => {
    const span = key === "numbering"
      ? buildLabelWithHelp(
          label,
          "Enter each number assigned to the instrument at POS separated by a forward-slash /"
        )
      : document.createElement("span");
    if (key !== "numbering") span.textContent = label;
    const input = document.createElement("input");
    input.type = type;
    if (key === "manufactureDate") input.placeholder = "DD/MM/YYYY";
    if (sizeClass) input.classList.add(sizeClass);
    if (type === "number") input.dataset.validate = "number";
    if (key === "manufactureDate") input.dataset.validate = "date";
    input.value = key === "manufactureDate" ? toDisplayDate(instrument[key]) : (instrument[key] ?? "");
    if (key === "hoseCount") {
      input.min = 1;
      input.max = 10;
      input.addEventListener("change", () => {
        const value = Math.max(1, Math.min(10, Number(input.value) || 1));
        updateAt(["instruments", index, "hoseCount"], value);
        dataset.instruments[index].hoseCount = value;
        enforceHoseCount(dataset.instruments[index]);
        persistLocalDataset();
        renderInstruments();
        renderHoses();
      });
    } else if (key === "numbering") {
      input.dataset.validate = "numbering";
      bindInput(input, ["instruments", index, key], normaliseSlashSeparatedNumbers);
    } else if (key === "manufactureDate") {
      bindInput(input, ["instruments", index, key], toDisplayDate);
    } else {
      bindInput(input, ["instruments", index, key], (value) => (type === "number" ? (value === "" ? "" : Number(value)) : value));
    }
    form.append(span, input);
  });

  const productsSpan = document.createElement("span");
  productsSpan.textContent = "Products approved for delivery";
  const productsSelect = document.createElement("select");
  productsSelect.classList.add("field-medium");
  setSchemaNameAttr(productsSelect, "productsApproved");
  productsSelect.multiple = true;
  productsSelect.size = 6;
  ["Petrol", "Diesel", "Bio-diesel", "Ethanol", "DEF/AdBlue", "Kerosene"].forEach((option) => {
    const opt = new Option(option, option);
    opt.selected = (instrument.productsApproved || []).includes(option);
    productsSelect.append(opt);
  });
  productsSelect.addEventListener("change", () => {
    updateAt(
      ["instruments", index, "productsApproved"],
      [...productsSelect.selectedOptions].map((option) => option.value)
    );
    renderInstruments();
  });
  form.append(productsSpan, productsSelect);

  const typeSpan = document.createElement("span");
  typeSpan.textContent = "Type of system";
  const typeSelect = document.createElement("select");
  typeSelect.classList.add("field-small");
  ["", "Pressurised", "Suction"].forEach((option) => typeSelect.append(new Option(option, option)));
  typeSelect.value = instrument.type || "";
  bindInput(typeSelect, ["instruments", index, "type"]);
  form.append(typeSpan, typeSelect);
  detailsColumn.append(form);

  const inspectionTitle = document.createElement("h4");
  inspectionTitle.textContent = "Visual Inspection (clause 3.1)";
  const inspection = document.createElement("div");
  inspection.className = "form-grid inspection-grid";

  VISUAL_INSPECTION_QUESTIONS.forEach((question, qIndex) => {
    const key = `q${qIndex + 1}`;
    const span = document.createElement("span");
    span.textContent = question;
    const select = document.createElement("select");
    select.classList.add("field-small");
    ["", "Yes", "No", "N/A"].forEach((value) => select.append(new Option(value, value)));
    select.value = instrument.inspection?.[key] || "";
    bindInput(select, ["instruments", index, "inspection", key]);
    inspection.append(span, select);
  });

  inspectionColumn.append(inspectionTitle, inspection);
  columns.append(detailsColumn, inspectionColumn);
  card.append(columns);
  root.append(card);
  instrumentsPanel.replaceChildren(root);
}

function renderHoses() {
  const root = document.createElement("div");
  root.className = "stack";

  if (dataset.instruments.length === 0) {
    root.textContent = "Add an instrument first to be able to view hoses.";
    hosesPanel.replaceChildren(root);
    return;
  }

  VIEW_STATE.hosesInstrumentTab = clampIndex(VIEW_STATE.hosesInstrumentTab, dataset.instruments.length);
  const instrument = dataset.instruments[VIEW_STATE.hosesInstrumentTab];
  enforceHoseCount(instrument);

  const instrumentSelector = document.createElement("select");
  setSchemaNameAttr(instrumentSelector, "instruments");
  dataset.instruments.forEach((ins, index) => instrumentSelector.append(new Option(instrumentLabel(ins, index), String(index))));
  instrumentSelector.value = String(VIEW_STATE.hosesInstrumentTab);
  instrumentSelector.addEventListener("change", () => {
    VIEW_STATE.hosesInstrumentTab = Number(instrumentSelector.value);
    renderHoses();
  });

  const selectorWrap = document.createElement("div");
  selectorWrap.className = "instrument-select";
  const selectorLabel = document.createElement("span");
  selectorLabel.textContent = "Choose instrument to view hoses: ";
  selectorWrap.append(selectorLabel, instrumentSelector);
  root.append(selectorWrap);

  const hoseTabs = instrument.hoses.map((hose, hoseIndex) => hoseLabel(hose, hoseIndex));
  const hoseKey = `i${VIEW_STATE.hosesInstrumentTab}`;
  VIEW_STATE.hosesTabByInstrument[hoseKey] = clampIndex(VIEW_STATE.hosesTabByInstrument[hoseKey] || 0, hoseTabs.length);

  root.append(
    renderTabbedHeader(
      hoseTabs,
      VIEW_STATE.hosesTabByInstrument[hoseKey],
      (hoseIndex) => {
        VIEW_STATE.hosesTabByInstrument[hoseKey] = hoseIndex;
        renderHoses();
      },
      {
        extraActions: [
          { label: "Move", icon: "res/icon-move-left.svg", onClick: () => moveHose(instrument, hoseKey, -1) },
          { label: "Move", icon: "res/icon-move-right.svg", onClick: () => moveHose(instrument, hoseKey, 1) }
        ]
      }
    )
  );

  const hoseIndex = VIEW_STATE.hosesTabByInstrument[hoseKey];
  const hose = instrument.hoses[hoseIndex];
  const content = document.createElement("section");
  content.className = "card";

  const grid = document.createElement("div");
  grid.className = "form-grid";

  const posSpan = document.createElement("span");
  posSpan.textContent = "POS Number";
  const posSelect = document.createElement("select");
  posSelect.classList.add("field-tiny");
  setSchemaNameAttr(posSelect, "number");
  posSelect.append(new Option("", ""));
  parseInstrumentPositions(instrument).forEach((value) => posSelect.append(new Option(value, value)));
  posSelect.value = hose.number || "";
  posSelect.addEventListener("change", () => {
    hose.number = posSelect.value;
    persistLocalDataset();
    renderHoses();
  });
  grid.append(posSpan, posSelect);

  const gradeSpan = document.createElement("span");
  gradeSpan.textContent = "Grade";
  const grade = document.createElement("select");
  grade.classList.add("field-medium");
  setSchemaNameAttr(grade, "grade");
  const gradeOptions = ["", "ULP91", "PULP95", "PULP98", "E-10", "E85", "OPAL 91", "Diesel", "Premium Diesel", "Bio Diesel", "AdBlue", "Kerosene"];
  for (const value of gradeOptions) {
    grade.append(new Option(value, value));
  }
  grade.value = hose.grade || "";
  applyGradeStyle(grade, grade.value);
  grade.addEventListener("change", () => {
    hose.grade = grade.value;
    applyGradeStyle(grade, grade.value);
    persistLocalDataset();
    renderHoses();
  });
  grid.append(gradeSpan, grade);

  const baseSerial = instrument.serialNumber || "";
  const hoseSerialPrefix = document.createElement("span");
  hoseSerialPrefix.textContent = "Hose serial number";
  const hoseSerialWrap = document.createElement("div");
  hoseSerialWrap.className = "serial-prefix-wrap";
  const prefix = document.createElement("strong");
  prefix.textContent = baseSerial ? `${baseSerial}` : "";
  const suffix = document.createElement("input");
  suffix.type = "text";
  suffix.classList.add("field-tiny");
  setSchemaNameAttr(suffix, "hoseSerialSuffix");
  suffix.value = hose.hoseSerialSuffix || "";
  suffix.addEventListener("change", () => {
    hose.hoseSerialSuffix = suffix.value;
    persistLocalDataset();
  });
  const guideLink = document.createElement("a");
  guideLink.href = "ref/fuel-dispenser-numbering-guide.pdf";
  guideLink.target = "_blank";
  guideLink.rel = "noopener noreferrer";
  guideLink.textContent = "NMI Numbering Guide 1.5";
  guideLink.className = "inline-guide-link";
  hoseSerialWrap.append(prefix, suffix, guideLink);
  grid.append(hoseSerialPrefix, hoseSerialWrap);

  const basicFields = [
    ["Unit price (¢/L)", "unitPrice", "number"],
    ["Start tote", "startTote", "number"],
    ["End tote", "endTote", "number"],
    ["Qmin (L/min)", "qmin", "number"],
    ["Qmax (L/min)", "qmax", "number"],
    ["Maximum achievable rate (L/min) (clause 3.8)", "maxRate", "number"]
  ];

  basicFields.forEach(([label, key, type]) => {
    const span = document.createElement("span");
    span.textContent = label;
    const input = document.createElement("input");
    input.type = type;
    input.classList.add("field-small");
    setSchemaNameAttr(input, key);
    if (type === "number") input.dataset.validate = "number";
    input.value = hose[key] ?? "";
    input.addEventListener("change", () => {
      hose[key] = input.value;
      persistLocalDataset();
      renderHoses();
    });
    grid.append(span, input);
  });

  const perfSpan = document.createElement("span");
  perfSpan.textContent = "Performance code";
  const perf = document.createElement("select");
  perf.classList.add("field-large");
  setSchemaNameAttr(perf, "performanceCode");
  perf.append(new Option("", ""));
  PERFORMANCE_CODES.forEach((item) => perf.append(new Option(item.label, item.code)));
  perf.value = hose.measureCheck.performanceCode || "";
  perf.addEventListener("change", () => {
    hose.measureCheck.performanceCode = perf.value;
    persistLocalDataset();
    renderHoses();
  });
  grid.append(perfSpan, perf);

  const volumeSpan = document.createElement("span");
  volumeSpan.textContent = "Volume used for testing";
  const volumeStrong = document.createElement("strong");
  const volumeUsed = Number(hose.endTote) - Number(hose.startTote);
  volumeStrong.textContent = Number.isFinite(volumeUsed) ? `${volumeUsed || 0}L` : "0L";
  grid.append(volumeSpan, volumeStrong);

  content.append(grid, document.createElement("hr"));

  const innerTabs = visibleHoseTabs(hose.measureCheck.performanceCode);
  const hoseInnerKey = `${hoseKey}:h${hoseIndex}`;
  const innerTab = Math.min(VIEW_STATE.hoseInnerTabByKey[hoseInnerKey] || 0, innerTabs.length - 1);
  VIEW_STATE.hoseInnerTabByKey[hoseInnerKey] = innerTab;
  content.append(
    renderTabbedHeader(
      innerTabs,
      innerTab,
      (idx) => {
        VIEW_STATE.hoseInnerTabByKey[hoseInnerKey] = idx;
        renderHoses();
      }
    )
  );

  const body = document.createElement("div");
  body.className = "nested-content";
  const activeTabLabel = innerTabs[innerTab];
  if (activeTabLabel === "Measure Check") body.append(renderMeasureCheckPanel(hose));
  if (activeTabLabel === "Verification") body.append(renderVerificationPanel(hose, instrument.type));
  if (activeTabLabel === "Compliance") body.append(renderCompliancePanel(hose));

  content.append(body);
  root.append(content);

  hosesPanel.replaceChildren(root);
  attachOutcomeSelectStyling();
  attachGlobalValidation();
}

function visibleHoseTabs(performanceCode) {
  const code = (performanceCode || "").toUpperCase();
  const tabs = ["Measure Check", "Verification", "Compliance"];
  if (code === "A" || ["E", "F", "G", "H"].includes(code)) return ["Verification", "Compliance"];
  if (code === "B") return ["Measure Check", "Compliance"];
  return tabs;
}

function renderMeasureSelect(value, onChange) {
  const select = document.createElement("select");
  select.classList.add("field-small");
  setSchemaNameAttr(select, "measureId");
  select.append(new Option("", ""));
  dataset.measures.forEach((measure, index) => {
    select.append(new Option(measureLabel(measure, index), String(index)));
  });
  select.value = value ?? "";
  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function sightglassDefaults(target, measureId) {
  const measure = dataset.measures[Number(measureId)];
  if (!measure) return;
  const volume = measure.volume || "";
  const hasSightglass = (measure.sightglass || "no") === "yes";
  if (hasSightglass) {
    target.vfd = volume;
  } else {
    target.vref = volume;
  }
  target.efd = calculateEfd(target.vfd, target.vref);
}

function calculateEfd(vfd, vref) {
  const a = Number(vfd);
  const b = Number(vref);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return "";
  return (((a - b) / b) * 100).toFixed(2);
}

function findMeasure(measureId) {
  return dataset.measures[Number(measureId)];
}

function parseDateDdMmYyyy(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value || "")) return null;
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isMeasureExpired(measure) {
  const expiry = parseDateDdMmYyyy(toDisplayDate(measure?.certificateExpiry || ""));
  if (!expiry) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return expiry < today;
}

function validateMeasureSize(hose, measure, context = { section: "measureCheck", rowIndex: 0 }) {
  if (!measure) return "";
  const measureVolume = Number(measure.volume);
  const qmin = Number(hose.qmin);
  const qmax = Number(hose.qmax);
  const maxRate = Number(hose.maxRate);

  if (Number.isFinite(qmin) && Number.isFinite(measureVolume) && measureVolume <= qmin) {
    return "Invalid measure size selected";
  }

  const isMeasureCheckFirstTwo = context.section === "measureCheck" && [0, 1].includes(context.rowIndex);
  const isVerificationFirstThree = context.section === "verification" && [0, 1, 2].includes(context.rowIndex);
  const enforceQmaxRule = isMeasureCheckFirstTwo || isVerificationFirstThree;
  if (
    enforceQmaxRule &&
    Number.isFinite(qmax) &&
    qmax > 60 &&
    Number.isFinite(maxRate) &&
    Number.isFinite(measureVolume) &&
    measureVolume <= maxRate
  ) {
    return "Invalid measure size selected";
  }

  return "";
}

function exceedsMpe(efd) {
  const mpe = Number(dataset.testDetails.mpe);
  const efdVal = Number(efd);
  if (!Number.isFinite(mpe) || !Number.isFinite(efdVal)) return false;
  return Math.abs(efdVal) > Math.abs(mpe);
}

function renderMeasureCheckPanel(hose) {
  const wrap = document.createElement("div");
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = "<thead><tr><th></th><th>Measure used</th><th>VFD (L)</th><th>VREF (L)</th><th>EFD (%)<br>Accuracy<br/>(clause 3.9)</th></tr></thead>";
  const body = document.createElement("tbody");

  hose.measureCheck.checks.forEach((check, idx) => {
    const tr = document.createElement("tr");
    const label = document.createElement("td");
    label.textContent = idx === 2 ? "Check #3 (min flow)" : `Check #${idx + 1} (max flow)`;

    const measureCell = document.createElement("td");
    const measureWrap = document.createElement("div");
    measureCell.append(measureWrap);
    measureWrap.append(
      renderMeasureSelect(check.measureId, (id) => {
        check.measureId = id;
        sightglassDefaults(check, id);
        persistLocalDataset();
        renderHoses();
      })
    );
    const selectedMeasure = findMeasure(check.measureId);
    const sizeError = validateMeasureSize(hose, selectedMeasure, { section: "measureCheck", rowIndex: idx });
    if (isMeasureExpired(selectedMeasure)) {
      const expired = document.createElement("div");
      expired.className = "field-error";
      expired.textContent = "Measure expired";
      measureWrap.append(expired);
    }
    if (sizeError) {
      const invalid = document.createElement("div");
      invalid.className = "field-error";
      invalid.textContent = sizeError;
      measureWrap.append(invalid);
    }

    const sightglassYes = (selectedMeasure?.sightglass || "no") === "yes";
    if (sightglassYes && selectedMeasure) check.vfd = selectedMeasure.volume || "";
    if (!sightglassYes && selectedMeasure) check.vref = selectedMeasure.volume || "";

    const vfd = numericTableInput(check, "vfd", () => {
      check.efd = calculateEfd(check.vfd, check.vref);
    }, sightglassYes);
    const vref = numericTableInput(check, "vref", () => {
      check.efd = calculateEfd(check.vfd, check.vref);
    }, !sightglassYes && !!selectedMeasure);

    const efd = document.createElement("td");
    efd.textContent = check.efd || "";

    tr.append(label, measureCell, vfd, vref, efd);
    if (exceedsMpe(check.efd)) tr.classList.add("row-error");
    body.append(tr);
  });

  table.append(body);
  wrap.append(table);
  return wrap;
}

function verificationRows(hose) {
  return [
    ["Delivery #1 (max flow)", hose.verification.deliveries[0]],
    ["Delivery #2 (max flow)", hose.verification.deliveries[1]],
    ["Delivery #3 (max flow)", hose.verification.deliveries[2]],
    ["Delivery #4 (min flow)", hose.verification.deliveries[3]],
    ["Preset Delivery (clause 3.10)", hose.verification.preset],
    ["Gas Elimination Delivery (clause 3.12)", hose.verification.gasElimination]
  ];
}

function verificationMarkWithDateCode() {
  const baseMark = String(dataset?.testDetails?.verificationMark || "").trim();
  if (!baseMark) return "";
  const now = new Date();
  const monthCode = String.fromCharCode(65 + now.getMonth());
  const yearCode = String(now.getFullYear()).slice(-1);
  return `${baseMark}${monthCode}${yearCode}`;
}

function renderVerificationPanel(hose, instrumentType) {
  const wrap = document.createElement("div");
  const verificationMark = document.createElement("div");
  verificationMark.className = "verification-mark";
  verificationMark.title = "Verification mark";
  verificationMark.textContent = verificationMarkWithDateCode();
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = "<thead><tr><th></th><th>Measure used</th><th>VFD (L)</th><th>VREF (L)</th><th>EFD (%)<br/>Accuracy<br/>(clause 3.9)</th><th>ED (%)</th></tr></thead>";
  const body = document.createElement("tbody");
  const isSuctionSystem = String(instrumentType || "").trim().toLowerCase() === "suction";

  verificationRows(hose).forEach(([labelText, rowObj], rowIndex) => {
    if (labelText.startsWith("Gas Elimination Delivery") && !isSuctionSystem) return;
    const tr = document.createElement("tr");
    const label = document.createElement("td");
    label.textContent = labelText;

    const measureCell = document.createElement("td");
    const measureWrap = document.createElement("div");
    measureCell.append(measureWrap);
    measureWrap.append(
      renderMeasureSelect(rowObj.measureId, (id) => {
        rowObj.measureId = id;
        sightglassDefaults(rowObj, id);
        persistLocalDataset();
        renderHoses();
      })
    );
    const selectedMeasure = findMeasure(rowObj.measureId);
    const sizeError = validateMeasureSize(hose, selectedMeasure, { section: "verification", rowIndex });
    if (isMeasureExpired(selectedMeasure)) {
      const expired = document.createElement("div");
      expired.className = "field-error";
      expired.textContent = "Measure expired";
      measureWrap.append(expired);
    }
    if (sizeError) {
      const invalid = document.createElement("div");
      invalid.className = "field-error";
      invalid.textContent = sizeError;
      measureWrap.append(invalid);
    }
    const sightglassYes = (selectedMeasure?.sightglass || "no") === "yes";
    if (sightglassYes && selectedMeasure) rowObj.vfd = selectedMeasure.volume || "";
    if (!sightglassYes && selectedMeasure) rowObj.vref = selectedMeasure.volume || "";

    const vfd = numericTableInput(rowObj, "vfd", () => {
      rowObj.efd = calculateEfd(rowObj.vfd, rowObj.vref);
    }, sightglassYes);
    const vref = numericTableInput(rowObj, "vref", () => {
      rowObj.efd = calculateEfd(rowObj.vfd, rowObj.vref);
    }, !sightglassYes && !!selectedMeasure);

    const efd = document.createElement("td");
    efd.textContent = rowObj.efd || "";

    const ed = document.createElement("td");
    if (rowIndex === 5) {
      const input = document.createElement("input");
      input.type = "number";
      input.classList.add("field-small");
      setSchemaNameAttr(input, "ed");
      input.step = "0.01";
      input.value = rowObj.ed || "";
      input.addEventListener("change", () => {
        rowObj.ed = input.value;
        persistLocalDataset();
      });
      ed.append(input);
    }

    tr.append(label, measureCell, vfd, vref, efd, ed);
    if (exceedsMpe(rowObj.efd)) tr.classList.add("row-error");
    body.append(tr);
  });

  table.append(body);

  const avgError = average([
    hose.verification.deliveries[0].efd,
    hose.verification.deliveries[1].efd,
    hose.verification.deliveries[2].efd
  ]);

  const meta = document.createElement("div");
  meta.className = "form-grid top-gap";

  const avgLabel = document.createElement("span");
  avgLabel.textContent = "Average error (EAV) (clause 3.12)";
  const avgVal = document.createElement("strong");
  avgVal.textContent = avgError === "" ? "" : avgError;

  const antiLabel = document.createElement("span");
  antiLabel.textContent = "Anti-drain/Hose dilation vol. of drained fuel (mL) (clause 3.13)";
  const antiInput = document.createElement("input");
  antiInput.type = "number";
  antiInput.classList.add("field-small");
  setSchemaNameAttr(antiInput, "antiDrainMl");
  antiInput.value = hose.verification.antiDrainMl || "";
  antiInput.addEventListener("change", () => {
    hose.verification.antiDrainMl = antiInput.value;
    persistLocalDataset();
  });

  const reverificationLabel = document.createElement("span");
  reverificationLabel.textContent = "Existing verification mark (if reverifying)";
  const reverificationInput = document.createElement("input");
  reverificationInput.type = "text";
  reverificationInput.classList.add("field-medium");
  setSchemaNameAttr(reverificationInput, "reverification");
  reverificationInput.value = hose.verification.reverification || "";
  reverificationInput.addEventListener("change", () => {
    hose.verification.reverification = reverificationInput.value;
    persistLocalDataset();
  });

  meta.append(avgLabel, avgVal, antiLabel, antiInput, reverificationLabel, reverificationInput);

  wrap.append(verificationMark, table, meta);
  return wrap;
}

function average(values) {
  const parsed = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (parsed.length === 0) return "";
  return (parsed.reduce((sum, value) => sum + value, 0) / parsed.length).toFixed(2);
}

function renderCompliancePanel(hose) {
  const form = document.createElement("div");
  form.className = "form-grid";

  COMPLIANCE_QUESTIONS.forEach((question, idx) => {
    const key = `q${idx + 1}`;
    const span = document.createElement("span");
    span.textContent = question;
    const select = document.createElement("select");
    select.classList.add("field-small");
    setSchemaNameAttr(select, key);
    ["", "Pass", "Fail", "N/A"].forEach((option) => select.append(new Option(option, option)));
    select.value = hose.compliance[key] || "";
    select.addEventListener("change", () => {
      hose.compliance[key] = select.value;
      persistLocalDataset();
    });
    form.append(span, select);
  });

  const resultSpan = document.createElement("span");
  resultSpan.textContent = "Overall result";
  const result = document.createElement("select");
  result.classList.add("field-small");
  setSchemaNameAttr(result, "overall");
  ["Pass", "Fail"].forEach((option) => result.append(new Option(option, option)));
  result.value = hose.compliance.overall || "Pass";
  result.addEventListener("change", () => {
    hose.compliance.overall = result.value;
    persistLocalDataset();
  });
  form.append(resultSpan, result);

  return form;
}

function numericTableInput(target, key, onChange, disabled = false) {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.type = "number";
  input.classList.add("field-small");
  setSchemaNameAttr(input, key);
  input.dataset.validate = "number";
  input.step = "0.01";
  input.value = target[key] ?? "";
  input.disabled = disabled;
  input.addEventListener("change", () => {
    target[key] = input.value;
    onChange?.();
    persistLocalDataset();
    renderHoses();
  });
  td.append(input);
  return td;
}

function clearDatasetAndResetUi() {
  localStorage.removeItem(STORAGE_KEY);
  dataset = defaultDataset();
  VIEW_STATE.measuresTab = 0;
  VIEW_STATE.instrumentsTab = 0;
  VIEW_STATE.hosesInstrumentTab = 0;
  VIEW_STATE.hosesTabByInstrument = {};
  VIEW_STATE.hoseInnerTabByKey = {};
  persistLocalDataset();
  renderAll();
}

async function importDatasetFromText(rawText) {
  try {
    dataset = normalizeDataset(JSON.parse(rawText));
    persistLocalDataset();
    renderAll();
    return true;
  } catch {
    return false;
  }
}

function handleStartMode() {
  if (LOAD_MODE === "sample") {
    dataset = normalizeDataset(JSON.parse(JSON.stringify(SAMPLE_DATASET)));
    persistLocalDataset();
    renderAll();
    return;
  }

  if (START_MODE === "new") {
    clearDatasetAndResetUi();
    return;
  }

  if (START_MODE === "load") {
    clearDatasetAndResetUi();
    const startupDataset = sessionStorage.getItem(IMPORT_SESSION_KEY);
    if (startupDataset) {
      sessionStorage.removeItem(IMPORT_SESSION_KEY);
      importDatasetFromText(startupDataset).then((imported) => {
        if (!imported) alert("Invalid JSON dataset file.");
      });
      return;
    }
    saveStatus.textContent = "Click Load to select a dataset file.";
  }
}

function renderAllPanels() {
  renderTestDetails();
  renderMeasures();
  renderInstruments();
  renderHoses();
  attachOutcomeSelectStyling();
  attachGlobalValidation();
}

function renderAll() {
  renderAllPanels();
  if (!saveStatus.textContent.includes("Locally saved")) persistLocalDataset();
}

renderAll();
handleStartMode();
