const STORAGE_KEY = "petrocal.dataset.v1";

const defaultDataset = () => ({
  version: 1,
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
  measures: [],
  instruments: []
});

let dataset = loadLocalDataset() || defaultDataset();

const tabButtons = [...document.querySelectorAll(".tab")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];

const testDetailsPanel = document.getElementById("testDetails");
const measuresPanel = document.getElementById("measures");
const instrumentsPanel = document.getElementById("instruments");
const hosesPanel = document.getElementById("hoses");
const reportPanel = document.getElementById("report");
const form6Panel = document.getElementById("form6");
const saveStatus = document.getElementById("saveStatus");

document.getElementById("loadDatasetBtn").addEventListener("click", () => {
  document.getElementById("datasetFileInput").click();
});

document.getElementById("datasetFileInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    dataset = normalizeDataset(parsed);
    persistLocalDataset();
    renderAll();
  } catch {
    alert("Invalid JSON dataset file.");
  }
  event.target.value = "";
});

document.getElementById("saveDatasetBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `petrocal-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => selectTab(button.dataset.tab));
});

function selectTab(tabId) {
  tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
  tabPanels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
}

function normalizeDataset(input) {
  const base = defaultDataset();
  return {
    ...base,
    ...input,
    testDetails: { ...base.testDetails, ...(input?.testDetails || {}) },
    measures: Array.isArray(input?.measures) ? input.measures : [],
    instruments: Array.isArray(input?.instruments) ? input.instruments : []
  };
}

function loadLocalDataset() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeDataset(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function persistLocalDataset() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  saveStatus.textContent = `◉ Locally saved ${new Date().toLocaleString()}`;
}

function updateValue(path, value) {
  let target = dataset;
  for (let i = 0; i < path.length - 1; i += 1) {
    target = target[path[i]];
  }
  target[path[path.length - 1]] = value;
  persistLocalDataset();
}

function addMeasure() {
  dataset.measures.push({
    type: [],
    serialNumber: "",
    volume: "",
    certificateNumber: "",
    certificateExpiry: ""
  });
  persistLocalDataset();
  renderMeasures();
}

function addInstrument() {
  dataset.instruments.push({
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
    inspection: { q1: "", q2: "", comments: "" },
    hoses: []
  });
  persistLocalDataset();
  renderInstruments();
  renderHoses();
}

function addHose(instrumentIndex) {
  const instrument = dataset.instruments[instrumentIndex];
  if (!instrument) return;
  instrument.hoses ||= [];
  instrument.hoses.push({
    number: "",
    grade: "",
    hoseSerialSuffix: "",
    unitPrice: "",
    startTote: "",
    endTote: "",
    qmin: "",
    qmax: "",
    maxRate: "",
    measureCheck: { performanceCode: "", checks: [emptyCheck(), emptyCheck(), emptyCheck()] },
    verification: {
      deliveries: [emptyDelivery(), emptyDelivery(), emptyDelivery(), emptyDelivery()],
      preset: emptyDelivery(),
      gasElimination: emptyDelivery(),
      antiDrainMl: ""
    },
    compliance: { q1: "", q2: "", q3: "", overall: "Pass" }
  });
  persistLocalDataset();
  renderHoses();
}

function emptyCheck() {
  return { measureId: "", vfd: "", vref: "", efd: "" };
}

function emptyDelivery() {
  return { measureId: "", vfd: "", vref: "", efd: "" };
}

function bindInput(input, path, parser = (v) => v) {
  input.addEventListener("change", (event) => {
    updateValue(path, parser(event.target.value));
    renderHoses();
  });
}

