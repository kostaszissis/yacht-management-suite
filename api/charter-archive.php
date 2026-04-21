<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

try {
    $pdo = new PDO("pgsql:host=localhost;dbname=yachtdb", "yachtadmin", "YachtDB2024!");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS charter_archives (
        id SERIAL PRIMARY KEY,
        booking_number VARCHAR(255) UNIQUE NOT NULL,
        archive_data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )");
} catch (Exception $e) {
    echo json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]); exit;
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $booking_number = $_GET['booking_number'] ?? '';
        
        if ($booking_number) {
            $stmt = $pdo->prepare("SELECT booking_number, archive_data FROM charter_archives WHERE booking_number = ?");
            $stmt->execute([$booking_number]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $data = json_decode($row['archive_data'], true) ?: [];
                $data['booking_number'] = $row['booking_number'];
                echo json_encode(['success' => true, 'data' => $data]);
            } else {
                echo json_encode(['success' => true, 'data' => ['booking_number' => $booking_number, 'documents' => []]]);
            }
        } else {
            // Return all archives
            $stmt = $pdo->query("SELECT booking_number, archive_data FROM charter_archives ORDER BY updated_at DESC");
            $results = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $data = json_decode($row['archive_data'], true) ?: [];
                $data['booking_number'] = $row['booking_number'];
                $results[] = $data;
            }
            $keyed = [];
        foreach ($results as $r) {
            $bn = $r['booking_number'] ?? '';
            unset($r['booking_number']);
            $keyed[$bn] = $r;
        }
        echo json_encode(['success' => true, 'data' => $keyed]);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        $booking_number = $input['booking_number'] ?? '';
        $archive_data = $input['archive_data'] ?? [];
        
        if (!$booking_number) {
            echo json_encode(['error' => 'Missing booking_number']); exit;
        }
        
        // Merge with existing documents
        $existStmt = $pdo->prepare("SELECT archive_data FROM charter_archives WHERE booking_number = :bn");
        $existStmt->execute(['bn' => $booking_number]);
        $existRow = $existStmt->fetch();
        if ($existRow && $existRow['archive_data']) {
            $existing = json_decode($existRow['archive_data'], true) ?: [];
            $newData = $input['archive_data'] ?: [];
            $existDocs = $existing['documents'] ?? [];
            $newDocs = $newData['documents'] ?? [];
            // Manual deep merge: keep existing, overwrite with new
            foreach ($newDocs as $key => $val) {
                $existDocs[$key] = $val;
            }
            $newData['documents'] = $existDocs;

            // Preserve chartererData if not sent in this request
            if (isset($existing['chartererData']) && !isset($newData['chartererData'])) {
                $newData['chartererData'] = $existing['chartererData'];
            }

            // Preserve crewMembers if not sent in this request
            if (isset($existing['crewMembers']) && !isset($newData['crewMembers'])) {
                $newData['crewMembers'] = $existing['crewMembers'];
            }

            $input['archive_data'] = $newData;
        }
        $archive_json = json_encode($input["archive_data"], JSON_UNESCAPED_UNICODE);
        
        // Upsert
        $stmt = $pdo->prepare("INSERT INTO charter_archives (booking_number, archive_data, updated_at) 
            VALUES (?, ?::jsonb, NOW()) 
            ON CONFLICT (booking_number) 
            DO UPDATE SET archive_data = ?::jsonb, updated_at = NOW()");
        $stmt->execute([$booking_number, $archive_json, $archive_json]);
        
        echo json_encode(['success' => true, 'message' => 'Archive saved']);
        break;

    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        $booking_number = $_GET['booking_number'] ?? $input['booking_number'] ?? '';
        
        if (!$booking_number) {
            echo json_encode(['error' => 'Missing booking_number']); exit;
        }
        
        $stmt = $pdo->prepare("DELETE FROM charter_archives WHERE booking_number = ?");
        $stmt->execute([$booking_number]);
        echo json_encode(['success' => true, 'message' => 'Deleted']);
        break;
}
?>
