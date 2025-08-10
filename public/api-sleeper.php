<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the username from the request
$username = $_GET['username'] ?? $_POST['username'] ?? 'restocktime';
$action = $_GET['action'] ?? 'user';

// Sleeper API endpoints that work
$endpoints = [
    'user' => "https://api.sleeper.app/v1/user/$username",
    'leagues' => "https://api.sleeper.app/v1/user/{$username}/leagues/nfl/2024",
    'rosters' => "https://api.sleeper.app/v1/league/{$username}/rosters" // username becomes league_id for this
];

try {
    $url = $endpoints[$action] ?? $endpoints['user'];
    
    // Create context for the HTTP request
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'User-Agent: Mozilla/5.0 (compatible; Fantasy-Hub/1.0)',
                'Accept: application/json',
                'Content-Type: application/json'
            ],
            'timeout' => 30
        ]
    ]);
    
    // Fetch the data
    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new Exception('Failed to fetch data from Sleeper API');
    }
    
    // Return the JSON response
    echo $response;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'url_attempted' => $url ?? 'unknown',
        'timestamp' => date('c')
    ]);
}
?>