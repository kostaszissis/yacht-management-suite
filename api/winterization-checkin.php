<?php
/**
 * WINTERIZATION CHECKIN API
 * Handles: winterization checklist data per vessel
 *
 * Stores checklist sections, custom sections, and general notes
 * for each vessel's winterization process.
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create winterization_checkins table if it doesn't exist
function ensureWinterizationTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS winterization_checkins (
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
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_winterization_vessel_id ON winterization_checkins(vessel_id)");
}

try {
    $pdo = getDbConnection();
    ensureWinterizationTable($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $input = getJsonInput();

    // Get vessel_id from various sources
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
                // Get all winterization records
                $stmt = $pdo->query("SELECT * FROM winterization_checkins ORDER BY vessel_id");
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

                successResponse([
                    'data' => $result,
                    'count' => count($result)
                ]);
            } else {
                // Get single vessel's winterization data
                $stmt = $pdo->prepare("SELECT * FROM winterization_checkins WHERE vessel_id = :vessel_id");
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
                    // Return empty data structure (not an error)
                    successResponse([
                        'data' => null,
                        'message' => 'No winterization data found for this vessel'
                    ]);
                }
            }
            break;

        case 'POST':
            if (!$vesselId) {
                $vesselId = $input['vesselId'] ?? $input['vessel_id'] ?? null;
            }

            if (!$vesselId) {
                errorResponse('vessel_id is required', 400);
            }

            // Check if record exists
            $checkStmt = $pdo->prepare("SELECT id FROM winterization_checkins WHERE vessel_id = :vessel_id");
            $checkStmt->execute(['vessel_id' => $vesselId]);

            if ($checkStmt->fetch()) {
                // Update existing record
                $stmt = $pdo->prepare("
                    UPDATE winterization_checkins SET
                        vessel_name = :vessel_name,
                        sections = :sections,
                        custom_sections = :custom_sections,
                        general_notes = :general_notes,
                        last_saved = :last_saved,
                        updated_at = NOW()
                    WHERE vessel_id = :vessel_id
                ");

                $stmt->execute([
                    'vessel_id' => $vesselId,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'sections' => json_encode($input['sections'] ?? []),
                    'custom_sections' => json_encode($input['customSections'] ?? $input['custom_sections'] ?? []),
                    'general_notes' => $input['generalNotes'] ?? $input['general_notes'] ?? null,
                    'last_saved' => $input['lastSaved'] ?? $input['last_saved'] ?? date('c')
                ]);

                successResponse([
                    'vessel_id' => $vesselId
                ], 'Winterization data updated successfully');
            } else {
                // Insert new record
                $stmt = $pdo->prepare("
                    INSERT INTO winterization_checkins (
                        vessel_id, vessel_name, sections, custom_sections, general_notes, last_saved
                    ) VALUES (
                        :vessel_id, :vessel_name, :sections, :custom_sections, :general_notes, :last_saved
                    )
                ");

                $stmt->execute([
                    'vessel_id' => $vesselId,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'sections' => json_encode($input['sections'] ?? []),
                    'custom_sections' => json_encode($input['customSections'] ?? $input['custom_sections'] ?? []),
                    'general_notes' => $input['generalNotes'] ?? $input['general_notes'] ?? null,
                    'last_saved' => $input['lastSaved'] ?? $input['last_saved'] ?? date('c')
                ]);

                successResponse([
                    'vessel_id' => $vesselId,
                    'id' => $pdo->lastInsertId()
                ], 'Winterization data created successfully');
            }
            break;

        case 'PUT':
            if (!$vesselId) {
                $vesselId = $input['vesselId'] ?? $input['vessel_id'] ?? null;
            }

            if (!$vesselId) {
                errorResponse('vessel_id is required', 400);
            }

            // Upsert - same as POST
            $checkStmt = $pdo->prepare("SELECT id FROM winterization_checkins WHERE vessel_id = :vessel_id");
            $checkStmt->execute(['vessel_id' => $vesselId]);

            if ($checkStmt->fetch()) {
                // Update
                $stmt = $pdo->prepare("
                    UPDATE winterization_checkins SET
                        vessel_name = COALESCE(:vessel_name, vessel_name),
                        sections = COALESCE(:sections, sections),
                        custom_sections = COALESCE(:custom_sections, custom_sections),
                        general_notes = COALESCE(:general_notes, general_notes),
                        last_saved = :last_saved,
                        updated_at = NOW()
                    WHERE vessel_id = :vessel_id
                ");

                $customSections = $input['customSections'] ?? $input['custom_sections'] ?? null;
                $stmt->execute([
                    'vessel_id' => $vesselId,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'sections' => isset($input['sections']) ? json_encode($input['sections']) : null,
                    'custom_sections' => $customSections !== null ? json_encode($customSections) : null,
                    'general_notes' => $input['generalNotes'] ?? $input['general_notes'] ?? null,
                    'last_saved' => $input['lastSaved'] ?? $input['last_saved'] ?? date('c')
                ]);

                successResponse(['vessel_id' => $vesselId], 'Winterization data updated successfully');
            } else {
                // Insert
                $stmt = $pdo->prepare("
                    INSERT INTO winterization_checkins (
                        vessel_id, vessel_name, sections, custom_sections, general_notes, last_saved
                    ) VALUES (
                        :vessel_id, :vessel_name, :sections, :custom_sections, :general_notes, :last_saved
                    )
                ");

                $stmt->execute([
                    'vessel_id' => $vesselId,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'sections' => json_encode($input['sections'] ?? []),
                    'custom_sections' => json_encode($input['customSections'] ?? $input['custom_sections'] ?? []),
                    'general_notes' => $input['generalNotes'] ?? $input['general_notes'] ?? null,
                    'last_saved' => $input['lastSaved'] ?? $input['last_saved'] ?? date('c')
                ]);

                successResponse(['vessel_id' => $vesselId], 'Winterization data created successfully');
            }
            break;

        case 'DELETE':
            if (!$vesselId) {
                errorResponse('vessel_id is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM winterization_checkins WHERE vessel_id = :vessel_id");
            $stmt->execute(['vessel_id' => $vesselId]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Winterization data deleted successfully');
            } else {
                errorResponse('Winterization data not found', 404);
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
