# petrocal

Fuel dispenser calibration tool.

## Current prototype

This repository includes a vanilla JavaScript single-page prototype with:

- Landing page (`index.html`) to choose start mode
- Main app (`app.html`) with sections for:
  - Test Details
  - Measures
  - Instruments
  - Hoses
  - Report (placeholder)
  - Form 6 (placeholder)

### Key behavior implemented

- **Start modes from `index.html`**:
  - `Start New Blank Test` opens `app.html?start=new`
  - `Load Existing Dataset` opens `app.html?start=load`
- **Load Dataset**: import a JSON file into app state.
- **Save Dataset**: download current app state as a JSON file.
- **New**: clears Petrocal local storage and resets UI state.
- **Local persistence**: edits auto-save into browser local storage.

## Run locally

Because this is static front-end code, run any static server:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

or with PHP:

```bash
php -S localhost:8080
# open http://localhost:8080
```

## Next recommended phase

- Finalize field validation and formatting rules.
- Complete remaining Form 6 and Report rendering logic.
- Connect export buttons to PHP services for PDF/Excel/email.
