<?php
/**
 * TASK CHECKINS API
 * Handles: task category checkin data per vessel and category
 *
 * Unlike other checkin APIs, this one stores data per vessel AND category
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create table if it doesn't exist
function ensureTaskCheckinsTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS task_checkins (
        id SERIAL PRIMARY KEY,
        vessel_id INTEGER NOT NULL,
        vessel_name VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        sections JSONB DEFAULT '{}',
        custom_sections JSONB DEFAULT '[]',
        general_notes TEXT,
        last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vessel_id, category)
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_task_checkins_vessel_id ON task_checkins(vessel_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_task_checkins_category ON task_checkins(category)");
}

try {
    $pdo = getDbConnection();
    ensureTaskCheckinsTable($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $input = getJsonInput();

    $vesselId = $_GET['vessel_id'] ?? $_GET['vesselId'] ?? null;
    $category = $_GET['category'] ?? null;

    if (!$vesselId && isset($_SERVER['PATH_INFO'])) {
        $vesselId = urldecode(trim($_SERVER['PATH_INFO'], '/'));
    }
    if (!$vesselId && $input) {
        $vesselId = $input['vesselId'] ?? $input['vessel_id'] ?? null;
    }
    if (!$category && $input) {
        $category = $input['category'] ?? null;
    }

    switch ($method) {
        case 'GET':
            if ($vesselId && $category) {
                // Get specific vessel + category data
                $stmt = $pdo->prepare("SELECT * FROM task_checkins WHERE vessel_id = :vessel_id AND category = :category");
                $stmt->execute(['vessel_id' => $vesselId, 'category' => $category]);
                $data = $stmt->fetch();

                if ($data) {
                    successResponse([
                        'data' => [
                            'vesselId' => (int)$data['vessel_id'],
                            'vesselName' => $data['vessel_name'],
                            'category' => $data['category'],
                            'sections' => json_decode($data['sections'], true) ?? [],
                            'customSections' => json_decode($data['custom_sections'], true) ?? [],
                            'generalNotes' => $data['general_notes'],
                            'lastSaved' => $data['last_saved']
                        ]
                    ]);
                } else {
                    successResponse(['data' => null, 'message' => 'No data found']);
                }
            } elseif ($vesselId) {
                // Get all categories for a vessel
                $stmt = $pdo->prepare("SELECT * FROM task_checkins WHERE vessel_id = :vessel_id ORDER BY category");
                $stmt->execute(['vessel_id' => $vesselId]);
                $records = $stmt->fetchAll();

                $result = array_map(function($row) {
                    return [
                        'vesselId' => (int)$row['vessel_id'],
                        'vesselName' => $row['vessel_name'],
                        'category' => $row['category'],
                        'sections' => json_decode($row['sections'], true) ?? [],
                        'customSections' => json_decode($row['custom_sections'], true) ?? [],
                        'generalNotes' => $row['general_notes'],
                        'lastSaved' => $row['last_saved']
                    ];
                }, $records);

                successResponse(['data' => $result, 'count' => count($result)]);
            } else {
                // Get all task checkins
                $stmt = $pdo->query("SELECT * FROM task_checkins ORDER BY vessel_id, category");
                $records = $stmt->fetchAll();

                $result = array_map(function($row) {
                    return [
                        'vesselId' => (int)$row['vessel_id'],
                        'vesselName' => $row['vessel_name'],
                        'category' => $row['category'],
                        'sections' => json_decode($row['sections'], true) ?? [],
                        'customSections' => json_decode($row['custom_sections'], true) ?? [],
                        'generalNotes' => $row['general_notes'],
                        'lastSaved' => $row['last_saved']
                    ];
                }, $records);

                successResponse(['data' => $result, 'count' => count($result)]);
            }
            break;

        case 'POST':
        case 'PUT':
            if (!$vesselId) {
                $vesselId = $input['vesselId'] ?? $input['vessel_id'] ?? null;
            }
            if (!$category) {
                $category = $input['category'] ?? null;
            }

            if (!$vesselId) {
                errorResponse('vessel_id is required', 400);
            }
            if (!$category) {
                errorResponse('category is required', 400);
            }

            $checkStmt = $pdo->prepare("SELECT id FROM task_checkins WHERE vessel_id = :vessel_id AND category = :category");
            $checkStmt->execute(['vessel_id' => $vesselId, 'category' => $category]);

            if ($checkStmt->fetch()) {
                $stmt = $pdo->prepare("
                    UPDATE task_checkins SET
                        vessel_name = COALESCE(:vessel_name, vessel_name),
                        sections = :sections,
                        custom_sections = :custom_sections,
                        general_notes = :general_notes,
                        last_saved = :last_saved,
                        updated_at = NOW()
                    WHERE vessel_id = :vessel_id AND category = :category
                ");
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO task_checkins (vessel_id, vessel_name, category, sections, custom_sections, general_notes, last_saved)
                    VALUES (:vessel_id, :vessel_name, :category, :sections, :custom_sections, :general_notes, :last_saved)
                ");
            }

            $stmt->execute([
                'vessel_id' => $vesselId,
                'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                'category' => $category,
                'sections' => json_encode($input['sections'] ?? []),
                'custom_sections' => json_encode($input['customSections'] ?? $input['custom_sections'] ?? []),
                'general_notes' => $input['generalNotes'] ?? $input['general_notes'] ?? null,
                'last_saved' => $input['lastSaved'] ?? $input['last_saved'] ?? date('c')
            ]);

            successResponse(['vessel_id' => $vesselId, 'category' => $category], 'Data saved successfully');
            break;

        case 'DELETE':
            if (!$vesselId) {
                errorResponse('vessel_id is required', 400);
            }

            if ($category) {
                // Delete specific category
                $stmt = $pdo->prepare("DELETE FROM task_checkins WHERE vessel_id = :vessel_id AND category = :category");
                $stmt->execute(['vessel_id' => $vesselId, 'category' => $category]);
            } else {
                // Delete all categories for vessel
                $stmt = $pdo->prepare("DELETE FROM task_checkins WHERE vessel_id = :vessel_id");
                $stmt->execute(['vessel_id' => $vesselId]);
            }

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
