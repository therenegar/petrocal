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


const SAMPLE_DATASET = JSON.parse(`{"version":3,"testDetails":{"date":"06/08/2024","jobNumber":54321,"type":"In-service Inspection","verifierName":"Johnny Petro","registrationNumber":"VR-01234","verificationMark":"PET1234","operator":"ServoPlus","mpe":0.3,"siteName":"Laverton","siteNumber":"223344","contactOnSite":"Luke Smith","streetAddress":"100 Little Boundary Road","suburb":"Laverton","state":"VIC","postCode":3026,"comments":"Luke makes a really good coffee."},"form6Details":{"licenceNumber":"0923897643","businessName":"Fuel Service Co","abnNumber":"81293772854"},"measures":[{"type":"Conical","sightglass":"no","serialNumber":"LMI 101","volume":15,"certificateNumber":"AB112233","certificateExpiry":"27/10/2030"},{"type":"Cylindrical","sightglass":"yes","serialNumber":"LMI 202","volume":100,"certificateNumber":"AB334455","certificateExpiry":"1/12/2030"},{"type":"Cylindrical","sightglass":"yes","serialNumber":"LMI 303","volume":200,"certificateNumber":"AB667788","certificateExpiry":"15/05/2030"}],"instruments":[{"numbering":"1/2","hoseCount":8,"manufacturer":"Wayne","make":"Helix 6000","modelNumber":"C(WH/LM)44-44R","serialNumber":"40-1003326","manufactureDate":"2018","nmiPatternApproval":"5/6A/232","productsApproved":["Petrol","Diesel","Bio-diesel","Ethanol","DEF/AdBlue"],"type":"Pressurised","inspection":{"q1":"Yes","q2":"Yes","q3":"Yes","q4":"Yes","q5":"Yes","q6":"Yes","q7":"Yes","q8":"Yes","q9":"Yes","q10":"Yes","q11":"Yes","q12":"N/A"},"hoses":[{"number":"1","grade":"ULP91","hoseSerialSuffix":"B1","unitPrice":"219.90","startTote":"941358","endTote":"941478","qmin":"4","qmax":"40","maxRate":"38","measureCheck":{"performanceCode":"C","comments":"","deliveries":[{"measureId":"0","vfd":"15.04","vref":15,"efd":"0.27"},{"measureId":"0","vfd":"15.03","vref":15,"efd":"0.20"},{"measureId":"0","vfd":"15.04","vref":15,"efd":"0.27"},{"measureId":"0","vfd":"15.04","vref":15,"efd":"0.27"}],"preset":{"measureId":"0","vfd":"15.04","vref":15,"efd":"0.27"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"12","checks":[{"measureId":"0","vfd":"15.04","vref":15,"efd":"0.27"},{"measureId":"0","vfd":"15.03","vref":15,"efd":"0.20"},{"measureId":"0","vfd":"15.04","vref":15,"efd":"0.27"}]},"verification":{"deliveries":[{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"14.99","vref":15,"efd":"-0.07"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"}],"preset":{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},"gasElimination":{"measureId":"","vfd":"","vref":15,"efd":"","ed":""},"antiDrainMl":"12","reverification":"ABC9876"},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"1","grade":"E-10","hoseSerialSuffix":"B2","unitPrice":"217.90","startTote":"390222","endTote":"390267","qmin":"4","qmax":"40","maxRate":"40","measureCheck":{"performanceCode":"B","comments":"","deliveries":[{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"}],"preset":{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"10","checks":[{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"1","grade":"PULP98","hoseSerialSuffix":"B3","unitPrice":"242.90","startTote":"133740","endTote":"133785","qmin":"4","qmax":"40","maxRate":"40","measureCheck":{"performanceCode":"B","comments":"","deliveries":[{"measureId":"0","vfd":"14.98","vref":15,"efd":"-0.13"},{"measureId":"0","vfd":"14.98","vref":15,"efd":"-0.13"},{"measureId":"0","vfd":"14.99","vref":15,"efd":"-0.07"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"}],"preset":{"measureId":"0","vfd":"14.99","vref":15,"efd":"-0.07"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"8","checks":[{"measureId":"0","vfd":"14.98","vref":15,"efd":"-0.13"},{"measureId":"0","vfd":"14.98","vref":15,"efd":"-0.13"},{"measureId":"0","vfd":"14.99","vref":15,"efd":"-0.07"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"1","grade":"Premium Diesel","hoseSerialSuffix":"B4","unitPrice":"192.90","startTote":"573440","endTote":"573740","qmin":"7","qmax":"70","maxRate":"55","measureCheck":{"performanceCode":"B","comments":"","deliveries":[{"measureId":"1","vfd":100,"vref":"100.20","efd":"-0.20"},{"measureId":"1","vfd":100,"vref":"100.25","efd":"-0.25"},{"measureId":"1","vfd":100,"vref":"100.20","efd":"-0.20"},{"measureId":"0","vfd":"15.03","vref":15,"efd":"0.20"}],"preset":{"measureId":"1","vfd":100,"vref":"100.25","efd":"-0.25"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"10","checks":[{"measureId":"1","vfd":100,"vref":"100.20","efd":"-0.20"},{"measureId":"1","vfd":100,"vref":"100.25","efd":"-0.25"},{"measureId":"1","vfd":100,"vref":"100.20","efd":"-0.20"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"2","grade":"ULP91","hoseSerialSuffix":"A1","unitPrice":"219.90","startTote":"326876","endTote":"326921","qmin":"4","qmax":"40","maxRate":"38","measureCheck":{"performanceCode":"B","comments":"","deliveries":[{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"}],"preset":{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"12","checks":[{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"2","grade":"E-10","hoseSerialSuffix":"A2","unitPrice":"217.90","startTote":"793989","endTote":"794034","qmin":"4","qmax":"40","maxRate":"40","measureCheck":{"performanceCode":"B","comments":"","deliveries":[{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.03","vref":15,"efd":"0.20"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"}],"preset":{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"9","checks":[{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},{"measureId":"0","vfd":"15.03","vref":15,"efd":"0.20"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"2","grade":"PULP98","hoseSerialSuffix":"A3","unitPrice":"242.90","startTote":"262140","endTote":"262260","qmin":"4","qmax":"40","maxRate":"40","measureCheck":{"performanceCode":"D","comments":"","deliveries":[{"measureId":"0","vfd":"15.06","vref":15,"efd":"0.40"},{"measureId":"0","vfd":"15.05","vref":15,"efd":"0.33"},{"measureId":"0","vfd":"15.08","vref":15,"efd":"0.53"},{"measureId":"0","vfd":"15.08","vref":15,"efd":"0.53"}],"preset":{"measureId":"0","vfd":"15.07","vref":15,"efd":"0.47"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","checks":[{"measureId":"0","vfd":"15.06","vref":15,"efd":"0.40"},{"measureId":"0","vfd":"15.05","vref":15,"efd":"0.33"},{"measureId":"0","vfd":"15.08","vref":15,"efd":"0.53"}]},"verification":{"deliveries":[{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"15","vref":15,"efd":"0.00"},{"measureId":"0","vfd":"15.01","vref":15,"efd":"0.07"}],"preset":{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"8","reverification":"ABC9876"},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}},{"number":"2","grade":"Premium Diesel","hoseSerialSuffix":"A4","unitPrice":"192.90","startTote":"406844","endTote":"407144","qmin":"7","qmax":"70","maxRate":"55","measureCheck":{"performanceCode":"B","comments":"","deliveries":[{"measureId":"1","vfd":100,"vref":"100.10","efd":"-0.10"},{"measureId":"1","vfd":100,"vref":"100.10","efd":"-0.10"},{"measureId":"1","vfd":100,"vref":"100.15","efd":"-0.15"},{"measureId":"0","vfd":"15.02","vref":15,"efd":"0.13"}],"preset":{"measureId":"1","vfd":100,"vref":"100.10","efd":"-0.10"},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"10","checks":[{"measureId":"1","vfd":100,"vref":"100.10","efd":"-0.10"},{"measureId":"1","vfd":100,"vref":"100.10","efd":"-0.10"},{"measureId":"1","vfd":100,"vref":"100.15","efd":"-0.15"}]},"verification":{"deliveries":[{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""},{"measureId":"","vfd":"","vref":"","efd":""}],"preset":{"measureId":"","vfd":"","vref":"","efd":""},"gasElimination":{"measureId":"","vfd":"","vref":"","efd":"","ed":""},"antiDrainMl":"","reverification":""},"compliance":{"q1":"Pass","q2":"Pass","q3":"Pass","q4":"Pass","q5":"Pass","q6":"Pass","overall":"Pass"}}]}]}`);

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
const saveDatasetBtn = document.getElementById("saveDatasetBtn");

