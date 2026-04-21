<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

try {
    $pdo = new PDO("pgsql:host=localhost;dbname=yachtdb", "yachtadmin", "YachtDB2024!");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode(['error' => 'DB connection failed']); exit;
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $booking_number = $_GET['booking_number'] ?? '';
        $document_type = $_GET['document_type'] ?? '';
        
        if ($booking_number && $document_type) {
            $stmt = $pdo->prepare("SELECT id, booking_number, document_type, document_name, file_name, file_type, uploaded_by, created_at FROM charter_documents WHERE booking_number = ? AND document_type = ? ORDER BY created_at DESC");
            $stmt->execute([$booking_number, $document_type]);
        } else if ($booking_number) {
            $stmt = $pdo->prepare("SELECT id, booking_number, document_type, document_name, file_name, file_type, uploaded_by, created_at FROM charter_documents WHERE booking_number = ? ORDER BY document_type, created_at DESC");
            $stmt->execute([$booking_number]);
        } else {
            echo json_encode(['error' => 'Missing booking_number']); exit;
        }
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'upload';
        
        if ($action === 'download') {
            $id = $input['id'] ?? '';
            if (!$id) { echo json_encode(['error' => 'Missing id']); exit; }
            $stmt = $pdo->prepare("SELECT file_data, file_name, file_type FROM charter_documents WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                echo json_encode(['success' => true, 'file_data' => $row['file_data'], 'file_name' => $row['file_name'], 'file_type' => $row['file_type']]);
            } else {
                echo json_encode(['error' => 'Document not found']);
            }
            break;
        }
        
        $booking_number = $input['booking_number'] ?? '';
        $document_type = $input['document_type'] ?? '';
        $file_data = $input['file_data'] ?? '';
        $file_name = $input['file_name'] ?? '';
        $file_type = $input['file_type'] ?? '';
        $document_name = $input['document_name'] ?? $file_name;
        $uploaded_by = $input['uploaded_by'] ?? 'admin';
        
        if (!$booking_number || !$document_type || !$file_data) {
            echo json_encode(['error' => 'Missing required fields']); exit;
        }
        
        $stmt = $pdo->prepare("INSERT INTO charter_documents (booking_number, document_type, document_name, file_data, file_name, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$booking_number, $document_type, $document_name, $file_data, $file_name, $file_type, $uploaded_by]);
        
        echo json_encode(['success' => true, 'message' => 'Document uploaded', 'id' => $pdo->lastInsertId()]);
        break;

    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $input['id'] ?? '';
        
        if (!$id) { echo json_encode(['error' => 'Missing id']); exit; }
        
        $stmt = $pdo->prepare("DELETE FROM charter_documents WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Deleted']);
        break;
}
?>
