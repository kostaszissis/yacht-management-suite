<?php
/**
 * PAGE 2 API - Crew List & Passengers
 * Handles: crew members, passengers with their details
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
                SELECT * FROM page2_crew
                WHERE booking_number = :bn
                ORDER BY crew_index ASC
            ");
            $stmt->execute(['bn' => $bookingNumber]);
            $crew = $stmt->fetchAll();

            // Convert to camelCase for frontend
            $crewList = array_map(function($member) {
                return convertKeysToCamel($member);
            }, $crew);

            successResponse([
                'crewList' => $crewList,
                'count' => count($crewList)
            ]);
            break;

        case 'POST':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Ensure booking exists in main table
            ensureBookingExists($pdo, $bookingNumber);

            // Get crew array from input
            $crewList = $input['crewList'] ?? $input['crew_list'] ?? $input['crew'] ?? [];

            if (empty($crewList)) {
                errorResponse('crewList array is required', 400);
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

            // Get crew array from input
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