const SAVE_BUTTON_STATE = {
  idle: "idle",
  pending: "pending",
  saved: "saved"
};

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

saveDatasetBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildDatasetFilename();
  link.click();
  URL.revokeObjectURL(url);
  setSaveButtonState(SAVE_BUTTON_STATE.saved);
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
  if (tabId === "testDetails") renderTestDetails();
  if (tabId === "measures") renderMeasures();
  if (tabId === "instruments") renderInstruments();
  if (tabId === "hoses") renderHoses();
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
      comments: "",
      deliveries: [emptyDelivery(), emptyDelivery(), emptyDelivery(), emptyDelivery()],
      preset: emptyDelivery(),
      gasElimination: { ...emptyDelivery(), ed: "" },
      antiDrainMl: ""
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
      deliveries: (hose.measureCheck?.deliveries || base.measureCheck.deliveries)
        .slice(0, 4)
        .map((item, idx) => ({ ...base.measureCheck.deliveries[idx], ...item })),
      preset: { ...base.measureCheck.preset, ...(hose.measureCheck?.preset || {}) },
      gasElimination: { ...base.measureCheck.gasElimination, ...(hose.measureCheck?.gasElimination || {}) }
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

  if ((!hose.measureCheck?.deliveries || !hose.measureCheck?.deliveries.length) && Array.isArray(hose.measureCheck?.checks)) {
    merged.measureCheck.deliveries = [0, 1, 2, 3].map((idx) => ({
      ...base.measureCheck.deliveries[idx],
      ...(idx < 3 ? hose.measureCheck.checks[idx] || {} : {})
    }));
  }
  while (merged.measureCheck.deliveries.length < 4) merged.measureCheck.deliveries.push(emptyDelivery());
  while (merged.verification.deliveries.length < 4) merged.verification.deliveries.push(emptyDelivery());
  return merged;
}

