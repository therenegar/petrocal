const STORAGE_KEY = "petrocal.dataset.v2";
const REPORT_SESSION_KEY = "petrocal.report.dataset";

function loadDataset() {
  const raw =
    sessionStorage.getItem(REPORT_SESSION_KEY) ||
    localStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem("petrocal.dataset.v1");
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
    grid.append(dt, dd);
  });

  section.append(grid);
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
    ["Sightglass", measure.sightglass],
    ["Serial number", measure.serialNumber],
    ["Volume (L)", measure.volume],
    ["Certificate number", measure.certificateNumber],
    ["Certificate expiry", measure.certificateExpiry]
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text(value);
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

function measureVolumeLabel(measureId, dataset) {
  const measure = dataset?.measures?.[Number(measureId)];
  if (!measure) return text(measureId);
  return `${text(measure.volume)}L`;
}

function renderHose(hose, index, instrument, dataset) {
  const section = document.createElement("section");
  section.className = "report-subsection";
  const heading = document.createElement("h4");
  heading.textContent = `Hose ${index + 1}: ${text(hose.number, "No POS")} ${text(hose.grade, "")}`.trim();
  section.append(heading);

  const details = document.createElement("dl");
  details.className = "report-grid";
  const rows = [
    ["POS Number", hose.number],
    ["Grade", hose.grade],
    ["Hose serial suffix", hose.hoseSerialSuffix],
    ["Unit price", hose.unitPrice],
    ["Start tote", hose.startTote],
    ["End tote", hose.endTote],
    ["Qmin", hose.qmin],
    ["Qmax", hose.qmax],
    ["Maximum achievable rate", hose.maxRate],
    ["Performance code", hose.measureCheck?.performanceCode],
    ["Compliance overall", hose.compliance?.overall]
  ];

  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text(value);
    details.append(dt, dd);
  });
  section.append(details);

  const visibleSections = visibleHoseSections(hose.measureCheck?.performanceCode);

  if (visibleSections.includes("measureCheck")) {
    const measureCheckTitle = document.createElement("h5");
    measureCheckTitle.textContent = "Measure Check";
    section.append(measureCheckTitle, renderRunsTable(hose.measureCheck?.checks || [], "Check", false, dataset));
  }

  if (visibleSections.includes("verification")) {
    const verificationRows = [
      ...(hose.verification?.deliveries || []).map((row, idx) => ({ label: `Delivery #${idx + 1}`, ...row })),
      { label: "Preset Delivery", ...(hose.verification?.preset || {}) }
    ];
    if ((instrument?.type || "") === "Suction") {
      verificationRows.push({ label: "Gas Elimination Delivery", ...(hose.verification?.gasElimination || {}) });
    }

    const verificationTitle = document.createElement("h5");
    verificationTitle.textContent = "Verification";
    section.append(verificationTitle, renderRunsTable(verificationRows, null, true, dataset));

    const averageError = average([
      hose.verification?.deliveries?.[0]?.efd,
      hose.verification?.deliveries?.[1]?.efd,
      hose.verification?.deliveries?.[2]?.efd
    ]);
    const verificationMeta = document.createElement("dl");
    verificationMeta.className = "report-grid";
    [
      ["Average error (EAV)", averageError],
      ["Anti-drain fuel volume (mL)", hose.verification?.antiDrainMl]
    ].forEach(([label, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = text(value);
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
      ["Question 1", hose.compliance?.q1],
      ["Question 2", hose.compliance?.q2],
      ["Question 3", hose.compliance?.q3],
      ["Overall result", hose.compliance?.overall]
    ].forEach(([label, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = text(value);
      complianceGrid.append(dt, dd);
    });
    section.append(complianceTitle, complianceGrid);
  }

  return section;
}

function renderRunsTable(rows, rowPrefix = "Run", includeEd = false, dataset = null) {
  const table = document.createElement("table");
  table.className = "report-table";
  const header = document.createElement("thead");
  header.innerHTML = `<tr><th>${rowPrefix ? "" : "Run"}</th><th>Measure</th><th>VFD</th><th>VREF</th><th>EFD (%)</th>${includeEd ? "<th>ED (%)</th>" : ""}</tr>`;
  table.append(header);

  const body = document.createElement("tbody");
  rows.forEach((row, idx) => {
    const tr = document.createElement("tr");
    const label = rowPrefix ? `${rowPrefix} ${idx + 1}` : text(row.label, `Run ${idx + 1}`);
    tr.innerHTML = `<td>${label}</td><td>${measureVolumeLabel(row.measureId, dataset)}</td><td>${text(row.vfd)}</td><td>${text(row.vref)}</td><td>${text(row.efd)}</td>${includeEd ? `<td>${text(row.ed)}</td>` : ""}`;
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

function renderInstrument(instrument, index) {
  const section = document.createElement("section");
  section.className = "report-section";

  const heading = document.createElement("h2");
  heading.textContent = `Instrument ${index + 1}`;
  section.append(heading);

  const grid = document.createElement("dl");
  grid.className = "report-grid";
  const rows = [
    ["Numbering", instrument.numbering],
    ["Hose count", instrument.hoseCount],
    ["Manufacturer", instrument.manufacturer],
    ["Make", instrument.make],
    ["Model number", instrument.modelNumber],
    ["Serial number", instrument.serialNumber],
    ["Manufacture date", instrument.manufactureDate],
    ["NMI pattern approval", instrument.nmiPatternApproval],
    ["Products approved", instrument.productsApproved],
    ["Type", instrument.type],
    ["Inspection Q1", instrument.inspection?.q1],
    ["Inspection Q2", instrument.inspection?.q2],
    ["Inspection comments", instrument.inspection?.comments]
  ];

  rows.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = text(value);
    grid.append(dt, dd);
  });
  section.append(grid);

  const hosesWrapper = document.createElement("div");
  hosesWrapper.className = "report-hoses";
  const hoseTitle = document.createElement("h3");
  hoseTitle.textContent = "Hoses";
  hosesWrapper.append(hoseTitle);

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
    renderKeyValueGrid("Test Details", [
      ["Date", dataset.testDetails?.date],
      ["Job number", dataset.testDetails?.jobNumber],
      ["Type", dataset.testDetails?.type],
      ["Verifier's name", dataset.testDetails?.verifierName],
      ["Registration number", dataset.testDetails?.registrationNumber],
      ["Verification mark", dataset.testDetails?.verificationMark],
      ["Operator", dataset.testDetails?.operator],
      ["Maximum permissible error", dataset.testDetails?.mpe],
      ["Site name", dataset.testDetails?.siteName],
      ["Site number", dataset.testDetails?.siteNumber],
      ["Contact on site", dataset.testDetails?.contactOnSite],
      ["Address", dataset.testDetails?.address]
    ])
  );

  const measuresSection = document.createElement("section");
  measuresSection.className = "report-section";
  measuresSection.append(Object.assign(document.createElement("h2"), { textContent: "Measures" }));
  if (!dataset.measures?.length) {
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
  if (!dataset.instruments?.length) {
    instrumentsWrapper.append(Object.assign(document.createElement("p"), { textContent: "No instruments." }));
  } else {
    dataset.instruments.forEach((instrument, index) => instrumentsWrapper.append(renderInstrument(instrument, index)));
  }

  root.append(instrumentsWrapper);
}

renderReport();
