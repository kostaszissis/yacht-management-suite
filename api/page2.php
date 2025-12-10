<?php
/**
 * PAGE 2 API - Equipment Inventory & Crew List
 * Handles: equipment checklist items, hull items, dinghy items, AND crew members
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create page2_checklist table if it doesn't exist
function ensurePage2ChecklistTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS page2_checklist (
        id SERIAL PRIMARY KEY,
        booking_number VARCHAR(100) NOT NULL,
        mode VARCHAR(10) DEFAULT 'in',
        checklist_data TEXT,
        last_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(booking_number, mode)
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_page2_checklist_bn ON page2_checklist(booking_number)");
}

try {
    $pdo = getDbConnection();
    ensurePage2ChecklistTable($pdo);

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

            // Get checklist data
            $checklistStmt = $pdo->prepare("
                SELECT checklist_data, mode, last_saved FROM page2_checklist
                WHERE booking_number = :bn AND mode = :mode
            ");
            $checklistStmt->execute(['bn' => $bookingNumber, 'mode' => $mode]);
            $checklistRow = $checklistStmt->fetch();

            // Also get crew list for backward compatibility
            $crewStmt = $pdo->prepare("
                SELECT * FROM page2_crew
                WHERE booking_number = :bn
                ORDER BY crew_index ASC
            ");
            $crewStmt->execute(['bn' => $bookingNumber]);
            $crew = $crewStmt->fetchAll();

            $crewList = array_map(function($member) {
                return convertKeysToCamel($member);
            }, $crew);

            $response = [
                'crewList' => $crewList,
                'count' => count($crewList)
            ];

            // Add checklist data if exists
            if ($checklistRow && $checklistRow['checklist_data']) {
                $response['checklistData'] = json_decode($checklistRow['checklist_data'], true);
                $response['mode'] = $checklistRow['mode'];
                $response['lastSaved'] = $checklistRow['last_saved'];
            }

            successResponse($response);
            break;

        case 'POST':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Ensure booking exists in main table
            ensureBookingExists($pdo, $bookingNumber);

            // Check if this is checklist data (items, hullItems, etc.)
            $checklistData = $input['checklistData'] ?? $input['checklist_data'] ?? null;
            $mode = $input['mode'] ?? 'in';

            if ($checklistData) {
                // Save checklist data (equipment inventory)
                $stmt = $pdo->prepare("
                    INSERT INTO page2_checklist (booking_number, mode, checklist_data, last_saved)
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
                ], 'Page 2 checklist data saved successfully');
                break;
            }

            // Otherwise handle crew list (backward compatibility)
            $crewList = $input['crewList'] ?? $input['crew_list'] ?? $input['crew'] ?? [];

            if (empty($crewList)) {
                errorResponse('checklistData or crewList is required', 400);
            }

            // Delete existing crew for this booking (replace all)
            $deleteStmt = $pdo->prepare("DELETE FROM page2_crew WHERE booking_number = :bn");
            $deleteStmt->execute(['bn' => $bookingNumber]);

            // Insert new crew members
            $insertStmt = $pdo->prepare("
                INSERT INTO page2_crew (
                    booking_number, crew_index,
                    first_name, last_name, nationality,
                    passport_number, date_of_birth, place_of_birth, role
                ) VALUES (
                    :booking_number, :crew_index,
                    :first_name, :last_name, :nationality,
                    :passport_number, :date_of_birth, :place_of_birth, :role
                )
            ");

            $insertedCount = 0;
            foreach ($crewList as $index => $member) {
                $insertStmt->execute([
                    'booking_number' => $bookingNumber,
                    'crew_index' => $index + 1,
                    'first_name' => $member['firstName'] ?? $member['first_name'] ?? null,
                    'last_name' => $member['lastName'] ?? $member['last_name'] ?? null,
                    'nationality' => $member['nationality'] ?? null,
                    'passport_number' => $member['passportNumber'] ?? $member['passport_number'] ?? null,
                    'date_of_birth' => $member['dateOfBirth'] ?? $member['date_of_birth'] ?? null,
                    'place_of_birth' => $member['placeOfBirth'] ?? $member['place_of_birth'] ?? null,
                    'role' => $member['role'] ?? 'passenger'
                ]);
                $insertedCount++;
            }

            successResponse([
                'booking_number' => $bookingNumber,
                'inserted_count' => $insertedCount
            ], 'Page 2 crew data saved successfully');
            break;

        case 'PUT':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Ensure booking exists
            ensureBookingExists($pdo, $bookingNumber);

            // Check if this is checklist data update
            $checklistData = $input['checklistData'] ?? $input['checklist_data'] ?? null;
            $mode = $input['mode'] ?? 'in';

            if ($checklistData) {
                // Update checklist data
                $stmt = $pdo->prepare("
                    INSERT INTO page2_checklist (booking_number, mode, checklist_data, last_saved)
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
                ], 'Page 2 checklist data updated successfully');
                break;
            }

            // Otherwise handle crew list update
            $crewList = $input['crewList'] ?? $input['crew_list'] ?? $input['crew'] ?? [];

            if (!empty($crewList)) {
                // Delete existing and replace
                $deleteStmt = $pdo->prepare("DELETE FROM page2_crew WHERE booking_number = :bn");
                $deleteStmt->execute(['bn' => $bookingNumber]);

                // Insert updated crew members
                $insertStmt = $pdo->prepare("
                    INSERT INTO page2_crew (
                        booking_number, crew_index,
                        first_name, last_name, nationality,
                        passport_number, date_of_birth, place_of_birth, role
                    ) VALUES (
                        :booking_number, :crew_index,
                        :first_name, :last_name, :nationality,
                        :passport_number, :date_of_birth, :place_of_birth, :role
                    )
                ");

                foreach ($crewList as $index => $member) {
                    $insertStmt->execute([
                        'booking_number' => $bookingNumber,
                        'crew_index' => $index + 1,
                        'first_name' => $member['firstName'] ?? $member['first_name'] ?? null,
                        'last_name' => $member['lastName'] ?? $member['last_name'] ?? null,
                        'nationality' => $member['nationality'] ?? null,
                        'passport_number' => $member['passportNumber'] ?? $member['passport_number'] ?? null,
                        'date_of_birth' => $member['dateOfBirth'] ?? $member['date_of_birth'] ?? null,
                        'place_of_birth' => $member['placeOfBirth'] ?? $member['place_of_birth'] ?? null,
                        'role' => $member['role'] ?? 'passenger'
                    ]);
                }
            }

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 2 crew data updated successfully');
            break;

        case 'DELETE':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Check for crew_index parameter for single member deletion
            $crewIndex = $_GET['crew_index'] ?? $input['crewIndex'] ?? $input['crew_index'] ?? null;

            if ($crewIndex !== null) {
                // Delete single crew member
                $stmt = $pdo->prepare("
                    DELETE FROM page2_crew
                    WHERE booking_number = :bn AND crew_index = :idx
                ");
                $stmt->execute(['bn' => $bookingNumber, 'idx' => $crewIndex]);
            } else {
                // Delete all crew for booking
                $stmt = $pdo->prepare("DELETE FROM page2_crew WHERE booking_number = :bn");
                $stmt->execute(['bn' => $bookingNumber]);
            }

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Page 2 crew data deleted successfully');
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
