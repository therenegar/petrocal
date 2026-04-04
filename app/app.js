const STORAGE_KEY = "petrocal.dataset.v2";
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
  "Checking facility for indicating devices (clause 4.1)",
  "Zero setting (clause 4.2)",
  "Price computing (clause 4.3)",
  "Nozzle cut-off (clause 4.4)",
  "Interlock (clause 4.5)",
  "Pre-set indications (clause 4.6)"
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
  version: 2,
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
    address: ""
  },
  form6Details: {
    licenceNumber: "",
    businessName: "",
    abnNumber: ""
  },
  measures: [],
  instruments: []
});

let dataset = loadLocalDataset() || defaultDataset();
const START_MODE = new URLSearchParams(window.location.search).get("start") || "resume";

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
  const confirmed = window.confirm("Start a new worksheet? This clears all locally saved Petrocal data in this browser.");
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
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("petrocal.dataset.v1");
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
  normalized.measures = normalized.measures.map((measure) => {
    const convertedType = Array.isArray(measure?.type) ? (measure.type.includes("cylindrical") ? "cylindrical" : "conical") : (measure?.type || "");
    const convertedSightglass = Array.isArray(measure?.type)
      ? (measure.type.includes("sightglass") ? "yes" : "no")
      : (measure?.sightglass || "no");
    return {
      type: convertedType,
      sightglass: convertedSightglass,
      serialNumber: "",
      volume: "",
      certificateNumber: "",
      certificateExpiry: "",
      ...measure,
      type: convertedType,
      sightglass: convertedSightglass,
      certificateExpiry: toDisplayDate(measure?.certificateExpiry || "")
    };
  });

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
      antiDrainMl: ""
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

function bindInput(input, path, parser = (v) => v, rerender = true) {
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
    add.textContent = "Add";
    add.addEventListener("click", addAction);
    actionsWrap.append(add);
  }

  if (removeAction) {
    const remove = document.createElement("button");
    remove.className = "btn small-btn";
    remove.textContent = "Remove";
    remove.addEventListener("click", removeAction);
    actionsWrap.append(remove);
  }

  extraActions.forEach(({ label, onClick }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn small-btn";
    button.textContent = label;
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
  left.textContent = "←";
  left.addEventListener("click", onLeft);
  const right = document.createElement("button");
  right.className = "btn small-btn";
  right.textContent = "→";
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
  const fields = [
    ["Date of test", "date", "text", null, "field-small"],
    ["Job number", "jobNumber", "number", null, "field-small"],
    ["Type of test", "type", "select", ["commissioning", "in-service inspection", "measure check", "verification"]],
    ["Verifier's name", "verifierName", "text", null, "field-medium"],
    ["Registration number", "registrationNumber", "text", null, "field-small"],
    ["Verification mark", "verificationMark", "text", null, "field-small"],
    ["Operator/owner", "operator", "select", ["ampol", "bp", "shell", "liberty", "united", "other"], "field-medium"],
    ["Maximum permissible error (MPE)", "mpe", "number", null, "field-small"],
    ["Site name", "siteName", "text", null, "field-medium"],
    ["Site number", "siteNumber", "text", null, "field-small"],
    ["Contact on site", "contactOnSite", "text", null, "field-medium"],
    ["Address", "address", "textarea", null, "field-large"]
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
      if (key === "date") control.dataset.validate = "date";
      if (type === "number") control.dataset.validate = "number";
    }
    if (sizeClass) control.classList.add(sizeClass);

    control.value = key === "date" ? toDisplayDate(dataset.testDetails[key]) : (dataset.testDetails[key] ?? "");
    bindInput(control, ["testDetails", key], (value) => {
      if (key === "date") return toDisplayDate(value);
      return type === "number" ? (value === "" ? "" : Number(value)) : value;
    });

    form.append(span, control);
  });

  testDetailsPanel.replaceChildren(form);
}

function renderMeasures() {
  const root = document.createElement("div");
  root.className = "stack";

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
  typeSelect.value = current.type || "";
  typeSelect.addEventListener("change", () => {
    updateAt(["measures", VIEW_STATE.measuresTab, "type"], typeSelect.value);
    renderMeasures();
    renderHoses();
  });
  form.append(typeSpan, typeSelect);

  const sightglassSpan = document.createElement("span");
  sightglassSpan.textContent = "Sightglass?";
  const sightglassSelect = document.createElement("select");
  sightglassSelect.classList.add("field-small");
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
    ["Volume", "volume", "number", "field-small"],
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
          { label: "←", onClick: () => moveInstrument(VIEW_STATE.instrumentsTab, -1) },
          { label: "→", onClick: () => moveInstrument(VIEW_STATE.instrumentsTab, 1) }
        ]
      }
    )
  );

  const index = VIEW_STATE.instrumentsTab;
  const instrument = dataset.instruments[index];

  const card = document.createElement("section");
  card.className = "card";
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

  card.append(form, document.createElement("hr"));

  const inspectionTitle = document.createElement("h4");
  inspectionTitle.textContent = "General Characteristics (clause 3.1)";
  const inspection = document.createElement("div");
  inspection.className = "form-grid inspection-grid";

  VISUAL_INSPECTION_QUESTIONS.forEach((question, qIndex) => {
    const key = `q${qIndex + 1}`;
    const span = document.createElement("span");
    span.textContent = question;
    const select = document.createElement("select");
    select.classList.add("field-small");
    ["", "yes", "no", "N/A"].forEach((value) => select.append(new Option(value, value)));
    select.value = instrument.inspection?.[key] || "";
    bindInput(select, ["instruments", index, "inspection", key]);
    inspection.append(span, select);
  });

  card.append(inspectionTitle, inspection);
  root.append(card);
  instrumentsPanel.replaceChildren(root);
}

