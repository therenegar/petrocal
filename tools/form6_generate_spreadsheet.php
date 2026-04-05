<?php

declare(strict_types=1);

const DEFAULT_ALLOWED_ORIGIN = '*';

function sendCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? DEFAULT_ALLOWED_ORIGIN;
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
}

function sendJsonError(string $message, int $status = 400): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

function loadComposerAutoload(): void
{
    $autoloadCandidates = [
        __DIR__ . '/vendor/autoload.php',
        dirname(__DIR__) . '/vendor/autoload.php',
    ];

    foreach ($autoloadCandidates as $autoloadFile) {
        if (is_file($autoloadFile)) {
            require_once $autoloadFile;
            return;
        }
    }
}

function parseRequestBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        sendJsonError('Request body is required.', 400);
    }

    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        sendJsonError('Invalid JSON payload.', 400);
    }

    return $payload;
}

function stringValue(mixed $value): string
{
    if ($value === null) {
        return '';
    }
    if (is_scalar($value)) {
        return trim((string) $value);
    }
    return '';
}

function normalizeLabel(string $value): string
{
    return strtolower(trim((string) preg_replace('/\s+/', ' ', $value)));
}

function getDatasetValue(array $dataset, array $path, string $fallback = ''): string
{
    $current = $dataset;
    foreach ($path as $key) {
        if (!is_array($current) || !array_key_exists($key, $current)) {
            return $fallback;
        }
        $current = $current[$key];
    }

    return stringValue($current);
}

function buildHoseRows(array $dataset): array
{
    $rows = [];
    $instruments = is_array($dataset['instruments'] ?? null) ? $dataset['instruments'] : [];

    foreach ($instruments as $instrument) {
        if (!is_array($instrument)) {
            continue;
        }

        $manufacturer = stringValue($instrument['manufacturer'] ?? '');
        $make = stringValue($instrument['make'] ?? '');
        $combinedMake = trim($manufacturer . ' ' . $make);

        $hoses = is_array($instrument['hoses'] ?? null) ? $instrument['hoses'] : [];
        foreach ($hoses as $hose) {
            if (!is_array($hose)) {
                continue;
            }

            $serialNumber = trim(implode('-', array_filter([
                stringValue($instrument['serialNumber'] ?? ''),
                stringValue($hose['hoseSerialSuffix'] ?? ''),
            ])));

            $rows[] = [
                'Location of instrument on site' => trim(implode(' / ', array_filter([
                    stringValue($hose['number'] ?? ''),
                    stringValue($hose['grade'] ?? ''),
                ]))),
                'Date of verification' => getDatasetValue($dataset, ['testDetails', 'date']),
                'Make' => $combinedMake,
                'Model' => stringValue($instrument['modelNumber'] ?? ''),
                'Serial Number' => $serialNumber,
                'NMI Pattern Approval Number' => stringValue($instrument['nmiPatternApproval'] ?? ''),
                'Capacity (L/min)' => stringValue($hose['qmax'] ?? ''),
                'Instrument Performance Code' => stringValue($hose['measureCheck']['performanceCode'] ?? ''),
            ];
        }
    }

    return $rows;
}

function findLabelCell($sheet, string $label): ?array
{
    $target = normalizeLabel($label);
    $highestRow = (int) $sheet->getHighestRow();
    $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());

    for ($row = 1; $row <= $highestRow; $row += 1) {
        for ($column = 1; $column <= $highestColumnIndex; $column += 1) {
            $cellValue = stringValue($sheet->getCellByColumnAndRow($column, $row)->getFormattedValue());
            if (normalizeLabel($cellValue) === $target) {
                return ['row' => $row, 'column' => $column];
            }
        }
    }

    return null;
}

function setValueNextToLabel($sheet, string $label, string $value): void
{
    $match = findLabelCell($sheet, $label);
    if ($match === null) {
        return;
    }

    $targetColumn = $match['column'] + 1;
    $targetRow = $match['row'];

    $sheet->setCellValueByColumnAndRow($targetColumn, $targetRow, $value);
}

