<?php
require 'vendor/autoload.php';

use Dompdf\Dompdf;

$dompdf = new Dompdf();
$dompdf->loadHtml('<h1>Hello World</h1>');

// Optional: set paper size
$dompdf->setPaper('A4', 'portrait');

$dompdf->render();
$dompdf->stream("output.pdf");