function renderTestDetails() {
  const fields = [
    ["Date", "date", "date"],
    ["Job number", "jobNumber", "number"],
    ["Type", "type", "select", ["commissioning", "in-service inspection", "measure check", "verification"]],
    ["Verifier's name", "verifierName", "text"],
    ["Registration number", "registrationNumber", "text"],
    ["Verification mark", "verificationMark", "text"],
    ["Operator", "operator", "select", ["ampol", "bp", "shell", "liberty", "united", "other"]],
    ["MPE - Maximum permissible error", "mpe", "number"],
    ["Site name", "siteName", "text"],
    ["Site number", "siteNumber", "text"],
    ["Contact on site", "contactOnSite", "text"],
    ["Address", "address", "textarea"]
  ];

  const wrapper = document.createElement("div");
  wrapper.className = "form-grid";

  fields.forEach(([label, key, type, options]) => {
    const labelNode = document.createElement("label");
    labelNode.className = "form-row";

    const span = document.createElement("span");
    span.textContent = label;

    let input;
    if (type === "select") {
      input = document.createElement("select");
      input.append(new Option("", ""));
      options.forEach((option) => input.append(new Option(option, option)));
    } else if (type === "textarea") {
      input = document.createElement("textarea");
    } else {
      input = document.createElement("input");
      input.type = type;
      if (key === "mpe") input.step = "0.1";
      if (key === "jobNumber") {
        input.min = "0";
        input.max = "99999";
      }
    }

    input.value = dataset.testDetails[key] ?? "";
    bindInput(input, ["testDetails", key], (v) => (type === "number" ? (v === "" ? "" : Number(v)) : v));

    wrapper.append(labelNode);
    labelNode.append(span, input);
  });

  testDetailsPanel.replaceChildren(wrapper);
}

function renderMeasures() {
  const root = document.createElement("div");
  root.className = "stack";

  const actions = document.createElement("div");
  actions.className = "row-actions";
  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "➕ Add Measure";
  addBtn.addEventListener("click", addMeasure);
  actions.append(addBtn);
  root.append(actions);

  dataset.measures.forEach((measure, measureIndex) => {
    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `<h3>Measure ${measureIndex + 1}</h3>`;

    const form = document.createElement("div");
    form.className = "form-grid";

    const mk = (label, key, type = "text") => {
      const span = document.createElement("span");
      span.textContent = label;
      const input = document.createElement(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") input.type = type;
      input.value = measure[key] ?? "";
      bindInput(input, ["measures", measureIndex, key], (v) => (type === "number" ? (v === "" ? "" : Number(v)) : v));
      form.append(span, input);
    };

    const typeSpan = document.createElement("span");
    typeSpan.textContent = "Type";
    const typeSelect = document.createElement("select");
    ["conical", "cylindrical", "sightglass", "no sightglass"].forEach((option) => {
      const opt = new Option(option, option);
      opt.selected = (measure.type || []).includes(option);
      typeSelect.append(opt);
    });
    typeSelect.multiple = true;
    typeSelect.size = 4;
    typeSelect.addEventListener("change", () => {
      updateValue(
        ["measures", measureIndex, "type"],
        [...typeSelect.selectedOptions].map((option) => option.value)
      );
      renderHoses();
    });
    form.append(typeSpan, typeSelect);

    mk("Serial number", "serialNumber");
    mk("Volume (L)", "volume", "number");
    mk("Certificate number", "certificateNumber");
    mk("Certificate expiry", "certificateExpiry", "date");

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn small";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      dataset.measures.splice(measureIndex, 1);
      persistLocalDataset();
      renderMeasures();
      renderHoses();
    });

    card.append(form, removeBtn);
    root.append(card);
  });

  measuresPanel.replaceChildren(root);
}

