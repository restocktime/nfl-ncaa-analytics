<?php
/**
 * Hard Rock Bet CORS Proxy
 * Bypasses CORS restrictions to fetch Hard Rock Bet data
 */

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hard Rock Bet API endpoints
$hardRockEndpoints = [
    'events' => 'https://app.hardrock.bet/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events',
    'odds' => 'https://app.hardrock.bet/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events/{eventId}/markets',
    'live' => 'https://app.hardrock.bet/api/sportsbook/v3/sports/american_football/leagues/691198679103111169/events/live'
];

/**
 * Fetch data from Hard Rock Bet with proper headers
 */
function fetchHardRockData($url, $headers = []) {
    $defaultHeaders = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept: application/json, text/plain, */*',
        'Accept-Language: en-US,en;q=0.9',
        'Accept-Encoding: gzip, deflate, br',
        'Connection: keep-alive',
        'Sec-Fetch-Dest: empty',
        'Sec-Fetch-Mode: cors',
        'Sec-Fetch-Site: same-origin',
        'Origin: https://app.hardrock.bet',
        'Referer: https://app.hardrock.bet/sport-leagues/american_football/691198679103111169'
    ];
    
    $allHeaders = array_merge($defaultHeaders, $headers);
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => implode("\r\n", $allHeaders),
            'timeout' => 30,
            'ignore_errors' => true
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    
    $result = @file_get_contents($url, false, $context);
    
    if ($result === false) {
        return null;
    }
    
    return $result;
}

/**
 * Alternative cURL implementation for better control
 */
function fetchHardRockDataCurl($url) {
    $ch = curl_init();
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        CURLOPT_HTTPHEADER => [
            'Accept: application/json, text/plain, */*',
            'Accept-Language: en-US,en;q=0.9',
            'Accept-Encoding: gzip, deflate, br',
            'Connection: keep-alive',
            'Origin: https://app.hardrock.bet',
            'Referer: https://app.hardrock.bet/sport-leagues/american_football/691198679103111169',
            'Sec-Fetch-Dest: empty',
            'Sec-Fetch-Mode: cors',
            'Sec-Fetch-Site: same-origin'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    if ($error) {
        error_log("Hard Rock cURL Error: " . $error);
        return null;
    }
    
    if ($httpCode !== 200) {
        error_log("Hard Rock HTTP Error: " . $httpCode);
        return null;
    }
    
    return $response;
}

try {
    // Get request parameters
    $action = $_GET['action'] ?? 'events';
    $eventId = $_GET['eventId'] ?? null;
    
    // Determine the correct endpoint
    switch ($action) {
        case 'events':
            $url = $hardRockEndpoints['events'];
            break;
            
        case 'odds':
            if (!$eventId) {
                throw new Exception('Event ID required for odds endpoint');
            }
            $url = str_replace('{eventId}', $eventId, $hardRockEndpoints['odds']);
            break;
            
        case 'live':
            $url = $hardRockEndpoints['live'];
            break;
            
        default:
            throw new Exception('Invalid action. Use: events, odds, or live');
    }
    
    // Log the request
    error_log("Hard Rock Proxy Request: " . $url);
    
    // Try cURL first, then fallback to file_get_contents
    $data = fetchHardRockDataCurl($url);
    
    if ($data === null) {
        $data = fetchHardRockData($url);
    }
    
    if ($data === null) {
        throw new Exception('Failed to fetch data from Hard Rock Bet');
    }
    
    // Validate JSON
    $jsonData = json_decode($data, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON response from Hard Rock Bet');
    }
    
    // Add metadata
    $response = [
        'success' => true,
        'provider' => 'hardrock',
        'action' => $action,
        'timestamp' => time(),
        'data' => $jsonData
    ];
    
    // Cache headers for better performance
    header('Cache-Control: public, max-age=60'); // Cache for 1 minute
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 60) . ' GMT');
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    
    $errorResponse = [
        'success' => false,
        'error' => $e->getMessage(),
        'provider' => 'hardrock',
        'timestamp' => time()
    ];
    
    // Log error
    error_log("Hard Rock Proxy Error: " . $e->getMessage());
    
    echo json_encode($errorResponse, JSON_PRETTY_PRINT);
}
?>