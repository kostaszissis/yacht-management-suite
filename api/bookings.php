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

    // Action-based endpoints (sync + fuzzy search) — added in GROUP B
    if (isset($_GET['action'])) {
        $__action = $_GET['action'];

        if ($method === 'GET' && $__action === 'search_by_code') {
            $__code = preg_replace('/[^0-9]/', '', $_GET['code'] ?? '');
            if (empty($__code)) { echo json_encode(['success' => true, 'booking' => null]); exit(); }
            $__stmt = $pdo->prepare("SELECT booking_number, booking_data FROM bookings WHERE regexp_replace(booking_number, '[^0-9]', '', 'g') = :code LIMIT 1");
            $__stmt->execute([':code' => $__code]);
            $__row = $__stmt->fetch();
            if ($__row) {
                if (is_string($__row['booking_data'])) {
                    $__row['booking_data'] = json_decode($__row['booking_data'], true);
                }
                echo json_encode(['success' => true, 'booking' => $__row]);
            } else {
                echo json_encode(['success' => true, 'booking' => null]);
            }
            exit();
        }

        if ($method === 'GET' && $__action === 'sync_load') {
            $__code = $_GET['code'] ?? '';
            if (empty($__code)) { echo json_encode(null); exit(); }
            $__stmt = $pdo->prepare("SELECT booking_data FROM bookings WHERE booking_number = :code LIMIT 1");
            $__stmt->execute([':code' => $__code]);
            $__row = $__stmt->fetch();
            if ($__row) {
                $__bd = is_string($__row['booking_data']) ? json_decode($__row['booking_data'], true) : $__row['booking_data'];
                echo json_encode($__bd['_sync'] ?? null);
            } else {
                echo json_encode(null);
            }
            exit();
        }

        if ($method === 'POST' && $__action === 'sync_save') {
            $__input = json_decode(file_get_contents('php://input'), true);
            $__code = $__input['code'] ?? '';
            $__syncData = $__input['sync_data'] ?? null;
            if (empty($__code) || !$__syncData) { echo json_encode(['success' => false, 'error' => 'missing']); exit(); }
            $__stmt = $pdo->prepare("UPDATE bookings SET booking_data = jsonb_set(COALESCE(booking_data, '{}'::jsonb), '{_sync}', :sync_data::jsonb) WHERE booking_number = :code");
            $__stmt->execute([':code' => $__code, ':sync_data' => json_encode($__syncData)]);
            echo json_encode(['success' => true, 'rows' => $__stmt->rowCount()]);
            exit();
        }

        if ($method === 'DELETE' && $__action === 'sync_clear') {
            $__code = $_GET['code'] ?? '';
            if (empty($__code)) { echo json_encode(['success' => false]); exit(); }
            $__stmt = $pdo->prepare("UPDATE bookings SET booking_data = booking_data - '_sync' WHERE booking_number = :code");
            $__stmt->execute([':code' => $__code]);
            echo json_encode(['success' => true]);
            exit();
        }
    }

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

                    $result[] = array_merge([
                        'bookingCode' => $booking['booking_number'],
                        'charterCode' => $booking['booking_number'],
                        'code' => $booking['booking_number'],
                        'id' => $booking['booking_number'],
                    ], is_array($bookingData) ? $bookingData : []);
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

            // Check if booking number already exists (number-only comparison)
            $numOnly = preg_replace('/[^0-9]/', '', $bookingNumber);
            if ($numOnly) {
                // Fuzzy: same numeric code = same booking. Use canonical existing name, update in place.
                $checkStmt = $pdo->prepare("SELECT booking_number FROM bookings WHERE regexp_replace(booking_number, '[^0-9]', '', 'g') = :num_only LIMIT 1");
                $checkStmt->execute([':num_only' => $numOnly]);
                $existingRow = $checkStmt->fetch();
                if ($existingRow && $existingRow['booking_number'] !== $bookingNumber) {
                    $bookingNumber = $existingRow['booking_number'];
                }
            }

            $vesselName = $bookingData['vesselName'] ?? '';
            $startDate = $bookingData['startDate'] ?? '';
            $endDate = $bookingData['endDate'] ?? '';

            if (!empty($vesselName) && !empty($startDate) && !empty($endDate)) {
                $overlapStmt = $pdo->prepare("
                    SELECT booking_number
                    FROM bookings
                    WHERE booking_data->>'vesselName' = :vesselName
                    AND (
                        (booking_data->>'startDate' < :endDate AND booking_data->>'endDate' > :startDate)
                AND LOWER(booking_number) != LOWER(:exact_bn)
                    )
                ");
                $overlapStmt->execute([
                    'vesselName' => $vesselName,
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                'exact_bn' => $bookingNumber
                ]);

                $existingBooking = $overlapStmt->fetch();
                if ($existingBooking) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Overlap: Υπάρχει ήδη ναύλο για ' . $vesselName . ' στις ' . $startDate . ' - ' . $endDate . ' (' . $existingBooking['booking_number'] . ')'
                    ]);
                    exit();
                }
            }

            $stmt = $pdo->prepare("INSERT INTO bookings (booking_number, booking_data) VALUES (:booking_number, :booking_data) ON CONFLICT (booking_number) DO UPDATE SET booking_data = EXCLUDED.booking_data");
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

            // 🔥 FIX: Atomic rename when new_booking_number is provided
            $newBookingNumber = $input['new_booking_number'] ?? null;
            if ($newBookingNumber && $newBookingNumber !== $bookingNumber) {
                try {
                    $pdo->beginTransaction();


                    // Update page1_booking_details first (foreign key dependency)
                    $stmtPage1 = $pdo->prepare("UPDATE page1_booking_details SET booking_number = :new_bn WHERE booking_number = :old_bn");
                    $stmtPage1->execute(['new_bn' => $newBookingNumber, 'old_bn' => $bookingNumber]);

                    // Update bookings table with new booking_number AND new data
                    $stmtBooking = $pdo->prepare("UPDATE bookings SET booking_number = :new_bn, booking_data = :booking_data WHERE booking_number = :old_bn");
                    $stmtBooking->execute([
                        'new_bn' => $newBookingNumber,
                        'old_bn' => $bookingNumber,
                        'booking_data' => json_encode($mergedData)
                    ]);


                $pdo->commit();

                    echo json_encode([
                        'success' => true,
                        'message' => 'Booking renamed and updated successfully',
                        'booking_number' => $newBookingNumber,
                        'old_booking_number' => $bookingNumber
                    ]);
                } catch (Exception $e) {
                    $pdo->rollBack();
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Failed to rename booking: ' . $e->getMessage()
                    ]);
                }
            } else {
                // Normal update (no rename)
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
            }
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

            // Delete page1 records first (foreign key)
            $stmt1 = $pdo->prepare("DELETE FROM page1_booking_details WHERE booking_number = :booking_number");
            $stmt1->execute(['booking_number' => $bookingNumber]);
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
