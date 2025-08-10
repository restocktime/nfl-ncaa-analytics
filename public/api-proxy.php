<?php
// Simple PHP proxy for fantasy sports APIs
// Bypasses CORS restrictions by making server-side requests

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the target API from query parameter
$api = $_GET['api'] ?? '';
$path = $_GET['path'] ?? '';

$apiUrls = [
    'sleeper' => 'https://api.sleeper.app/v1/',
    'espn' => 'https://site.api.espn.com/apis/site/v2/',
    'espn-fantasy' => 'https://lm-api-reads.fantasy.espn.com/apis/v3/'
];

if (!isset($apiUrls[$api])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid API specified']);
    exit();
}

$targetUrl = $apiUrls[$api] . $path;

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; Fantasy Hub Proxy)');

// Add headers for ESPN if needed
if ($api === 'espn' || $api === 'espn-fantasy') {
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json'
    ]);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Return the response
http_response_code($httpCode);
echo $response;
?>