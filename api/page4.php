<?php
/**
 * PAGE 4 API - Vessel Inspection
 * Handles: hull/deck/interior conditions, engine hours, fuel/water/battery levels, damage reports, photos
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
                SELECT * FROM page4_inspection
                WHERE booking_number = :bn
            ");
            $stmt->execute(['bn' => $bookingNumber]);
            $data = $stmt->fetch();

            if ($data) {
                // Parse JSON fields
                $result = convertKeysToCamel($data);
                $result['damagesFound'] = json_decode($data['damages_found'], true);
                $result['photos'] = json_decode($data['photos'], true);
                $result['floorplanAnnotations'] = json_decode($data['floorplan_annotations'], true);

                successResponse([
                    'inspectionData' => $result
                ]);
            } else {
                successResponse([
                    'inspectionData' => null,
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
            $checkStmt = $pdo->prepare("SELECT id FROM page4_inspection WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if ($checkStmt->fetch()) {
                errorResponse('Record already exists. Use PUT to update.', 409);
            }

            // Insert new record
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

            // Check if record exists
            $checkStmt = $pdo->prepare("SELECT id FROM page4_inspection WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if (!$checkStmt->fetch()) {
                // Create new record if doesn't exist (upsert behavior)
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
            } else {
                // Update existing record
                $stmt = $pdo->prepare("
                    UPDATE page4_inspection SET
                        inspection_type = COALESCE(:inspection_type, inspection_type),
                        hull_condition = COALESCE(:hull_condition, hull_condition),
                        deck_condition = COALESCE(:deck_condition, deck_condition),
                        interior_condition = COALESCE(:interior_condition, interior_condition),
                        engine_hours = COALESCE(:engine_hours, engine_hours),
                        fuel_level = COALESCE(:fuel_level, fuel_level),
                        water_level = COALESCE(:water_level, water_level),
                        battery_level = COALESCE(:battery_level, battery_level),
                        damages_found = COALESCE(:damages_found, damages_found),
                        photos = COALESCE(:photos, photos),
                        floorplan_annotations = COALESCE(:floorplan_annotations, floorplan_annotations),
                        inspector_name = COALESCE(:inspector_name, inspector_name),
                        inspector_signature = COALESCE(:inspector_signature, inspector_signature),
                        inspection_date = COALESCE(:inspection_date, inspection_date),
                        notes = COALESCE(:notes, notes)
                    WHERE booking_number = :booking_number
                ");

                $stmt->execute([
                    'booking_number' => $bookingNumber,
                    'inspection_type' => $input['inspectionType'] ?? $input['inspection_type'] ?? null,
                    'hull_condition' => $input['hullCondition'] ?? $input['hull_condition'] ?? null,
                    'deck_condition' => $input['deckCondition'] ?? $input['deck_condition'] ?? null,
                    'interior_condition' => $input['interiorCondition'] ?? $input['interior_condition'] ?? null,
                    'engine_hours' => $input['engineHours'] ?? $input['engine_hours'] ?? null,
                    'fuel_level' => $input['fuelLevel'] ?? $input['fuel_level'] ?? null,
                    'water_level' => $input['waterLevel'] ?? $input['water_level'] ?? null,
                    'battery_level' => $input['batteryLevel'] ?? $input['battery_level'] ?? null,
                    'damages_found' => isset($input['damagesFound']) || isset($input['damages_found'])
                        ? json_encode($input['damagesFound'] ?? $input['damages_found']) : null,
                    'photos' => isset($input['photos']) ? json_encode($input['photos']) : null,
                    'floorplan_annotations' => isset($input['floorplanAnnotations']) || isset($input['floorplan_annotations'])
                        ? json_encode($input['floorplanAnnotations'] ?? $input['floorplan_annotations']) : null,
                    'inspector_name' => $input['inspectorName'] ?? $input['inspector_name'] ?? null,
                    'inspector_signature' => $input['inspectorSignature'] ?? $input['inspector_signature'] ?? null,
                    'inspection_date' => $input['inspectionDate'] ?? $input['inspection_date'] ?? null,
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
