# Petrocal export tools

This folder contains PHP utilities that accept report JSON/HTML from the static app and return downloadable files.

## Endpoints

- `generate-pdf.php`
- `generate-word.php`
- `generate-excel.php`
- `export-report.php?format=pdf|doc|xls`
- `form6_generate_spreadsheet.php`

## Request format

`POST` JSON:

```json
{
  "filename": "test-report-123",
  "html": "<!doctype html>..."
}
```

### Notes

- DOC and XLS outputs are HTML-based downloads with Microsoft-compatible content types.
- PDF output requires `Dompdf` to be available on the PHP host (`Dompdf\\Dompdf`).


## Form 6 spreadsheet

`form6_generate_spreadsheet.php` accepts `POST` JSON (`{ "dataset": ... }`) and fills the `ref/form-6-verification-notification-template.xls` workbook using matching labels and verification table headers.
