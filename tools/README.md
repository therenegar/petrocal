# Petrocal export tools

This folder contains PHP utilities that accept report JSON/HTML from the static app and return downloadable files.

## Endpoints

- `generate-pdf.php`
- `generate-word.php`
- `generate-excel.php`
- `export-report.php?format=pdf|doc|xls`

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
