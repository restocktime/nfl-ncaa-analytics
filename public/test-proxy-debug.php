<?php
/**
 * Debug version of Hard Rock proxy for testing
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    'status' => 'PHP proxy is working',
    'php_version' => phpversion(),
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'query_params' => $_GET,
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'unknown',
        'SERVER_NAME' => $_SERVER['SERVER_NAME'] ?? 'unknown',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ],
    'curl_available' => function_exists('curl_init'),
    'file_get_contents_allowed' => ini_get('allow_url_fopen') ? 'yes' : 'no'
], JSON_PRETTY_PRINT);
?>