function renderHoses() {
  const root = document.createElement("div");
  root.className = "stack";

  if (dataset.instruments.length === 0) {
    root.textContent = "Add an instrument first.";
    hosesPanel.replaceChildren(root);
    return;
  }

  VIEW_STATE.hosesInstrumentTab = clampIndex(VIEW_STATE.hosesInstrumentTab, dataset.instruments.length);
  const instrument = dataset.instruments[VIEW_STATE.hosesInstrumentTab];
  enforceHoseCount(instrument);

  const instrumentSelector = document.createElement("select");
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
          { label: "←", onClick: () => moveHose(instrument, hoseKey, -1) },
          { label: "→", onClick: () => moveHose(instrument, hoseKey, 1) }
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
  prefix.textContent = baseSerial ? `${baseSerial}-` : "";
  const suffix = document.createElement("input");
  suffix.type = "text";
  suffix.classList.add("field-tiny");
  suffix.value = hose.hoseSerialSuffix || "";
  suffix.addEventListener("change", () => {
    hose.hoseSerialSuffix = suffix.value;
    persistLocalDataset();
  });
  const guideLink = document.createElement("a");
  guideLink.href = "https://www.industry.gov.au/sites/default/files/2019-06/fuel-dispenser-numbering-guide.pdf";
  guideLink.target = "_blank";
  guideLink.rel = "noopener noreferrer";
  guideLink.textContent = "Numbering Guide";
  guideLink.className = "inline-guide-link";
  hoseSerialWrap.append(prefix, suffix, guideLink);
  grid.append(hoseSerialPrefix, hoseSerialWrap);

  const basicFields = [
    ["Unit price (c/L)", "unitPrice", "number"],
    ["Start tote", "startTote", "number"],
    ["End tote", "endTote", "number"],
    ["Qmin (L/min)", "qmin", "number"],
    ["Qmax (L/min)", "qmax", "number"],
    ["Maximum achievable rate (clause 4.7)", "maxRate", "number"]
  ];

  basicFields.forEach(([label, key, type]) => {
    const span = document.createElement("span");
    span.textContent = label;
    const input = document.createElement("input");
    input.type = type;
    input.classList.add("field-small");
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
  table.innerHTML = "<thead><tr><th></th><th>Measure used</th><th>VFD (L)</th><th>VREF (L)</th><th>EFD (%)<br>Accuracy<br/>(clause 4.8)</th></tr></thead>";
  const body = document.createElement("tbody");

  hose.measureCheck.checks.forEach((check, idx) => {
    const tr = document.createElement("tr");
    const label = document.createElement("td");
    label.textContent = idx === 2 ? "Check #3 (slow flow)" : `Check #${idx + 1} (regular flow)`;

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
    ["Delivery #1 (regular flow)", hose.verification.deliveries[0]],
    ["Delivery #2 (regular flow)", hose.verification.deliveries[1]],
    ["Delivery #3 (regular flow)", hose.verification.deliveries[2]],
    ["Delivery #4 (slow flow)", hose.verification.deliveries[3]],
    ["Preset Delivery (clause 4.9)", hose.verification.preset],
    ["Gas Elimination Delivery (clause 4.10)", hose.verification.gasElimination]
  ];
}

function renderVerificationPanel(hose, instrumentType) {
  const wrap = document.createElement("div");
  const table = document.createElement("table");
  table.className = "data-table";
  table.innerHTML = "<thead><tr><th></th><th>Measure used</th><th>VFD (L)</th><th>VREF (L)</th><th>EFD (%)<br/>Accuracy<br/>(clause 4.8)</th><th>ED (%)</th></tr></thead>";
  const body = document.createElement("tbody");

  verificationRows(hose).forEach(([labelText, rowObj], rowIndex) => {
    if (labelText === "Gas Elimination Delivery" && instrumentType !== "Suction") return;
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
  avgLabel.textContent = "Average error (EAV) (clause 4.0)";
  const avgVal = document.createElement("strong");
  avgVal.textContent = avgError === "" ? "" : avgError;

  const antiLabel = document.createElement("span");
  antiLabel.textContent = "Anti-drain volume of drained fuel (clause 4.11)";
  const antiInput = document.createElement("input");
  antiInput.type = "number";
  antiInput.classList.add("field-small");
  antiInput.value = hose.verification.antiDrainMl || "";
  antiInput.addEventListener("change", () => {
    hose.verification.antiDrainMl = antiInput.value;
    persistLocalDataset();
  });

  meta.append(avgLabel, avgVal, antiLabel, antiInput);

  wrap.append(table, meta);
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
    ["", "pass", "fail", "N/A"].forEach((option) => select.append(new Option(option, option)));
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
  localStorage.removeItem("petrocal.dataset.v1");
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
  attachGlobalValidation();
}

function renderAll() {
  renderAllPanels();
  if (!saveStatus.textContent.includes("Locally saved")) persistLocalDataset();
}

renderAll();
handleStartMode();
