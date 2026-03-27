<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$vessel = $_GET['vessel'] ?? '';
$dateFrom = $_GET['dateFrom'] ?? '';
$dateTo = $_GET['dateTo'] ?? '';

$where = "1=1";
$params = [];

if ($vessel) {
    $where .= " AND (booking_data->>'vesselName' = :vessel OR booking_data->>'boatName' = :vessel2)";
    $params['vessel'] = $vessel;
    $params['vessel2'] = $vessel;
}
if ($dateFrom) {
    $where .= " AND (booking_data->>'startDate' >= :dateFrom OR booking_data->>'checkInDate' >= :dateFrom2)";
    $params['dateFrom'] = $dateFrom;
    $params['dateFrom2'] = $dateFrom;
}
if ($dateTo) {
    $where .= " AND (booking_data->>'endDate' <= :dateTo OR booking_data->>'checkOutDate' <= :dateTo2)";
    $params['dateTo'] = $dateTo;
    $params['dateTo2'] = $dateTo;
}

$stmt = $pdo->prepare("SELECT booking_number, booking_data FROM bookings WHERE $where ORDER BY booking_number");
$stmt->execute($params);
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

$result = [];
foreach ($bookings as $row) {
    $data = json_decode($row['booking_data'], true);
    if (!$data) continue;
    
    $result[] = [
        'bookingNumber' => $row['booking_number'],
        'vesselName' => $data['vesselName'] ?? $data['boatName'] ?? '',
        'chartererName' => ($data['chartererFirstName'] ?? $data['skipperFirstName'] ?? '') . ' ' . ($data['chartererLastName'] ?? $data['skipperLastName'] ?? ''),
        'skipperName' => ($data['skipperFirstName'] ?? '') . ' ' . ($data['skipperLastName'] ?? ''),
        'startDate' => $data['startDate'] ?? $data['checkInDate'] ?? '',
        'endDate' => $data['endDate'] ?? $data['checkOutDate'] ?? '',
        'amount' => floatval($data['charterFee'] ?? $data['amount'] ?? 0),
        'commission' => floatval($data['commission'] ?? 0),
        'commissionAmount' => floatval($data['commissionAmount'] ?? 0),
        'payments' => $data['payments'] ?? [],
        'paymentStatus' => $data['paymentStatus'] ?? '',
        'broker' => $data['broker'] ?? '',
        'status' => $data['status'] ?? ''
    ];
}

echo json_encode([
    'success' => true,
    'data' => $result,
    'count' => count($result)
]);
?>
