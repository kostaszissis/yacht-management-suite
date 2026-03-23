<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_connect.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['vessel_name'])) {
            $vessel_name = $_GET['vessel_name'];
            $stmt = $pdo->prepare("SELECT id, vessel_name, document_type, document_name, expiry_date, file_name, notes FROM vessel_documents WHERE vessel_name = ? ORDER BY document_type");
            $stmt->execute([$vessel_name]);
            $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $documents], JSON_INVALID_UTF8_SUBSTITUTE);
        } else {
            $stmt = $pdo->query("SELECT id, vessel_name, document_type, document_name, expiry_date, file_name, notes FROM vessel_documents ORDER BY vessel_name, document_type");
            $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $documents], JSON_INVALID_UTF8_SUBSTITUTE);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $vessel_name = $data['vessel_name'] ?? '';
        $document_type = $data['document_type'] ?? '';
        $stmt = $pdo->prepare("SELECT id FROM vessel_documents WHERE vessel_name = ? AND document_type = ?");
        $stmt->execute([$vessel_name, $document_type]);
        $existing = $stmt->fetch();
        if ($existing) {
            $stmt = $pdo->prepare("UPDATE vessel_documents SET document_name = ?, expiry_date = ?, file_data = ?, file_name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE vessel_name = ? AND document_type = ?");
            $stmt->execute([$data['document_name'] ?? '', $data['expiry_date'] ?? null, $data['file_data'] ?? '', $data['file_name'] ?? '', $data['notes'] ?? '', $vessel_name, $document_type]);
            echo json_encode(['success' => true, 'message' => 'Updated']);
        } else {
            $stmt = $pdo->prepare("INSERT INTO vessel_documents (vessel_name, document_type, document_name, expiry_date, file_data, file_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$vessel_name, $document_type, $data['document_name'] ?? '', $data['expiry_date'] ?? null, $data['file_data'] ?? '', $data['file_name'] ?? '', $data['notes'] ?? '']);
            echo json_encode(['success' => true, 'message' => 'Created']);
        }
        break;

    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true); $id = $_GET['id'] ?? $input['document_id'] ?? $input['id'] ?? '';
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM vessel_documents WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Deleted']);
        } else {
            $vessel_name = $_GET['vessel_name'] ?? '';
            $document_type = $_GET['document_type'] ?? '';
            if ($document_type) {
                $stmt = $pdo->prepare("DELETE FROM vessel_documents WHERE vessel_name = ? AND vocument_type = ?");
                $stmt->execute([$vessel_name, $document_type]);
            }
            echo json_encode(['success' => true, 'message' => 'Deleted']);
        }
        break;
}
?>