<?php
/**
 * WINTER TAKEOVER API
 * Handles: winter takeover tracking data per vessel
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create table if it doesn't exist
function ensureWinterTakeoverTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS winter_takeover (
        id SERIAL PRIMARY KEY,
        vessel_id INTEGER NOT NULL,
        vessel_name VARCHAR(255),
        sections JSONB DEFAULT '{}',
        custom_sections JSONB DEFAULT '[]',
        general_notes TEXT,
        last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vessel_id)
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_winter_takeover_vessel_id ON winter_takeover(vessel_id)");
}

try {
    $pdo = getDbConnection();
    ensureWinterTakeoverTable($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $input = getJsonInput();

    $vesselId = $_GET['vessel_id'] ?? $_GET['vesselId'] ?? null;
    if (!$vesselId && isset($_SERVER['PATH_INFO'])) {
        $vesselId = urldecode(trim($_SERVER['PATH_INFO'], '/'));
    }
    if (!$vesselId && $input) {
        $vesselId = $input['vesselId'] ?? $input['vessel_id'] ?? null;
    }

    switch ($method) {
        case 'GET':
            if (!$vesselId) {
                $stmt = $pdo->query("SELECT * FROM winter_takeover ORDER BY vessel_id");
                $records = $stmt->fetchAll();

                $result = array_map(function($row) {
                    return [
                        'vesselId' => (int)$row['vessel_id'],
                        'vesselName' => $row['vessel_name'],
                        'sections' => json_decode($row['sections'], true) ?? [],
                        'customSections' => json_decode($row['custom_sections'], true) ?? [],
                        'generalNotes' => $row['general_notes'],
                        'lastSaved' => $row['last_saved']
                    ];
                }, $records);

                successResponse(['data' => $result, 'count' => count($result)]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM winter_takeover WHERE vessel_id = :vessel_id");
                $stmt->execute(['vessel_id' => $vesselId]);
                $data = $stmt->fetch();

                if ($data) {
                    successResponse([
                        'data' => [
                            'vesselId' => (int)$data['vessel_id'],
                            'vesselName' => $data['vessel_name'],
                            'sections' => json_decode($data['sections'], true) ?? [],
                            'customSections' => json_decode($data['custom_sections'], true) ?? [],
                            'generalNotes' => $data['general_notes'],
                            'lastSaved' => $data['last_saved']
                        ]
                    ]);
                } else {
                    successResponse(['data' => null, 'message' => 'No data found']);
                }
            }
            break;

        case 'POST':
        case 'PUT':
            if (!$vesselId) {
                $vesselId = $input['vesselId'] ?? $input['vessel_id'] ?? null;
            }

            if (!$vesselId) {
                errorResponse('vessel_id is required', 400);
            }

            $checkStmt = $pdo->prepare("SELECT id FROM winter_takeover WHERE vessel_id = :vessel_id");
            $checkStmt->execute(['vessel_id' => $vesselId]);

            if ($checkStmt->fetch()) {
                $stmt = $pdo->prepare("
                    UPDATE winter_takeover SET
                        vessel_name = COALESCE(:vessel_name, vessel_name),
                        sections = :sections,
                        custom_sections = :custom_sections,
                        general_notes = :general_notes,
                        last_saved = :last_saved,
                        updated_at = NOW()
                    WHERE vessel_id = :vessel_id
                ");
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO winter_takeover (vessel_id, vessel_name, sections, custom_sections, general_notes, last_saved)
                    VALUES (:vessel_id, :vessel_name, :sections, :custom_sections, :general_notes, :last_saved)
                ");
            }

            $stmt->execute([
                'vessel_id' => $vesselId,
                'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                'sections' => json_encode($input['sections'] ?? []),
                'custom_sections' => json_encode($input['customSections'] ?? $input['custom_sections'] ?? []),
                'general_notes' => $input['generalNotes'] ?? $input['general_notes'] ?? null,
                'last_saved' => $input['lastSaved'] ?? $input['last_saved'] ?? date('c')
            ]);

            successResponse(['vessel_id' => $vesselId], 'Data saved successfully');
            break;

        case 'DELETE':
            if (!$vesselId) {
                errorResponse('vessel_id is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM winter_takeover WHERE vessel_id = :vessel_id");
            $stmt->execute(['vessel_id' => $vesselId]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Data deleted successfully');
            } else {
                errorResponse('Data not found', 404);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }

} catch (PDOException $e) {
    errorResponse('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
?>
