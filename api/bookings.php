<?php
/**
 * Bookings API Endpoint
 * Returns all bookings from PostgreSQL database
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
$host = 'localhost';
$dbname = 'yachtdb';
$username = 'yachtadmin';
$password = 'YachtDB2024!';

try {
    // Connect to PostgreSQL
    $dsn = "pgsql:host=$host;dbname=$dbname";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Handle different HTTP methods
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Get single booking by booking_number if provided
            if (isset($_GET['booking_number'])) {
                $bookingNumber = $_GET['booking_number'];
                $stmt = $pdo->prepare("SELECT booking_number, booking_data FROM bookings WHERE booking_number = :booking_number");
                $stmt->execute(['booking_number' => $bookingNumber]);
                $booking = $stmt->fetch();

                if ($booking) {
                    // Decode booking_data if it's a JSON string
                    if (is_string($booking['booking_data'])) {
                        $booking['booking_data'] = json_decode($booking['booking_data'], true);
                    }
                    echo json_encode([
                        'success' => true,
                        'booking' => $booking
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Booking not found'
                    ]);
                }
            } else {
                // Get all bookings with optional filters
                $sql = "SELECT booking_number, booking_data FROM bookings";
                $params = [];
                $where = [];

                // Filter by vessel if provided
                if (isset($_GET['vessel']) && !empty($_GET['vessel'])) {
                    $where[] = "booking_data->>'vesselName' ILIKE :vessel";
                    $params['vessel'] = '%' . $_GET['vessel'] . '%';
                }

                // Filter by date range if provided
                if (isset($_GET['startDate']) && !empty($_GET['startDate'])) {
                    $where[] = "booking_data->>'startDate' >= :startDate";
                    $params['startDate'] = $_GET['startDate'];
                }

                if (isset($_GET['endDate']) && !empty($_GET['endDate'])) {
                    $where[] = "booking_data->>'endDate' <= :endDate";
                    $params['endDate'] = $_GET['endDate'];
                }

                if (!empty($where)) {
                    $sql .= " WHERE " . implode(' AND ', $where);
                }

                $sql .= " ORDER BY booking_number ASC";

                // Apply limit and offset if provided
                if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
                    $sql .= " LIMIT " . intval($_GET['limit']);
                }

                if (isset($_GET['offset']) && is_numeric($_GET['offset'])) {
                    $sql .= " OFFSET " . intval($_GET['offset']);
                }

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $bookings = $stmt->fetchAll();

                // Process bookings - decode JSON booking_data
                $result = [];
                foreach ($bookings as $booking) {
                    $bookingData = is_string($booking['booking_data'])
                        ? json_decode($booking['booking_data'], true)
                        : $booking['booking_data'];

                    $result[] = [
                        'bookingCode' => $booking['booking_number'],
                        'charterCode' => $booking['booking_number'],
                        'code' => $booking['booking_number'],
                        'id' => $booking['booking_number'],
                        ...(is_array($bookingData) ? $bookingData : [])
                    ];
                }

                echo json_encode([
                    'success' => true,
                    'bookings' => $result,
                    'count' => count($result)
                ]);
            }
            break;

        case 'POST':
            // Create new booking
            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['bookingNumber']) && !isset($input['booking_number'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'booking_number is required'
                ]);
                exit();
            }

            $bookingNumber = $input['bookingNumber'] ?? $input['booking_number'];
            $bookingData = $input['bookingData'] ?? $input['booking_data'] ?? $input;

            // Check if booking already exists
            $checkStmt = $pdo->prepare("SELECT booking_number FROM bookings WHERE booking_number = :booking_number");
            $checkStmt->execute(['booking_number' => $bookingNumber]);

            if ($checkStmt->fetch()) {
                http_response_code(409);
                echo json_encode([
                    'success' => false,
                    'error' => 'Booking already exists'
                ]);
                exit();
            }

            $stmt = $pdo->prepare("INSERT INTO bookings (booking_number, booking_data) VALUES (:booking_number, :booking_data)");
            $stmt->execute([
                'booking_number' => $bookingNumber,
                'booking_data' => json_encode($bookingData)
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Booking created successfully',
                'booking_number' => $bookingNumber
            ]);
            break;

        case 'PUT':
            // Update existing booking
            $input = json_decode(file_get_contents('php://input'), true);

            // Get booking number from URL path or query parameter
            $bookingNumber = $_GET['booking_number'] ?? null;

            // Try to extract from URL path (e.g., /api/bookings.php/CHARTER%20PARTY%20NO%204)
            if (!$bookingNumber && isset($_SERVER['PATH_INFO'])) {
                $bookingNumber = urldecode(trim($_SERVER['PATH_INFO'], '/'));
            }

            if (!$bookingNumber) {
                $bookingNumber = $input['bookingNumber'] ?? $input['booking_number'] ?? null;
            }

            if (!$bookingNumber) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'booking_number is required'
                ]);
                exit();
            }

            // Check if booking exists
            $checkStmt = $pdo->prepare("SELECT booking_data FROM bookings WHERE booking_number = :booking_number");
            $checkStmt->execute(['booking_number' => $bookingNumber]);
            $existing = $checkStmt->fetch();

            if (!$existing) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Booking not found'
                ]);
                exit();
            }

            // Merge with existing data
            $existingData = is_string($existing['booking_data'])
                ? json_decode($existing['booking_data'], true)
                : $existing['booking_data'];

            $newData = $input['bookingData'] ?? $input['booking_data'] ?? $input;
            $mergedData = array_merge($existingData ?? [], $newData);

            $stmt = $pdo->prepare("UPDATE bookings SET booking_data = :booking_data WHERE booking_number = :booking_number");
            $stmt->execute([
                'booking_number' => $bookingNumber,
                'booking_data' => json_encode($mergedData)
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Booking updated successfully',
                'booking_number' => $bookingNumber
            ]);
            break;

        case 'DELETE':
            // Delete booking
            $bookingNumber = $_GET['booking_number'] ?? null;

            if (!$bookingNumber && isset($_SERVER['PATH_INFO'])) {
                $bookingNumber = urldecode(trim($_SERVER['PATH_INFO'], '/'));
            }

            if (!$bookingNumber) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'booking_number is required'
                ]);
                exit();
            }

            $stmt = $pdo->prepare("DELETE FROM bookings WHERE booking_number = :booking_number");
            $stmt->execute(['booking_number' => $bookingNumber]);

            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Booking deleted successfully'
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Booking not found'
                ]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Method not allowed'
            ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
