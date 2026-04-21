<?php
/**
 * PAGE 1 API - Booking Details
 * Handles: booking number, vessel, dates, skipper info
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
                SELECT * FROM page1_booking_details
                WHERE booking_number = :bn
            ");
            $stmt->execute(['bn' => $bookingNumber]);
            $data = $stmt->fetch();

            if ($data) {
                // Convert to camelCase for frontend
                successResponse([
                    'bookingDetails' => convertKeysToCamel($data)
                ]);
            } else {
                // Return empty but valid response
                successResponse([
                    'bookingDetails' => null,
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
            $checkStmt = $pdo->prepare("SELECT id FROM page1_booking_details WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if ($checkStmt->fetch()) {
                errorResponse('Record already exists. Use PUT to update.', 409);
            }

            // Insert new record
            $stmt = $pdo->prepare("
                INSERT INTO page1_booking_details (
                    booking_number, vessel_name, vessel_id,
                    check_in_date, check_in_time, check_out_date, check_out_time,
                    departure_port, arrival_port,
                    skipper_first_name, skipper_last_name, skipper_address,
                    skipper_email, skipper_phone, skipper_nationality, skipper_passport,
                    mode, status
                ) VALUES (
                    :booking_number, :vessel_name, :vessel_id,
                    :check_in_date, :check_in_time, :check_out_date, :check_out_time,
                    :departure_port, :arrival_port,
                    :skipper_first_name, :skipper_last_name, :skipper_address,
                    :skipper_email, :skipper_phone, :skipper_nationality, :skipper_passport,
                    :mode, :status
                )
            ");

            $stmt->execute([
                'booking_number' => $bookingNumber,
                'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                'check_in_date' => $input['checkInDate'] ?? $input['check_in_date'] ?? null,
                'check_in_time' => $input['checkInTime'] ?? $input['check_in_time'] ?? null,
                'check_out_date' => $input['checkOutDate'] ?? $input['check_out_date'] ?? null,
                'check_out_time' => $input['checkOutTime'] ?? $input['check_out_time'] ?? null,
                'departure_port' => $input['departurePort'] ?? $input['departure_port'] ?? 'ALIMOS MARINA',
                'arrival_port' => $input['arrivalPort'] ?? $input['arrival_port'] ?? 'ALIMOS MARINA',
                'skipper_first_name' => $input['skipperFirstName'] ?? $input['skipper_first_name'] ?? null,
                'skipper_last_name' => $input['skipperLastName'] ?? $input['skipper_last_name'] ?? null,
                'skipper_address' => $input['skipperAddress'] ?? $input['skipper_address'] ?? null,
                'skipper_email' => $input['skipperEmail'] ?? $input['skipper_email'] ?? null,
                'skipper_phone' => $input['skipperPhone'] ?? $input['skipper_phone'] ?? null,
                'skipper_nationality' => $input['skipperNationality'] ?? $input['skipper_nationality'] ?? null,
                'skipper_passport' => $input['skipperPassport'] ?? $input['skipper_passport'] ?? null,
                'mode' => $input['mode'] ?? 'in',
                'status' => $input['status'] ?? 'pending'
            ]);

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 1 data saved successfully');
            break;

        case 'PUT':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Ensure booking exists
            ensureBookingExists($pdo, $bookingNumber);

            // Check if record exists
            $checkStmt = $pdo->prepare("SELECT id FROM page1_booking_details WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if (!$checkStmt->fetch()) {
                // Create new record if doesn't exist (upsert behavior)
                $stmt = $pdo->prepare("
                    INSERT INTO page1_booking_details (
                        booking_number, vessel_name, vessel_id,
                        check_in_date, check_in_time, check_out_date, check_out_time,
                        departure_port, arrival_port,
                        skipper_first_name, skipper_last_name, skipper_address,
                        skipper_email, skipper_phone, skipper_nationality, skipper_passport,
                        mode, status
                    ) VALUES (
                        :booking_number, :vessel_name, :vessel_id,
                        :check_in_date, :check_in_time, :check_out_date, :check_out_time,
                        :departure_port, :arrival_port,
                        :skipper_first_name, :skipper_last_name, :skipper_address,
                        :skipper_email, :skipper_phone, :skipper_nationality, :skipper_passport,
                        :mode, :status
                    )
                ");
            } else {
                // Update existing record
                $stmt = $pdo->prepare("
                    UPDATE page1_booking_details SET
                        vessel_name = COALESCE(:vessel_name, vessel_name),
                        vessel_id = COALESCE(:vessel_id, vessel_id),
                        check_in_date = COALESCE(:check_in_date, check_in_date),
                        check_in_time = COALESCE(:check_in_time, check_in_time),
                        check_out_date = COALESCE(:check_out_date, check_out_date),
                        check_out_time = COALESCE(:check_out_time, check_out_time),
                        departure_port = COALESCE(:departure_port, departure_port),
                        arrival_port = COALESCE(:arrival_port, arrival_port),
                        skipper_first_name = COALESCE(:skipper_first_name, skipper_first_name),
                        skipper_last_name = COALESCE(:skipper_last_name, skipper_last_name),
                        skipper_address = COALESCE(:skipper_address, skipper_address),
                        skipper_email = COALESCE(:skipper_email, skipper_email),
                        skipper_phone = COALESCE(:skipper_phone, skipper_phone),
                        skipper_nationality = COALESCE(:skipper_nationality, skipper_nationality),
                        skipper_passport = COALESCE(:skipper_passport, skipper_passport),
                        mode = COALESCE(:mode, mode),
                        status = COALESCE(:status, status)
                    WHERE booking_number = :booking_number
                ");
            }

            $stmt->execute([
                'booking_number' => $bookingNumber,
                'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                'check_in_date' => $input['checkInDate'] ?? $input['check_in_date'] ?? null,
                'check_in_time' => $input['checkInTime'] ?? $input['check_in_time'] ?? null,
                'check_out_date' => $input['checkOutDate'] ?? $input['check_out_date'] ?? null,
                'check_out_time' => $input['checkOutTime'] ?? $input['check_out_time'] ?? null,
                'departure_port' => $input['departurePort'] ?? $input['departure_port'] ?? null,
                'arrival_port' => $input['arrivalPort'] ?? $input['arrival_port'] ?? null,
                'skipper_first_name' => $input['skipperFirstName'] ?? $input['skipper_first_name'] ?? null,
                'skipper_last_name' => $input['skipperLastName'] ?? $input['skipper_last_name'] ?? null,
                'skipper_address' => $input['skipperAddress'] ?? $input['skipper_address'] ?? null,
                'skipper_email' => $input['skipperEmail'] ?? $input['skipper_email'] ?? null,
                'skipper_phone' => $input['skipperPhone'] ?? $input['skipper_phone'] ?? null,
                'skipper_nationality' => $input['skipperNationality'] ?? $input['skipper_nationality'] ?? null,
                'skipper_passport' => $input['skipperPassport'] ?? $input['skipper_passport'] ?? null,
                'mode' => $input['mode'] ?? null,
                'status' => $input['status'] ?? null
            ]);

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 1 data updated successfully');
            break;

        case 'DELETE':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM page1_booking_details WHERE booking_number = :bn");
            $stmt->execute(['bn' => $bookingNumber]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Page 1 data deleted successfully');
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
