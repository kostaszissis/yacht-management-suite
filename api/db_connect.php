<?php
/**
 * Database Connection Helper
 * Shared connection for all API endpoints
 */

// CORS headers for API access
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// PostgreSQL connection settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'yachtdb');
define('DB_USER', 'yachtadmin');
define('DB_PASS', 'YachtDB2024!');

/**
 * Get PDO database connection
 */
function getDbConnection() {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "pgsql:host=" . DB_HOST . ";dbname=" . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
    }

    return $pdo;
}

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Send error response
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * Send success response
 */
function successResponse($data, $message = null) {
    $response = ['success' => true];
    if ($message) {
        $response['message'] = $message;
    }
    if (is_array($data)) {
        $response = array_merge($response, $data);
    } else {
        $response['data'] = $data;
    }
    jsonResponse($response);
}

/**
 * Get JSON input from request body
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

/**
 * Get booking number from request (query, path, or body)
 */
function getBookingNumber($input = null) {
    // From query parameter
    if (isset($_GET['booking_number'])) {
        return $_GET['booking_number'];
    }

    // From URL path
    if (isset($_SERVER['PATH_INFO'])) {
        return urldecode(trim($_SERVER['PATH_INFO'], '/'));
    }

    // From request body
    if ($input) {
        return $input['bookingNumber'] ?? $input['booking_number'] ?? null;
    }

    return null;
}

/**
 * Ensure booking exists in main bookings table
 * Creates it if it doesn't exist
 */
function ensureBookingExists($pdo, $bookingNumber) {
    $stmt = $pdo->prepare("SELECT booking_number FROM bookings WHERE booking_number = :bn");
    $stmt->execute(['bn' => $bookingNumber]);

    if (!$stmt->fetch()) {
        // Create the booking
        $stmt = $pdo->prepare("INSERT INTO bookings (booking_number, booking_data) VALUES (:bn, :data)");
        $stmt->execute([
            'bn' => $bookingNumber,
            'data' => json_encode(['created_at' => date('c')])
        ]);
    }
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel($input) {
    return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $input))));
}

/**
 * Convert camelCase to snake_case
 */
function camelToSnake($input) {
    return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
}

/**
 * Convert array keys from snake_case to camelCase
 */
function convertKeysToCamel($array) {
    $result = [];
    foreach ($array as $key => $value) {
        $newKey = snakeToCamel($key);
        $result[$newKey] = is_array($value) ? convertKeysToCamel($value) : $value;
    }
    return $result;
}

/**
 * Convert array keys from camelCase to snake_case
 */
function convertKeysToSnake($array) {
    $result = [];
    foreach ($array as $key => $value) {
        $newKey = camelToSnake($key);
        $result[$newKey] = is_array($value) ? convertKeysToSnake($value) : $value;
    }
    return $result;
}
?>
