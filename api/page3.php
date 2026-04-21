<?php
/**
 * PAGE 3 API - Safety & Cabin Equipment Checklist
 * Handles: safety items, cabin items, optional items with checkbox states
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create page3_checklist table if it doesn't exist
function ensurePage3ChecklistTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS page3_checklist (
        id SERIAL PRIMARY KEY,
        booking_number VARCHAR(100) NOT NULL,
        mode VARCHAR(10) DEFAULT 'in',
        checklist_data TEXT,
        last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(booking_number, mode)
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_page3_checklist_bn ON page3_checklist(booking_number)");
}

try {
    $pdo = getDbConnection();
    ensurePage3ChecklistTable($pdo);

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
                SELECT checklist_data, mode, last_saved FROM page3_checklist
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
                // Fallback: try old page3_equipment table
                $stmt = $pdo->prepare("SELECT * FROM page3_equipment WHERE booking_number = :bn");
                $stmt->execute(['bn' => $bookingNumber]);
                $data = $stmt->fetch();

                if ($data) {
                    $result = convertKeysToCamel($data);
                    $result['checklistData'] = json_decode($data['checklist_data'], true);
                    successResponse(['equipmentData' => $result]);
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
                    INSERT INTO page3_checklist (booking_number, mode, checklist_data, last_saved)
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
                ], 'Page 3 checklist data saved successfully');
                break;
            }

            // Fallback: old format - save to page3_equipment table
            $checkStmt = $pdo->prepare("SELECT id FROM page3_equipment WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if ($checkStmt->fetch()) {
                errorResponse('Record already exists. Use PUT to update.', 409);
            }

            $stmt = $pdo->prepare("
                INSERT INTO page3_equipment (
                    booking_number, checklist_data, notes, checked_by, checked_at
                ) VALUES (
                    :booking_number, :checklist_data, :notes, :checked_by, :checked_at
                )
            ");

            $stmt->execute([
                'booking_number' => $bookingNumber,
                'checklist_data' => json_encode($input),
                'notes' => $input['notes'] ?? null,
                'checked_by' => $input['checkedBy'] ?? $input['checked_by'] ?? null,
                'checked_at' => $input['checkedAt'] ?? $input['checked_at'] ?? date('c')
            ]);

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 3 equipment data saved successfully');
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
                    INSERT INTO page3_checklist (booking_number, mode, checklist_data, last_saved)
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
                ], 'Page 3 checklist data updated successfully');
                break;
            }

            // Fallback: old format
            $checkStmt = $pdo->prepare("SELECT id FROM page3_equipment WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if (!$checkStmt->fetch()) {
                $stmt = $pdo->prepare("
                    INSERT INTO page3_equipment (booking_number, checklist_data, notes, checked_by, checked_at)
                    VALUES (:booking_number, :checklist_data, :notes, :checked_by, :checked_at)
                ");
            } else {
                $stmt = $pdo->prepare("
                    UPDATE page3_equipment SET
                        checklist_data = COALESCE(:checklist_data, checklist_data),
                        notes = COALESCE(:notes, notes),
                        checked_by = COALESCE(:checked_by, checked_by),
                        checked_at = COALESCE(:checked_at, checked_at)
                    WHERE booking_number = :booking_number
                ");
            }

            $stmt->execute([
                'booking_number' => $bookingNumber,
                'checklist_data' => json_encode($input),
                'notes' => $input['notes'] ?? null,
                'checked_by' => $input['checkedBy'] ?? $input['checked_by'] ?? null,
                'checked_at' => $input['checkedAt'] ?? $input['checked_at'] ?? null
            ]);

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 3 equipment data updated successfully');
            break;

        case 'DELETE':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM page3_equipment WHERE booking_number = :bn");
            $stmt->execute(['bn' => $bookingNumber]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Page 3 equipment data deleted successfully');
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