function setSaveButtonState(state) {
  saveDatasetBtn.classList.toggle("save-btn-pending", state === SAVE_BUTTON_STATE.pending);
  saveDatasetBtn.classList.toggle("save-btn-saved", state === SAVE_BUTTON_STATE.saved);
}

function persistLocalDataset({ markDirty = true } = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  try {
    sessionStorage.setItem(REPORT_SESSION_KEY, JSON.stringify(dataset));
  } catch {
    // no-op
  }
  if (markDirty) setSaveButtonState(SAVE_BUTTON_STATE.pending);
  saveStatus.textContent = `Last change @ ${formatNowDdMmYyyyHhMmSs()}`;
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

function duplicateInstrument(index) {
  const source = dataset.instruments[index];
  if (!source) return;

  const duplicated = normalizeDataset({
    instruments: [JSON.parse(JSON.stringify(source))]
  }).instruments[0];
  const emptyHose = normalizeHose();

  duplicated.numbering = "";
  duplicated.serialNumber = "";
  duplicated.inspection = Object.fromEntries(VISUAL_INSPECTION_QUESTIONS.map((_, idx) => [`q${idx + 1}`, ""]));
  duplicated.hoses = duplicated.hoses.map((hose) => {
    const clone = normalizeHose(hose);
    clone.number = "";
    clone.startTote = "";
    clone.endTote = "";
    clone.measureCheck = JSON.parse(JSON.stringify(emptyHose.measureCheck));
    clone.verification = JSON.parse(JSON.stringify(emptyHose.verification));
    clone.compliance = JSON.parse(JSON.stringify(emptyHose.compliance));
    return clone;
  });

  dataset.instruments.splice(index + 1, 0, duplicated);
  VIEW_STATE.instrumentsTab = index + 1;
  VIEW_STATE.hosesInstrumentTab = index + 1;
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

function addDatePicker(input) {
  const wrapper = document.createElement("div");
  wrapper.className = "date-field-wrap";
  if (input.parentElement) input.replaceWith(wrapper);
  wrapper.append(input);

  const pickerButton = document.createElement("button");
  pickerButton.type = "button";
  pickerButton.className = "date-picker-button";
  pickerButton.textContent = "▦";
  pickerButton.tabIndex = -1;
  pickerButton.setAttribute("aria-label", "Choose date");
  pickerButton.title = "Choose date";

  const picker = document.createElement("input");
  picker.type = "date";
  picker.className = "date-picker-control";
  picker.tabIndex = -1;
  picker.setAttribute("aria-label", "Choose date");
  picker.value = toInputDate(input.value);

  const openPicker = () => {
    picker.value = toInputDate(input.value);
    if (typeof picker.showPicker === "function") {
      try {
        picker.showPicker();
        return;
      } catch {
        // Fall through to click for browsers without showPicker support.
      }
    }
    picker.click();
  };

  pickerButton.addEventListener("click", openPicker);
  input.addEventListener("keydown", (event) => {
    if (event.altKey && event.key === "ArrowDown") {
      event.preventDefault();
      openPicker();
    }
  });
  picker.addEventListener("change", () => {
    if (!picker.value) return;
    input.value = toDisplayDate(picker.value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  input.addEventListener("change", () => {
    picker.value = toInputDate(input.value);
  });

  const pickerControlWrap = document.createElement("span");
  pickerControlWrap.className = "date-picker-control-wrap";
  pickerControlWrap.append(pickerButton, picker);
  wrapper.append(pickerControlWrap);
  return wrapper;
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

function isValidNmiPatternApproval(value) {
  return /^\d+\/[A-Za-z0-9]+\/[A-Za-z0-9]+$/.test(value || "");
}

function restrictNumericInput(input) {
  input.addEventListener("input", () => {
    if (getValidationKind(input) === "integer") {
      input.value = input.value.replace(/\D/g, "");
      return;
    }
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

function configureDecimalInput(input, validationKind = "number") {
  input.type = "text";
  input.inputMode = "decimal";
  input.dataset.validate = validationKind;
}

function visibleFocusableElements(root = document.getElementById("appMain")) {
  if (!root) return [];
  return [...root.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]')]
    .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0);
}

function replacePanelContents(panel, content) {
  const focusableBefore = visibleFocusableElements();
  const focusedIndex = focusableBefore.indexOf(document.activeElement);
  panel.replaceChildren(content);
  if (focusedIndex < 0) return;

  const focusableAfter = visibleFocusableElements();
  const replacement = focusableAfter[Math.min(focusedIndex, focusableAfter.length - 1)];
  replacement?.focus({ preventScroll: true });
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
  const existingError = input.closest(".field-control-wrap")?.querySelector(".validation-message");
  if (!touched) {
    input.classList.remove("invalid-field");
    if (existingError) existingError.textContent = "";
    return;
  }

  const value = input.value?.trim() || "";
  const kind = getValidationKind(input);
  let error = "";

  if (value) {
    if (kind === "number" && !/^\d+(\.\d+)?$/.test(value)) error = "Only numbers are allowed";
    if (kind === "integer" && !/^\d+$/.test(value)) error = "Only whole numbers are allowed";
    if (kind === "decimal2" && !/^\d+(\.\d{1,2})?$/.test(value)) error = "Use a number with up to 2 decimal places";
    if (kind === "date" && !isValidDdMmYyyy(value) && !isValidIsoDate(value)) error = "Use a valid date";
    if (kind === "numbering" && !/^[0-9/]+$/.test(value)) error = "Use numbers and / only";
    if (kind === "nmiPatternApproval" && !isValidNmiPatternApproval(value)) {
      error = "Wrong format. Example: 5/6A/101";
    }
  }

  if (error) {
    input.classList.add("invalid-field");
    ensureErrorNode(input).textContent = error;
  } else {
    input.classList.remove("invalid-field");
    if (existingError) existingError.textContent = "";
  }
}

function applySelectOutcomeStyle(select) {
  select.classList.remove("select-good", "select-bad");
  if (select.dataset.skipOutcomeStyle === "true") return;

  const value = String(select.value || "").trim().toLowerCase();
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
    const kind = getValidationKind(input);
    if (!input.dataset.validationBound) {
      if (kind === "number" || kind === "integer" || kind === "decimal2") restrictNumericInput(input);
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
  const { addAction = null, duplicateAction = null, removeAction = null, extraActions = [] } = options;
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

  if (duplicateAction) {
    const duplicate = document.createElement("button");
    duplicate.className = "btn small-btn";
    applyButtonIcon(duplicate, "res/icon-dupe.svg", "Duplicate");
    duplicate.addEventListener("click", duplicateAction);
    actionsWrap.append(duplicate);
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
  applyButtonIcon(left, "", "←");
  left.addEventListener("click", onLeft);
  const right = document.createElement("button");
  right.className = "btn small-btn";
  applyButtonIcon(right, "", "→");
  right.addEventListener("click", onRight);
  wrap.append(left, right);
  return wrap;
}

function buildLabelWithHelp(labelText, helpText = "") {
  const wrapper = document.createElement("span");
  wrapper.className = "label-with-help";
  const label = document.createElement("span");
  appendSubscriptText(label, labelText);
  wrapper.append(label);

  if (helpText) {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "help-tip-trigger";
    trigger.textContent = "?";
    //trigger.title = helpText;
    const tip = document.createElement("span");
    tip.className = "help-tip-bubble";
    appendSubscriptText(tip, helpText);
    const updateTipPosition = () => positionHelpTipBubble(tip);
    trigger.addEventListener("mouseenter", updateTipPosition);
    trigger.addEventListener("focus", updateTipPosition);
    trigger.append(tip);
    wrapper.append(trigger);
  }

  return wrapper;
}

function positionHelpTipBubble(tip) {
  tip.classList.remove("help-tip-bubble-left");
  const isHidden = getComputedStyle(tip).display === "none";
  if (isHidden) {
    tip.style.display = "block";
    tip.style.visibility = "hidden";
  }
  const rightAlignedRect = tip.getBoundingClientRect();
  if (rightAlignedRect.right > window.innerWidth - 8) {
    tip.classList.add("help-tip-bubble-left");
  }
  if (isHidden) {
    tip.style.display = "";
    tip.style.visibility = "";
  }
}

const LABEL_HELP_TEXT = {
  mpe: "The MPE specified by the NMI is 0.3. This may be lower depending on certain client requirements.",
  hoseCount:
    "Enter only the number of hoses you are checking/verifying. So if it is an 8 hose pump but you're only calibrating and verifying 2 hoses, enter 2.",
  typeOfSystem:
    "Choosing suction will display additional required items for calibration and verification (i.e. gas elimination). All terminology for the instrument will reflect dispenser if pressurised, or pump if suction.",
  hoseSerialNumber:
    "The hose serial number comprises the instrument serial number and a suffix. The NMI Numbering Guide will help you determine the suffix for this hose position.",
  maxAchievableRate:
    "This can be determined during one of the fast flow accuracy test deliveries or during the conditioning of the reference standard.",
  antiDrain:
    "Assuming retail fuel sites don't have a hose reel.",
  efdPercent: "Calculated as EFD = (VFD - VREF) * 100 / VREF",
  edPercent: "Calculated as ED = EAV - EFD"
};

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
    ["Type of test", "type", "select", ["Verification", "Re-verification", "In-service Inspection"]],
    ["Maximum permissible error (MPE) %", "mpe", "number", null, "field-small"],
    ["Verifier's name", "verifierName", "text", null, "field-medium"],
    ["Registration number", "registrationNumber", "text", null, "field-small"],
    ["Verification mark", "verificationMark", "text", null, "field-small"],
    [
      "Operator",
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
        "X-Convenience",
        "Other"
      ],
      "field-medium"
    ],
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
    const span = key === "mpe" ? buildLabelWithHelp(label, LABEL_HELP_TEXT.mpe) : document.createElement("span");
    if (key !== "mpe") span.textContent = label;

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
      if (key === "mpe") {
        configureDecimalInput(control);
        control.step = "0.1";
      }
      if (key === "jobNumber") {
        control.min = 0;
        control.dataset.validate = "integer";
      }
      if (key === "postCode") {
        control.min = 1000;
        control.max = 9999;
        control.step = 1;
        control.dataset.validate = "integer";
      }
      if (key === "date") control.dataset.validate = "date";
      if (type === "number" && key !== "mpe" && !control.dataset.validate) control.dataset.validate = "number";
    }
    if (sizeClass) control.classList.add(sizeClass);

    control.value = key === "date" ? toDisplayDate(dataset.testDetails[key]) : (dataset.testDetails[key] ?? "");
    if (key !== "operator") {
      bindInput(control, ["testDetails", key], (value) => {
        if (key === "date") return toDisplayDate(value);
        if (key === "postCode") {
          if (value === "") return "";
          const numeric = Math.trunc(Number(value));
          if (Number.isNaN(numeric)) return "";
          return Math.max(1000, Math.min(9999, numeric));
        }
        return type === "number" ? (value === "" ? "" : Number(value)) : value;
      }, key !== "date");
      if (key === "date") control = addDatePicker(control);
    }

    if (key === "operator") {
      const selectedOperator = String(dataset.testDetails.operator || "");
      const knownOperators = (options || []).filter((option) => option !== "Other");
      const usesCustomOperator = Boolean(selectedOperator && !knownOperators.includes(selectedOperator));
      control.value = usesCustomOperator ? "Other" : selectedOperator;

      const wrap = document.createElement("div");
      wrap.className = "operator-control-wrap";
      const primaryRow = document.createElement("div");
      primaryRow.className = "operator-primary-row";
      const logo = document.createElement("img");
      logo.className = "operator-logo";
      logo.alt = "Operator logo";
      const otherInput = document.createElement("input");
      otherInput.type = "text";
      otherInput.className = "field-medium operator-other-input";
      otherInput.placeholder = "Enter operator";
      otherInput.value = usesCustomOperator ? selectedOperator : "";
      setSchemaNameAttr(otherInput, "operator");

      const syncOtherInputVisibility = () => {
        otherInput.hidden = control.value !== "Other";
      };
      const syncOperatorLogo = () => {
        const logoName = control.value === "Other" ? otherInput.value : control.value;
        const logoPath = getOperatorLogoPath(logoName);
        logo.hidden = !logoPath;
        if (logoPath) {
          logo.src = logoPath;
        } else {
          logo.removeAttribute("src");
        }
      };
      control.addEventListener("change", () => {
        const nextOperator = control.value === "Other" ? otherInput.value.trim() : control.value;
        updateAt(["testDetails", "operator"], nextOperator);
        syncOtherInputVisibility();
        syncOperatorLogo();
      });
      otherInput.addEventListener("change", () => {
        if (control.value !== "Other") return;
        updateAt(["testDetails", "operator"], otherInput.value.trim());
        syncOperatorLogo();
      });
      syncOtherInputVisibility();
      syncOperatorLogo();
      primaryRow.append(control, logo);
      wrap.append(primaryRow, otherInput);
      form.append(span, wrap);
      return;
    }

    form.append(span, control);
  });

  replacePanelContents(testDetailsPanel, form);
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
    replacePanelContents(measuresPanel, root);
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
  ["", "Conical", "Cylindrical"].forEach((option) => typeSelect.append(new Option(option, option)));
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
  sightglassSelect.dataset.skipOutcomeStyle = "true";
  sightglassSelect.value = current.sightglass || "no";
  sightglassSelect.addEventListener("change", () => {
    updateAt(["measures", VIEW_STATE.measuresTab, "sightglass"], sightglassSelect.value || "no");
    renderHoses();
  });
  form.append(sightglassSpan, sightglassSelect);

  const fields = [
    ["Volume (L)", "volume", "number", "field-small"],
    ["Serial number", "serialNumber", "text", "field-medium"],
    ["Reg 13 Certificate number", "certificateNumber", "text", "field-medium"],
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
    }, key !== "certificateExpiry");
    const fieldControl = key === "certificateExpiry" ? addDatePicker(input) : input;
    form.append(span, fieldControl);
  });

  card.append(form);
  root.append(card);
  replacePanelContents(measuresPanel, root);
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
    replacePanelContents(instrumentsPanel, root);
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
        duplicateAction: () => duplicateInstrument(VIEW_STATE.instrumentsTab),
        removeAction: () => removeInstrument(VIEW_STATE.instrumentsTab),
        extraActions: [
          { label: "←", icon: "", onClick: () => moveInstrument(VIEW_STATE.instrumentsTab, -1) },
          { label: "→", icon: "", onClick: () => moveInstrument(VIEW_STATE.instrumentsTab, 1) }
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
  const nmiCertificateBaseUrl = "https://www.industry.gov.au/national-measurement-institute/nmi-services/pattern-approval/search-certificates-approval/certificates-approval-5-flowmeters";

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
      : key === "hoseCount"
        ? buildLabelWithHelp(label, LABEL_HELP_TEXT.hoseCount)
      : document.createElement("span");
    if (!["numbering", "hoseCount"].includes(key)) span.textContent = label;
    const input = document.createElement("input");
    input.type = type;
    if (key === "manufactureDate") input.placeholder = "MM/YYYY";
    if (key === "nmiPatternApproval") input.placeholder = "5/6A/";
    if (sizeClass) input.classList.add(sizeClass);
    if (type === "number") input.dataset.validate = "number";
    //if (key === "manufactureDate") input.dataset.validate = "date";
    if (key === "nmiPatternApproval") input.dataset.validate = "nmiPatternApproval";
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

    if (key === "nmiPatternApproval") {
      const linkLabel = document.createElement("span");
      const certificateLink = document.createElement("a");
      const nmiPatternApproval = String(instrument.nmiPatternApproval || "").trim();
      const query = new URLSearchParams({
        combine: nmiPatternApproval,
        field_nmi_certificate_status_target_id: "All",
        term_node_tid_depth: "All",
        sort_by: "field_date_value",
        items_per_page: "50"
      });
      certificateLink.href = `${nmiCertificateBaseUrl}?${query.toString()}`;
      certificateLink.target = "_blank";
      certificateLink.rel = "noopener noreferrer";
      certificateLink.textContent = "Open certificate of approval →";
      form.append(linkLabel, certificateLink);
    }
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

  const typeSpan = buildLabelWithHelp("Type of system", LABEL_HELP_TEXT.typeOfSystem);
  const typeSelect = document.createElement("select");
  typeSelect.classList.add("field-medium");
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
  replacePanelContents(instrumentsPanel, root);
}

function renderHoses() {
  const root = document.createElement("div");
  root.className = "stack";

  if (dataset.instruments.length === 0) {
    root.textContent = "Add an instrument first to be able to view hoses.";
    replacePanelContents(hosesPanel, root);
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
          { label: "←", icon: "", onClick: () => moveHose(instrument, hoseKey, -1) },
          { label: "→", icon: "", onClick: () => moveHose(instrument, hoseKey, 1) }
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
  const hoseSerialPrefix = buildLabelWithHelp("Hose serial number", LABEL_HELP_TEXT.hoseSerialNumber);
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
  guideLink.textContent = "NMI Numbering Guide →";
  guideLink.className = "inline-guide-link";
  hoseSerialWrap.append(prefix, suffix, guideLink);
  grid.append(hoseSerialPrefix, hoseSerialWrap);

  const basicFields = [
    ["Unit price displayed (¢/L)", "unitPrice", "number"],
    ["Start tote", "startTote", "number"],
    ["End tote", "endTote", "number"],
    ["Qmin (L/min)", "qmin", "number"],
    ["Qmax (L/min)", "qmax", "number"],
    ["Maximum achievable rate (L/min) (clause 3.8)", "maxRate", "number"]
  ];

  basicFields.forEach(([label, key, type]) => {
    const span = key === "maxRate" ? buildLabelWithHelp(label, LABEL_HELP_TEXT.maxAchievableRate) : document.createElement("span");
    if (key !== "maxRate") appendSubscriptText(span, label);
    const input = document.createElement("input");
    input.type = type;
    input.classList.add("field-small");
    setSchemaNameAttr(input, key);
    if (key === "unitPrice") configureDecimalInput(input);
    else if (type === "number") input.dataset.validate = "number";
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

  if ((hose.measureCheck.performanceCode || "").toUpperCase() === "H") {
    const commentsLabel = document.createElement("span");
    commentsLabel.textContent = "Comments";
    const commentsInput = document.createElement("textarea");
    commentsInput.classList.add("field-large");
    setSchemaNameAttr(commentsInput, "comments");
    commentsInput.value = hose.measureCheck.comments || "";
    commentsInput.addEventListener("change", () => {
      hose.measureCheck.comments = commentsInput.value;
      persistLocalDataset();
    });
    grid.append(commentsLabel, commentsInput);
  }

  const volumeSpan = document.createElement("span");
  volumeSpan.textContent = "Volume used for testing";
  const volumeStrong = document.createElement("span");
  volumeStrong.className = "test-vol";
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
  if (activeTabLabel === "In-service Inspection") body.append(renderMeasureCheckPanel(hose, instrument.type));
  if (activeTabLabel === "Verification") body.append(renderVerificationPanel(hose, instrument.type));
  if (activeTabLabel === "Compliance") body.append(renderCompliancePanel(hose));

  content.append(body);
  root.append(content);

  replacePanelContents(hosesPanel, root);
  attachOutcomeSelectStyling();
  attachGlobalValidation();
}

function visibleHoseTabs(performanceCode) {
  const code = (performanceCode || "").toUpperCase();
  const tabs = ["In-service Inspection", "Verification", "Compliance"];
  if (code === "A" || ["E", "F", "G", "H"].includes(code)) return ["Verification", "Compliance"];
  if (code === "B") return ["In-service Inspection", "Compliance"];
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

function calculateEd(eav, efd) {
  const averageError = Number(eav);
  const gasEliminationEfd = Number(efd);
  if (!Number.isFinite(averageError) || !Number.isFinite(gasEliminationEfd)) return "";
  return (averageError - gasEliminationEfd).toFixed(2);
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
    return "Invalid size for flow rate.";
  }

  return "";
}

function exceedsMpe(efd) {
  const mpe = Number(dataset.testDetails.mpe);
  const efdVal = Number(efd);
  if (!Number.isFinite(mpe) || !Number.isFinite(efdVal)) return false;
  return Math.abs(efdVal) > Math.abs(mpe);
}


function antiDrainLimitForQmax(qmax) {
  const parsedQmax = Number(qmax);
  if (!Number.isFinite(parsedQmax)) return null;
  return parsedQmax <= 60 ? 20 : 50;
}

function applyAntiDrainOutcomeStyle(input, qmax) {
  input.classList.remove("select-good", "select-bad");
  const antiDrainValue = Number(input.value);
  const limit = antiDrainLimitForQmax(qmax);
  if (!Number.isFinite(antiDrainValue) || !Number.isFinite(limit)) return;
  if (antiDrainValue > limit) {
    input.classList.add("select-bad");
    return;
  }
  input.classList.add("select-good");
}

function renderMeasureCheckPanel(hose, instrumentType) {
  return renderDeliveryPanel(hose, "measureCheck", instrumentType);
}

function verificationMarkWithDateCode() {
  const baseMark = String(dataset?.testDetails?.verificationMark || "").trim();
  if (!baseMark) return "";
  const testDateValue = String(dataset?.testDetails?.date || "").trim();
  const parsedDate = parseDateDdMmYyyy(toDisplayDate(testDateValue));
  const dateSource = parsedDate || new Date();
  const monthCode = String.fromCharCode(65 + dateSource.getMonth());
  const yearCode = String(dateSource.getFullYear()).slice(-1);
  return `${baseMark}${monthCode}${yearCode}`;
}

function renderVerificationPanel(hose, instrumentType) {
  return renderDeliveryPanel(hose, "verification", instrumentType);
}

function hasPresetIndications(hose) {
  return String(hose?.compliance?.q6 || "").trim().toUpperCase() !== "N/A";
}

function deliveryRows(hose, sectionKey) {
  const rows = [
    ["Delivery #1 (max flow)", hose[sectionKey].deliveries[0]],
    ["Delivery #2 (max flow)", hose[sectionKey].deliveries[1]],
    ["Delivery #3 (max flow)", hose[sectionKey].deliveries[2]],
    ["Delivery #4 (min flow)", hose[sectionKey].deliveries[3]]
  ];
  if (hasPresetIndications(hose)) {
    rows.push(["Preset Delivery (clause 3.10)", hose[sectionKey].preset]);
  }
  rows.push(["Gas Elimination Delivery (clause 3.12)", hose[sectionKey].gasElimination]);
  return rows;
}

function renderDeliveryPanel(hose, sectionKey, instrumentType = "") {
  const isVerification = sectionKey === "verification";
  const wrap = document.createElement("div");
  const data = hose[sectionKey];
  const avgError = average([
    data.deliveries[0].efd,
    data.deliveries[1].efd,
    data.deliveries[2].efd
  ]);
  if (isVerification) {
    const verificationMark = document.createElement("div");
    verificationMark.className = "verification-mark";
    verificationMark.title = "Verification mark";
    verificationMark.textContent = verificationMarkWithDateCode();
    wrap.append(verificationMark);
  }

  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = "<thead><tr><th>Accuracy (clause 3.0)</th><th>Measure used</th><th></th><th></th><th></th><th></th></tr></thead>";
  const vfdHeading = table.querySelector("thead th:nth-child(3)");
  if (vfdHeading) appendSubscriptText(vfdHeading, "VFD (L)");
  const vrefHeading = table.querySelector("thead th:nth-child(4)");
  if (vrefHeading) appendSubscriptText(vrefHeading, "VREF (L)");
  const efdHeading = table.querySelector("thead th:nth-child(5)");
  if (efdHeading) {
    efdHeading.append(buildLabelWithHelp("EFD (%)", LABEL_HELP_TEXT.efdPercent), document.createElement("br"));
    //efdHeading.append("Accuracy", document.createElement("br"), "(clause 3.9)");
  }
  const edHeading = table.querySelector("thead th:nth-child(6)");
  if (edHeading) {
    edHeading.append(buildLabelWithHelp("ED (%)", LABEL_HELP_TEXT.edPercent));
  }
  const body = document.createElement("tbody");
  const isSuctionSystem = String(instrumentType || "").trim().toLowerCase() === "suction";

  deliveryRows(hose, sectionKey).forEach(([labelText, rowObj], rowIndex) => {
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
    const sizeError = validateMeasureSize(hose, selectedMeasure, { section: sectionKey, rowIndex });
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
    if (rowIndex === 5 && isSuctionSystem) {
      ed.textContent = calculateEd(avgError, rowObj.efd);
    }

    tr.append(label, measureCell, vfd, vref, efd, ed);
    if (exceedsMpe(rowObj.efd)) tr.classList.add("row-error");
    body.append(tr);
  });

  table.append(body);
  const tableScroller = document.createElement("div");
  tableScroller.className = "worksheet-table-scroll";
  tableScroller.append(table);

  const meta = document.createElement("div");
  meta.className = "form-grid top-gap";

  const avgLabel = document.createElement("span");
  appendSubscriptText(avgLabel, "Average error runs 1-3 (EAV) (clause 3.12) %");
  const avgVal = document.createElement("span");
  avgVal.className="avg-error";
  avgVal.textContent = avgError === "" ? "" : avgError;
  if (exceedsMpe(avgError)) avgVal.classList.add("value-bad");

  const antiLabel = buildLabelWithHelp(
    "Anti-drain/Hose dilation vol. of drained fuel (mL) (clause 3.13)",
    LABEL_HELP_TEXT.antiDrain
  );
  const antiInput = document.createElement("input");
  antiInput.type = "number";
  antiInput.classList.add("field-small");
  setSchemaNameAttr(antiInput, "antiDrainMl");
  antiInput.value = data.antiDrainMl || "";
  applyAntiDrainOutcomeStyle(antiInput, hose.qmax);
  antiInput.addEventListener("input", () => {
    applyAntiDrainOutcomeStyle(antiInput, hose.qmax);
  });
  antiInput.addEventListener("change", () => {
    data.antiDrainMl = antiInput.value;
    applyAntiDrainOutcomeStyle(antiInput, hose.qmax);
    persistLocalDataset();
  });

  meta.append(avgLabel, avgVal, antiLabel, antiInput);
  if (isVerification) {
    const reverificationLabel = document.createElement("span");
    reverificationLabel.textContent = "Record existing verification mark (if reverifying)";
    const reverificationInput = document.createElement("input");
    reverificationInput.type = "text";
    reverificationInput.classList.add("field-medium");
    setSchemaNameAttr(reverificationInput, "reverification");
    reverificationInput.value = hose.verification.reverification || "";
    reverificationInput.addEventListener("change", () => {
      hose.verification.reverification = reverificationInput.value;
      persistLocalDataset();
    });
    meta.append(reverificationLabel, reverificationInput);
  }

  wrap.append(tableScroller, meta);
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
      if (key === "q6") renderHoses();
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
  input.type = "text";
  input.inputMode = "decimal";
  input.classList.add("field-small");
  setSchemaNameAttr(input, key);
  input.dataset.validate = "decimal2";
  const initialValue = Number(target[key]);
  input.value = target[key] === "" || target[key] == null || !Number.isFinite(initialValue) ? "" : initialValue.toFixed(2);
  input.disabled = disabled;
  const persistDecimal = () => {
    const raw = (input.value || "").trim();
    if (!raw) {
      target[key] = "";
      onChange?.();
      persistLocalDataset();
      renderHoses();
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const fixed = parsed.toFixed(2);
    input.value = fixed;
    target[key] = fixed;
    onChange?.();
    persistLocalDataset();
    renderHoses();
  };
  input.addEventListener("change", () => {
    persistDecimal();
  });
  input.addEventListener("blur", () => {
    persistDecimal();
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
  if (!saveStatus.textContent.includes("Locally saved")) persistLocalDataset({ markDirty: false });
}

renderAll();
handleStartMode();
