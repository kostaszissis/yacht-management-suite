<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = 'localhost';
$dbname = 'yachtdb';
$user = 'yachtadmin';
$password = 'YachtDB2024!';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

// GET: Load signatures
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $booking = $_GET['booking_number'] ?? '';
    $mode = $_GET['mode'] ?? '';
    
    if (!$booking || !$mode) {
        echo json_encode(['error' => 'booking_number and mode required']);
        exit;
    }
    
    $stmt = $pdo->prepare('SELECT skipper_signature, employee_signature, payment_auth_signature, employee_code, created_at, updated_at FROM page5_signatures WHERE booking_number = :bn AND mode = :mode');
    $stmt->execute([':bn' => $booking, ':mode' => $mode]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        echo json_encode(['success' => true, 'data' => $row]);
    } else {
        echo json_encode(['success' => true, 'data' => null]);
    }
    exit;
}

// POST: Save signatures
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $booking = $input['booking_number'] ?? '';
    $mode = $input['mode'] ?? '';
    
    if (!$booking || !$mode) {
        echo json_encode(['error' => 'booking_number and mode required']);
        exit;
    }
    
    $skipper = $input['skipper_signature'] ?? null;
    $employee = $input['employee_signature'] ?? null;
    $payment = $input['payment_auth_signature'] ?? null;
    $empCode = $input['employee_code'] ?? null;
    
    $stmt = $pdo->prepare('
        INSERT INTO page5_signatures (booking_number, mode, skipper_signature, employee_signature, payment_auth_signature, employee_code, created_at, updated_at)
        VALUES (:bn, :mode, :skipper, :employee, :payment, :empcode, NOW(), NOW())
        ON CONFLICT (booking_number, mode) 
        DO UPDATE SET 
            skipper_signature = COALESCE(:skipper2, page5_signatures.skipper_signature),
            employee_signature = COALESCE(:employee2, page5_signatures.employee_signature),
            payment_auth_signature = COALESCE(:payment2, page5_signatures.payment_auth_signature),
            employee_code = COALESCE(:empcode2, page5_signatures.employee_code),
            updated_at = NOW()
    ');
    
    $stmt->execute([
        ':bn' => $booking,
        ':mode' => $mode,
        ':skipper' => $skipper,
        ':employee' => $employee,
        ':payment' => $payment,
        ':empcode' => $empCode,
        ':skipper2' => $skipper,
        ':employee2' => $employee,
        ':payment2' => $payment,
        ':empcode2' => $empCode
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Signatures saved']);
    exit;
}

echo json_encode(['error' => 'Method not allowed']);
?>