function renderInstruments() {
  const root = document.createElement("div");
  root.className = "stack";
  const actions = document.createElement("div");
  actions.className = "row-actions";
  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "➕ Add Instrument";
  addBtn.addEventListener("click", addInstrument);
  actions.append(addBtn);
  root.append(actions);

  dataset.instruments.forEach((instrument, instrumentIndex) => {
    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `<h3>Instrument ${instrumentIndex + 1}</h3><p class='help'>Enter POS numbers separated by commas.</p>`;

    const form = document.createElement("div");
    form.className = "form-grid";

    const textField = (label, key, type = "text") => {
      const span = document.createElement("span");
      span.textContent = label;
      const input = document.createElement("input");
      input.type = type;
      input.value = instrument[key] ?? "";
      bindInput(input, ["instruments", instrumentIndex, key], (v) => (type === "number" ? (v === "" ? "" : Number(v)) : v));
      form.append(span, input);
    };

    textField("Numbering", "numbering");
    textField("Hose count", "hoseCount", "number");
    textField("Manufacturer", "manufacturer");
    textField("Make", "make");
    textField("Model number", "modelNumber");
    textField("Serial number", "serialNumber");
    textField("Manufacture date", "manufactureDate", "month");
    textField("NMI pattern approval", "nmiPatternApproval");

    const productsSpan = document.createElement("span");
    productsSpan.textContent = "Products approved";
    const productsSelect = document.createElement("select");
    productsSelect.multiple = true;
    productsSelect.size = 6;
    ["Petrol", "Diesel", "Bio-diesel", "Ethanol", "DEF/AdBlue", "Kerosene"].forEach((option) => {
      const opt = new Option(option, option);
      opt.selected = (instrument.productsApproved || []).includes(option);
      productsSelect.append(opt);
    });
    productsSelect.addEventListener("change", () => {
      updateValue(
        ["instruments", instrumentIndex, "productsApproved"],
        [...productsSelect.selectedOptions].map((option) => option.value)
      );
    });
    form.append(productsSpan, productsSelect);

    const typeSpan = document.createElement("span");
    typeSpan.textContent = "Type";
    const typeSelect = document.createElement("select");
    ["", "Pressurised", "Suction"].forEach((option) => typeSelect.append(new Option(option, option)));
    typeSelect.value = instrument.type || "";
    bindInput(typeSelect, ["instruments", instrumentIndex, "type"]);
    form.append(typeSpan, typeSelect);

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn small";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      dataset.instruments.splice(instrumentIndex, 1);
      persistLocalDataset();
      renderInstruments();
      renderHoses();
    });

    card.append(form, document.createElement("hr"));

    const inspectionTitle = document.createElement("h4");
    inspectionTitle.textContent = "Visual Inspection";

    const inspection = document.createElement("div");
    inspection.className = "form-grid";
    ["q1", "q2"].forEach((q, idx) => {
      const span = document.createElement("span");
      span.textContent = `Question ${idx + 1}`;
      const select = document.createElement("select");
      ["", "yes", "no", "N/A"].forEach((o) => select.append(new Option(o, o)));
      select.value = instrument.inspection?.[q] || "";
      bindInput(select, ["instruments", instrumentIndex, "inspection", q]);
      inspection.append(span, select);
    });

    const commentSpan = document.createElement("span");
    commentSpan.textContent = "Comments";
    const comment = document.createElement("textarea");
    comment.value = instrument.inspection?.comments || "";
    bindInput(comment, ["instruments", instrumentIndex, "inspection", "comments"]);
    inspection.append(commentSpan, comment);

    card.append(inspectionTitle, inspection, removeBtn);
    root.append(card);
  });

  instrumentsPanel.replaceChildren(root);
}

function calculateEfd(vfd, vref) {
  const nVfd = Number(vfd);
  const nVref = Number(vref);
  if (!Number.isFinite(nVfd) || !Number.isFinite(nVref) || nVref === 0) return "";
  return (((nVfd - nVref) / nVref) * 100).toFixed(3);
}

function measureHasSightglass(measureId) {
  const measure = dataset.measures[Number(measureId)];
  return Array.isArray(measure?.type) && measure.type.includes("sightglass");
}