function fillVerificationTable($sheet, array $rows): void
{
    $headers = [
        'Location of instrument on site',
        'Date of verification',
        'Make',
        'Model',
        'Serial Number',
        'NMI Pattern Approval Number',
        'Capacity (L/min)',
        'Instrument Performance Code',
    ];

    $headerPositions = [];
    foreach ($headers as $header) {
        $match = findLabelCell($sheet, $header);
        if ($match !== null) {
            $headerPositions[$header] = $match;
        }
    }

    if (count($headerPositions) < 2) {
        return;
    }

    $headerRow = min(array_map(static fn($entry) => (int) $entry['row'], $headerPositions));

    foreach ($rows as $index => $data) {
        $targetRow = $headerRow + 1 + $index;
        foreach ($headers as $header) {
            if (!isset($headerPositions[$header])) {
                continue;
            }
            $column = (int) $headerPositions[$header]['column'];
            $sheet->setCellValueByColumnAndRow($column, $targetRow, stringValue($data[$header] ?? ''));
        }
    }
}

function buildFilename(array $dataset): string
{
    $job = getDatasetValue($dataset, ['testDetails', 'jobNumber']);
    $site = getDatasetValue($dataset, ['testDetails', 'siteName']);
    $stamp = date('Y-m-d');

    $segments = array_filter(['form6', $job, $site, $stamp]);
    $stem = preg_replace('/[^A-Za-z0-9._-]+/', '-', implode('-', $segments)) ?? 'form6';
    $stem = trim($stem, '.-_');

    if ($stem === '') {
        $stem = 'form6';
    }

    return $stem . '.xls';
}

sendCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    sendJsonError('Only POST is supported.', 405);
}

$payload = parseRequestBody();
$dataset = is_array($payload['dataset'] ?? null) ? $payload['dataset'] : $payload;
if (!is_array($dataset)) {
    sendJsonError('dataset payload is required.', 400);
}

loadComposerAutoload();

if (!class_exists('PhpOffice\\PhpSpreadsheet\\IOFactory') || !class_exists('PhpOffice\\PhpSpreadsheet\\Writer\\Xls')) {
    sendJsonError('PhpSpreadsheet is required on the PHP host to generate Form 6 spreadsheets.', 501);
}

$templatePath = dirname(__DIR__) . '/ref/form-6-verification-notification-template.xls';
if (!is_file($templatePath)) {
    sendJsonError('Form 6 template file was not found on the server.', 500);
}

$spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($templatePath);
$sheet = $spreadsheet->getActiveSheet();

$fieldMap = [
    "Trader's name" => getDatasetValue($dataset, ['testDetails', 'operator']),
    'Business type' => 'Fuel Retail',
    'Street address' => getDatasetValue($dataset, ['testDetails', 'streetAddress']),
    'Suburb/locality' => getDatasetValue($dataset, ['testDetails', 'suburb']),
    'State' => getDatasetValue($dataset, ['testDetails', 'state']),
    'Postcode' => getDatasetValue($dataset, ['testDetails', 'postCode']),
    'Licence number' => getDatasetValue($dataset, ['form6Details', 'licenceNumber']),
    'Business name' => getDatasetValue($dataset, ['form6Details', 'businessName']),
    'ABN number' => getDatasetValue($dataset, ['form6Details', 'abnNumber']),
    'Registration number' => getDatasetValue($dataset, ['testDetails', 'registrationNumber']),
    'Name of Verifier' => getDatasetValue($dataset, ['testDetails', 'verifierName']),
    'Verifier Mark' => getDatasetValue($dataset, ['testDetails', 'verificationMark']),
];

foreach ($fieldMap as $label => $value) {
    setValueNextToLabel($sheet, $label, $value);
}

fillVerificationTable($sheet, buildHoseRows($dataset));

$writer = new \PhpOffice\PhpSpreadsheet\Writer\Xls($spreadsheet);
$filename = buildFilename($dataset);

header('Content-Type: application/vnd.ms-excel');
header("Content-Disposition: attachment; filename=\"{$filename}\"");
header('Cache-Control: max-age=0');
$writer->save('php://output');
exit;
