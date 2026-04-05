<?php

declare(strict_types=1);

const DEFAULT_ALLOWED_ORIGIN = "*";

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

function sanitizeFilename(?string $filename, string $extension): string
{
    $stem = trim((string) $filename);
    if ($stem === '') {
        $stem = 'test-report';
    }

    $stem = preg_replace('/[^A-Za-z0-9._-]+/', '-', $stem) ?? 'test-report';
    $stem = trim($stem, '.-_');
    if ($stem === '') {
        $stem = 'test-report';
    }

    return $stem . '.' . $extension;
}

function readRequestBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        sendJsonError('Request body is required.', 400);
    }

    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        sendJsonError('Invalid JSON payload.', 400);
    }

    return $payload;
}

function outputWordDocument(string $html, string $filename): void
{
    header('Content-Type: application/msword; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"{$filename}\"");
    echo $html;
    exit;
}

function outputExcelWorkbook(string $html, string $filename): void
{
    header('Content-Type: application/vnd.ms-excel; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"{$filename}\"");
    echo $html;
    exit;
}


function loadDompdfAutoloader(): void
{
    if (class_exists('Dompdf\Dompdf')) {
        return;
    }

    $autoloadCandidates = [
        __DIR__ . '/vendor/autoload.php',
        dirname(__DIR__) . '/vendor/autoload.php',
    ];

    foreach ($autoloadCandidates as $autoloadFile) {
        if (is_file($autoloadFile)) {
            require_once $autoloadFile;
            if (class_exists('Dompdf\Dompdf')) {
                return;
            }
        }
    }
}

function outputPdfDocument(string $html, string $filename): void
{
    loadDompdfAutoloader();

    if (!class_exists('Dompdf\\Dompdf')) {
        sendJsonError('PDF export requires Dompdf to be installed on the PHP host.', 501);
    }

    /** @var class-string $dompdfClass */
    $dompdfClass = 'Dompdf\\Dompdf';

    $dompdf = new $dompdfClass();
    $dompdf->loadHtml($html, 'UTF-8');
    $dompdf->setPaper('A4', 'portrait');
    $dompdf->render();

    header('Content-Type: application/pdf');
    header("Content-Disposition: attachment; filename=\"{$filename}\"");
    echo $dompdf->output();
    exit;
}

sendCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonError('Only POST is supported.', 405);
}

$format = strtolower(trim((string) ($_GET['format'] ?? '')));
if (!in_array($format, ['pdf', 'doc', 'xls'], true)) {
    sendJsonError('Format must be one of: pdf, doc, xls.', 400);
}

$payload = readRequestBody();
$html = trim((string) ($payload['html'] ?? ''));
if ($html === '') {
    sendJsonError('The html field is required.', 400);
}

$filenameStem = (string) ($payload['filename'] ?? 'test-report');

switch ($format) {
    case 'doc':
        outputWordDocument($html, sanitizeFilename($filenameStem, 'doc'));
        break;
    case 'xls':
        outputExcelWorkbook($html, sanitizeFilename($filenameStem, 'xls'));
        break;
    case 'pdf':
        outputPdfDocument($html, sanitizeFilename($filenameStem, 'pdf'));
        break;
}
