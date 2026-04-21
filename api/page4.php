<?php
/**
 * PAGE 4 API - Vessel Floorplan & Inspection
 * Handles: floorplan hotspot items with checkbox states, photos, and inspection data
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create page4_checklist table if it doesn't exist
function ensurePage4ChecklistTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS page4_checklist (
        id SERIAL PRIMARY KEY,
        booking_number VARCHAR(100) NOT NULL,
        mode VARCHAR(10) DEFAULT 'in',
        checklist_data TEXT,
        last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(booking_number, mode)
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_page4_checklist_bn ON page4_checklist(booking_number)");
}

try {
    $pdo = getDbConnection();
    ensurePage4ChecklistTable($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $input = getJsonInput();
    $bookingNumber = getBookingNumber($input);

    switch ($method) {
        case 'GET':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Get mode from query parameter
            $mode = $_GET['mode'] ?? 'in';

            // Get checklist data from new table
            $checklistStmt = $pdo->prepare("
                SELECT checklist_data, mode, last_saved FROM page4_checklist
                WHERE booking_number = :bn AND mode = :mode
            ");
            $checklistStmt->execute(['bn' => $bookingNumber, 'mode' => $mode]);
            $checklistRow = $checklistStmt->fetch();

            if ($checklistRow && $checklistRow['checklist_data']) {
                successResponse([
                    'checklistData' => json_decode($checklistRow['checklist_data'], true),
                    'mode' => $checklistRow['mode'],
                    'lastSaved' => $checklistRow['last_saved']
                ]);
            } else {
                // Fallback: try old page4_inspection table
                $stmt = $pdo->prepare("SELECT * FROM page4_inspection WHERE booking_number = :bn");
                $stmt->execute(['bn' => $bookingNumber]);
                $data = $stmt->fetch();

                if ($data) {
                    $result = convertKeysToCamel($data);
                    $result['damagesFound'] = json_decode($data['damages_found'], true);
                    $result['photos'] = json_decode($data['photos'], true);
                    $result['floorplanAnnotations'] = json_decode($data['floorplan_annotations'], true);
                    successResponse(['inspectionData' => $result]);
                } else {
                    successResponse([
                        'checklistData' => null,
                        'message' => 'No data found for this booking'
                    ]);
                }
            }
            break;

        case 'POST':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Ensure booking exists in main table
            ensureBookingExists($pdo, $bookingNumber);

            // Check if this is the new checklistData format
            $checklistData = $input['checklistData'] ?? $input['checklist_data'] ?? null;
            $mode = $input['mode'] ?? 'in';

            if ($checklistData) {
                // Save to new checklist table with upsert
                $stmt = $pdo->prepare("
                    INSERT INTO page4_checklist (booking_number, mode, checklist_data, last_saved)
                    VALUES (:bn, :mode, :data, NOW())
                    ON CONFLICT (booking_number, mode)
                    DO UPDATE SET checklist_data = :data, last_saved = NOW()
                ");
                $stmt->execute([
                    'bn' => $bookingNumber,
                    'mode' => $mode,
                    'data' => json_encode($checklistData)
                ]);

                successResponse([
                    'booking_number' => $bookingNumber,
                    'mode' => $mode
                ], 'Page 4 checklist data saved successfully');
                break;
            }

            // Fallback: old format - save to page4_inspection table
            $checkStmt = $pdo->prepare("SELECT id FROM page4_inspection WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if ($checkStmt->fetch()) {
                errorResponse('Record already exists. Use PUT to update.', 409);
            }

            $stmt = $pdo->prepare("
                INSERT INTO page4_inspection (
                    booking_number, inspection_type,
                    hull_condition, deck_condition, interior_condition,
                    engine_hours, fuel_level, water_level, battery_level,
                    damages_found, photos, floorplan_annotations,
                    inspector_name, inspector_signature, inspection_date, notes
                ) VALUES (
                    :booking_number, :inspection_type,
                    :hull_condition, :deck_condition, :interior_condition,
                    :engine_hours, :fuel_level, :water_level, :battery_level,
                    :damages_found, :photos, :floorplan_annotations,
                    :inspector_name, :inspector_signature, :inspection_date, :notes
                )
            ");

            $stmt->execute([
                'booking_number' => $bookingNumber,
                'inspection_type' => $input['inspectionType'] ?? $input['inspection_type'] ?? 'check_in',
                'hull_condition' => $input['hullCondition'] ?? $input['hull_condition'] ?? null,
                'deck_condition' => $input['deckCondition'] ?? $input['deck_condition'] ?? null,
                'interior_condition' => $input['interiorCondition'] ?? $input['interior_condition'] ?? null,
                'engine_hours' => $input['engineHours'] ?? $input['engine_hours'] ?? null,
                'fuel_level' => $input['fuelLevel'] ?? $input['fuel_level'] ?? null,
                'water_level' => $input['waterLevel'] ?? $input['water_level'] ?? null,
                'battery_level' => $input['batteryLevel'] ?? $input['battery_level'] ?? null,
                'damages_found' => json_encode($input['damagesFound'] ?? $input['damages_found'] ?? []),
                'photos' => json_encode($input['photos'] ?? []),
                'floorplan_annotations' => json_encode($input['floorplanAnnotations'] ?? $input['floorplan_annotations'] ?? []),
                'inspector_name' => $input['inspectorName'] ?? $input['inspector_name'] ?? null,
                'inspector_signature' => $input['inspectorSignature'] ?? $input['inspector_signature'] ?? null,
                'inspection_date' => $input['inspectionDate'] ?? $input['inspection_date'] ?? date('c'),
                'notes' => $input['notes'] ?? null
            ]);

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 4 inspection data saved successfully');
            break;

        case 'PUT':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Ensure booking exists
            ensureBookingExists($pdo, $bookingNumber);

            // Check if this is the new checklistData format
            $checklistData = $input['checklistData'] ?? $input['checklist_data'] ?? null;
            $mode = $input['mode'] ?? 'in';

            if ($checklistData) {
                // Save to new checklist table with upsert
                $stmt = $pdo->prepare("
                    INSERT INTO page4_checklist (booking_number, mode, checklist_data, last_saved)
                    VALUES (:bn, :mode, :data, NOW())
                    ON CONFLICT (booking_number, mode)
                    DO UPDATE SET checklist_data = :data, last_saved = NOW()
                ");
                $stmt->execute([
                    'bn' => $bookingNumber,
                    'mode' => $mode,
                    'data' => json_encode($checklistData)
                ]);

                successResponse([
                    'booking_number' => $bookingNumber,
                    'mode' => $mode
                ], 'Page 4 checklist data updated successfully');
                break;
            }

            // Fallback: old format - page4_inspection table
            $checkStmt = $pdo->prepare("SELECT id FROM page4_inspection WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if (!$checkStmt->fetch()) {
                $stmt = $pdo->prepare("
                    INSERT INTO page4_inspection (
                        booking_number, inspection_type,
                        damages_found, photos, floorplan_annotations, notes
                    ) VALUES (
                        :booking_number, :inspection_type,
                        :damages_found, :photos, :floorplan_annotations, :notes
                    )
                ");
                $stmt->execute([
                    'booking_number' => $bookingNumber,
                    'inspection_type' => $input['inspectionType'] ?? 'check_in',
                    'damages_found' => json_encode($input['damagesFound'] ?? []),
                    'photos' => json_encode($input['photos'] ?? []),
                    'floorplan_annotations' => json_encode($input['floorplanAnnotations'] ?? []),
                    'notes' => $input['notes'] ?? null
                ]);
            } else {
                $stmt = $pdo->prepare("
                    UPDATE page4_inspection SET
                        damages_found = COALESCE(:damages_found, damages_found),
                        photos = COALESCE(:photos, photos),
                        floorplan_annotations = COALESCE(:floorplan_annotations, floorplan_annotations),
                        notes = COALESCE(:notes, notes)
                    WHERE booking_number = :booking_number
                ");
                $stmt->execute([
                    'booking_number' => $bookingNumber,
                    'damages_found' => isset($input['damagesFound']) ? json_encode($input['damagesFound']) : null,
                    'photos' => isset($input['photos']) ? json_encode($input['photos']) : null,
                    'floorplan_annotations' => isset($input['floorplanAnnotations']) ? json_encode($input['floorplanAnnotations']) : null,
                    'notes' => $input['notes'] ?? null
                ]);
            }

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 4 inspection data updated successfully');
            break;

        case 'DELETE':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM page4_inspection WHERE booking_number = :bn");
            $stmt->execute(['bn' => $bookingNumber]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Page 4 inspection data deleted successfully');
            } else {
                errorResponse('Record not found', 404);
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
