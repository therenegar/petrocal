# petrocal

Fuel dispenser calibration tool.

## Current prototype

This repository now includes a vanilla JavaScript single-page app scaffold for:

- Test Details
- Measures
- Instruments
- Hoses
- Report (placeholder)
- Form 6 (placeholder)

### Key behavior implemented

- **Load Dataset**: import a JSON file into the app state.
- **Save Dataset**: download the current app state as a JSON file.
- **Local persistence**: every data change is auto-saved into browser local storage.
- **No database required**: all data remains in the browser and user-managed files.

## Run locally

Because this is a static front-end, you can run it with any static server.

Examples:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

or serve from PHP:

```bash
php -S localhost:8080
# then open http://localhost:8080
```

## Next recommended phase

- Finalize exact field validation rules from your data model.
- Implement full Verification section in Hoses (deliveries, averages, anti-drain).
- Implement Report and Form 6 full layouts + print stylesheet.
- Add API hooks to PHP endpoints for PDF/Excel/email generation.