function renderHoses() {
  const root = document.createElement("div");
  root.className = "stack";

  if (dataset.instruments.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Add an instrument first.";
    root.append(empty);
    hosesPanel.replaceChildren(root);
    return;
  }

  dataset.instruments.forEach((instrument, instrumentIndex) => {
    const instrumentCard = document.createElement("section");
    instrumentCard.className = "card";
    const title = document.createElement("h3");
    title.textContent = `Instrument ${instrumentIndex + 1}`;
    instrumentCard.append(title);

    const addBtn = document.createElement("button");
    addBtn.className = "btn small";
    addBtn.textContent = "➕ Add Hose";
    addBtn.addEventListener("click", () => addHose(instrumentIndex));
    instrumentCard.append(addBtn);

    (instrument.hoses || []).forEach((hose, hoseIndex) => {
      const hoseCard = document.createElement("section");
      hoseCard.className = "card";
      hoseCard.innerHTML = `<h4>Hose ${hoseIndex + 1}</h4>`;

      const grid = document.createElement("div");
      grid.className = "form-grid";

      const mkInput = (label, key, type = "text") => {
        const span = document.createElement("span");
        span.textContent = label;
        const input = document.createElement("input");
        input.type = type;
        input.value = hose[key] ?? "";
        bindInput(input, ["instruments", instrumentIndex, "hoses", hoseIndex, key], (v) =>
          type === "number" ? (v === "" ? "" : Number(v)) : v
        );
        grid.append(span, input);
      };

      mkInput("POS Number", "number");

      const gradeSpan = document.createElement("span");
      gradeSpan.textContent = "Grade";
      const grade = document.createElement("select");
      ["", "ULP91", "PULP95", "PULP98", "E-10", "E85", "OPAL 91", "Diesel", "Premium Diesel", "Bio Diesel", "AdBlue", "Kerosene"].forEach((value) =>
        grade.append(new Option(value, value))
      );
      grade.value = hose.grade || "";
      bindInput(grade, ["instruments", instrumentIndex, "hoses", hoseIndex, "grade"]);
      grid.append(gradeSpan, grade);

      mkInput("Hose serial suffix", "hoseSerialSuffix");
      mkInput("Unit price (c/L)", "unitPrice", "number");
      mkInput("Start tote", "startTote", "number");
      mkInput("End tote", "endTote", "number");
      mkInput("Qmin (L/min)", "qmin", "number");
      mkInput("Qmax (L/min)", "qmax", "number");
      mkInput("Maximum rate (L/min)", "maxRate", "number");

      const perfSpan = document.createElement("span");
      perfSpan.textContent = "Performance code";
      const perf = document.createElement("select");
      ["", "A", "B", "C", "D", "E", "F", "G", "H"].forEach((value) => perf.append(new Option(value, value)));
      perf.value = hose.measureCheck?.performanceCode || "";
      bindInput(perf, ["instruments", instrumentIndex, "hoses", hoseIndex, "measureCheck", "performanceCode"]);
      grid.append(perfSpan, perf);

      const volumeLabel = document.createElement("span");
      volumeLabel.textContent = "Volume used for testing";
      const volumeValue = document.createElement("strong");
      const volumeUsed = Number(hose.endTote) - Number(hose.startTote);
      volumeValue.textContent = Number.isFinite(volumeUsed) ? `${volumeUsed || 0} L` : "0 L";
      grid.append(volumeLabel, volumeValue);

      hoseCard.append(grid, document.createElement("hr"));

      const table = document.createElement("table");
      table.innerHTML = "<thead><tr><th>Check</th><th>Measure</th><th>VFD</th><th>VREF</th><th>EFD (%)</th></tr></thead>";
      const body = document.createElement("tbody");
      (hose.measureCheck?.checks || []).forEach((check, checkIndex) => {
        const row = document.createElement("tr");
        const label = document.createElement("td");
        label.textContent = `Check #${checkIndex + 1}`;

        const measureCell = document.createElement("td");
        const measureSelect = document.createElement("select");
        measureSelect.append(new Option("", ""));
        dataset.measures.forEach((measure, idx) => {
          measureSelect.append(new Option(`${idx + 1}: ${measure.serialNumber || "unnamed"}`, String(idx)));
        });
        measureSelect.value = check.measureId ?? "";
        measureSelect.addEventListener("change", () => {
          check.measureId = measureSelect.value;
          const selectedMeasure = dataset.measures[Number(check.measureId)];
          if (selectedMeasure) {
            const fixedVolume = selectedMeasure.volume || "";
            if (measureHasSightglass(check.measureId)) {
              check.vfd = fixedVolume;
            } else {
              check.vref = fixedVolume;
            }
          }
          check.efd = calculateEfd(check.vfd, check.vref);
          persistLocalDataset();
          renderHoses();
        });
        measureCell.append(measureSelect);

        const vfdCell = inputCell(check, "vfd", () => {
          check.efd = calculateEfd(check.vfd, check.vref);
        });
        const vrefCell = inputCell(check, "vref", () => {
          check.efd = calculateEfd(check.vfd, check.vref);
        });
        const efdCell = document.createElement("td");
        efdCell.textContent = check.efd || "";

        row.append(label, measureCell, vfdCell, vrefCell, efdCell);
        body.append(row);
      });
      table.append(body);
      hoseCard.append(table);

      const compliance = document.createElement("div");
      compliance.className = "form-grid";
      ["q1", "q2", "q3"].forEach((key, idx) => {
        const span = document.createElement("span");
        span.textContent = `Compliance question ${idx + 1}`;
        const select = document.createElement("select");
        ["", "yes", "no", "N/A"].forEach((opt) => select.append(new Option(opt, opt)));
        select.value = hose.compliance?.[key] || "";
        bindInput(select, ["instruments", instrumentIndex, "hoses", hoseIndex, "compliance", key]);
        compliance.append(span, select);
      });

      const overallSpan = document.createElement("span");
      overallSpan.textContent = "Overall Result";
      const overall = document.createElement("select");
      ["Pass", "Fail"].forEach((opt) => overall.append(new Option(opt, opt)));
      overall.value = hose.compliance?.overall || "Pass";
      bindInput(overall, ["instruments", instrumentIndex, "hoses", hoseIndex, "compliance", "overall"]);
      compliance.append(overallSpan, overall);

      hoseCard.append(document.createElement("hr"), compliance);

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn small";
      removeBtn.textContent = "Remove Hose";
      removeBtn.addEventListener("click", () => {
        instrument.hoses.splice(hoseIndex, 1);
        persistLocalDataset();
        renderHoses();
      });
      hoseCard.append(removeBtn);

      instrumentCard.append(hoseCard);
    });

    root.append(instrumentCard);
  });

  hosesPanel.replaceChildren(root);
}

function inputCell(target, key, onUpdate) {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.01";
  input.value = target[key] ?? "";
  input.addEventListener("change", () => {
    target[key] = input.value;
    onUpdate();
    persistLocalDataset();
    renderHoses();
  });
  td.append(input);
  return td;
}

function renderReportPlaceholder() {
  reportPanel.innerHTML = `
    <h2>Calibration Test Report</h2>
    <p>Report generation hooks for PHP services will go here (PDF, spreadsheet, email).</p>
  `;
}

function renderForm6Placeholder() {
  form6Panel.innerHTML = `
    <h2>NMI Form 6</h2>
    <p>Form 6 layout and print formatting can be implemented in the next phase.</p>
  `;
}

function renderAll() {
  renderTestDetails();
  renderMeasures();
  renderInstruments();
  renderHoses();
  renderReportPlaceholder();
  renderForm6Placeholder();
  if (!saveStatus.textContent.includes("Locally saved")) {
    persistLocalDataset();
  }
}

renderAll();
