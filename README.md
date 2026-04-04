# petrocal

Fuel dispenser calibration tool.

## Current prototype

This repository includes a vanilla JavaScript single-page prototype with:

- Landing page (`index.html`) to choose start mode
- Main app (`app.html`) focused on test workflow sections:
  - Test Details
  - Measures
  - Instruments
  - Hoses
- Separate pages for:
  - `report.html` (data output + print view)
  - `form6.html` (NMI Form 6 view + verification details table)

### Key behavior implemented

- **Start modes from `index.html`**:
  - `Start New Blank Test` opens `app.html?start=new`
  - `Load Existing Dataset` opens `app.html?start=load`
- **Load Dataset**: import a JSON file into app state.
- **Save Dataset**: download current app state as a JSON file.
- **New**: clears Petrocal local storage and resets UI state.
- **Local persistence**: edits auto-save into browser local storage.
- **Form 6 mapping**:
  - pulls verifier/site/instrument/hose values from the saved dataset
  - provides editable licence number, business name, and ABN fields
  - persists Form 6 fields back into the shared dataset (`form6Details`)


