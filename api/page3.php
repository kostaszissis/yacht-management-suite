<?php
/**
 * PAGE 3 API - Equipment Checklist
 * Handles: safety equipment, navigation equipment, galley, deck, cabin items
 */

require_once __DIR__ . '/db_connect.php';

try {
    $pdo = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $input = getJsonInput();
    $bookingNumber = getBookingNumber($input);

    switch ($method) {
        case 'GET':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            $stmt = $pdo->prepare("
                SELECT * FROM page3_equipment
                WHERE booking_number = :bn
            ");
            $stmt->execute(['bn' => $bookingNumber]);
            $data = $stmt->fetch();

            if ($data) {
                // Parse JSON fields
                $result = convertKeysToCamel($data);
                $result['checklistData'] = json_decode($data['checklist_data'], true);
                $result['safetyEquipment'] = json_decode($data['safety_equipment'], true);
                $result['navigationEquipment'] = json_decode($data['navigation_equipment'], true);
                $result['galleyEquipment'] = json_decode($data['galley_equipment'], true);
                $result['deckEquipment'] = json_decode($data['deck_equipment'], true);
                $result['cabinEquipment'] = json_decode($data['cabin_equipment'], true);

                successResponse([
                    'equipmentData' => $result
                ]);
            } else {
                successResponse([
                    'equipmentData' => null,
                    'message' => 'No data found for this booking'
                ]);
            }
            break;

        case 'POST':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Ensure booking exists in main table
            ensureBookingExists($pdo, $bookingNumber);

            // Check if record already exists
            $checkStmt = $pdo->prepare("SELECT id FROM page3_equipment WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if ($checkStmt->fetch()) {
                errorResponse('Record already exists. Use PUT to update.', 409);
            }

            // Insert new record
            $stmt = $pdo->prepare("
                INSERT INTO page3_equipment (
                    booking_number,
                    checklist_data, safety_equipment, navigation_equipment,
                    galley_equipment, deck_equipment, cabin_equipment,
                    notes, checked_by, checked_at
                ) VALUES (
                    :booking_number,
                    :checklist_data, :safety_equipment, :navigation_equipment,
                    :galley_equipment, :deck_equipment, :cabin_equipment,
                    :notes, :checked_by, :checked_at
                )
            ");

            $stmt->execute([
                'booking_number' => $bookingNumber,
                'checklist_data' => json_encode($input['checklistData'] ?? $input['checklist_data'] ?? []),
                'safety_equipment' => json_encode($input['safetyEquipment'] ?? $input['safety_equipment'] ?? []),
                'navigation_equipment' => json_encode($input['navigationEquipment'] ?? $input['navigation_equipment'] ?? []),
                'galley_equipment' => json_encode($input['galleyEquipment'] ?? $input['galley_equipment'] ?? []),
                'deck_equipment' => json_encode($input['deckEquipment'] ?? $input['deck_equipment'] ?? []),
                'cabin_equipment' => json_encode($input['cabinEquipment'] ?? $input['cabin_equipment'] ?? []),
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

            // Check if record exists
            $checkStmt = $pdo->prepare("SELECT id FROM page3_equipment WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if (!$checkStmt->fetch()) {
                // Create new record if doesn't exist (upsert behavior)
                $stmt = $pdo->prepare("
                    INSERT INTO page3_equipment (
                        booking_number,
                        checklist_data, safety_equipment, navigation_equipment,
                        galley_equipment, deck_equipment, cabin_equipment,
                        notes, checked_by, checked_at
                    ) VALUES (
                        :booking_number,
                        :checklist_data, :safety_equipment, :navigation_equipment,
                        :galley_equipment, :deck_equipment, :cabin_equipment,
                        :notes, :checked_by, :checked_at
                    )
                ");
            } else {
                // Update existing record
                $stmt = $pdo->prepare("
                    UPDATE page3_equipment SET
                        checklist_data = COALESCE(:checklist_data, checklist_data),
                        safety_equipment = COALESCE(:safety_equipment, safety_equipment),
                        navigation_equipment = COALESCE(:navigation_equipment, navigation_equipment),
                        galley_equipment = COALESCE(:galley_equipment, galley_equipment),
                        deck_equipment = COALESCE(:deck_equipment, deck_equipment),
                        cabin_equipment = COALESCE(:cabin_equipment, cabin_equipment),
                        notes = COALESCE(:notes, notes),
                        checked_by = COALESCE(:checked_by, checked_by),
                        checked_at = COALESCE(:checked_at, checked_at)
                    WHERE booking_number = :booking_number
                ");
            }

            $stmt->execute([
                'booking_number' => $bookingNumber,
                'checklist_data' => isset($input['checklistData']) || isset($input['checklist_data'])
                    ? json_encode($input['checklistData'] ?? $input['checklist_data']) : null,
                'safety_equipment' => isset($input['safetyEquipment']) || isset($input['safety_equipment'])
                    ? json_encode($input['safetyEquipment'] ?? $input['safety_equipment']) : null,
                'navigation_equipment' => isset($input['navigationEquipment']) || isset($input['navigation_equipment'])
                    ? json_encode($input['navigationEquipment'] ?? $input['navigation_equipment']) : null,
                'galley_equipment' => isset($input['galleyEquipment']) || isset($input['galley_equipment'])
                    ? json_encode($input['galleyEquipment'] ?? $input['galley_equipment']) : null,
                'deck_equipment' => isset($input['deckEquipment']) || isset($input['deck_equipment'])
                    ? json_encode($input['deckEquipment'] ?? $input['deck_equipment']) : null,
                'cabin_equipment' => isset($input['cabinEquipment']) || isset($input['cabin_equipment'])
                    ? json_encode($input['cabinEquipment'] ?? $input['cabin_equipment']) : null,
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
