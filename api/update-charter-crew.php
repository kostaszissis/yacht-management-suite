<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$dbname = 'yachtdb';
$username = 'yachtadmin';
$password = 'YachtDB2024!';

try {
    $dsn = "pgsql:host=$host;dbname=$dbname";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'DB connection failed']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $bookingNumber = $input['booking_number'] ?? $input['bookingNumber'] ?? '';
    $crewMembers = $input['crew_members'] ?? $input['crewMembers'] ?? [];
    $skipperLicense = $input['skipperLicense'] ?? '';
    $extraLicenses = $input['extraLicenses'] ?? [];
    $chartererData = $input['chartererData'] ?? null;

    if (empty($bookingNumber)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'booking_number is required']);
        exit();
    }

    try {
        $stmt = $pdo->prepare("SELECT booking_data FROM bookings WHERE booking_number = :bn");
        $stmt->execute(['bn' => $bookingNumber]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Booking not found']);
            exit();
        }

        $bookingData = json_decode($row['booking_data'], true) ?? [];

        if (!empty($crewMembers)) {
            $bookingData['crewMembers'] = $crewMembers;
        }
        if (!empty($skipperLicense)) {
            $bookingData['skipperLicense'] = $skipperLicense;
        }
        if (!empty($extraLicenses)) {
            $bookingData['extraLicenses'] = $extraLicenses;
        }
        // NEW: Save chartererData + sync top-level charterer fields for FleetManagement
        if (!empty($chartererData) && is_array($chartererData)) {
            $bookingData['chartererData'] = $chartererData;
            if (!empty($chartererData['firstName'])) $bookingData['chartererFirstName'] = $chartererData['firstName'];
            if (!empty($chartererData['lastName'])) $bookingData['chartererLastName'] = $chartererData['lastName'];
            if (!empty($chartererData['address'])) $bookingData['chartererAddress'] = $chartererData['address'];
            if (!empty($chartererData['tel'])) $bookingData['chartererPhone'] = $chartererData['tel'];
            if (!empty($chartererData['email'])) $bookingData['chartererEmail'] = $chartererData['email'];
            if (!empty($chartererData['idNumber'])) $bookingData['chartererIdNumber'] = $chartererData['idNumber'];
            if (!empty($chartererData['taxNumber'])) $bookingData['chartererTaxNumber'] = $chartererData['taxNumber'];
            if (!empty($chartererData['taxOffice'])) $bookingData['chartererTaxOffice'] = $chartererData['taxOffice'];
        }

        $updateStmt = $pdo->prepare("UPDATE bookings SET booking_data = :data WHERE booking_number = :bn");
        $updateStmt->execute([
            'data' => json_encode($bookingData),
            'bn' => $bookingNumber
        ]);

        echo json_encode(['success' => true, 'message' => 'Crew updated']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
