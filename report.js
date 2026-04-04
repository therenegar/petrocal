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
  return renderKeyValueGrid(`Measure ${index + 1}`, [
    ["Type", measure.type],
    ["Sightglass", measure.sightglass],
    ["Serial number", measure.serialNumber],
    ["Volume (L)", measure.volume],
    ["Certificate number", measure.certificateNumber],
    ["Certificate expiry", measure.certificateExpiry]
  ]);
}

function renderHose(hose, index) {
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

  return section;
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
    instrument.hoses.forEach((hose, hoseIndex) => hosesWrapper.append(renderHose(hose, hoseIndex)));
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
    dataset.measures.forEach((measure, index) => measuresSection.append(renderMeasure(measure, index)));
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
