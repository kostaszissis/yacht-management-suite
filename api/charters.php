<?php
/**
 * CHARTERS API - Fleet Management
 * Handles: charter bookings, vessel assignments, financial data, payments
 */

require_once __DIR__ . '/db_connect.php';

try {
    $pdo = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $input = getJsonInput();

    // Get charter code from various sources
    $charterCode = $_GET['charter_code'] ?? $_GET['code'] ?? null;
    if (!$charterCode && isset($_SERVER['PATH_INFO'])) {
        $charterCode = urldecode(trim($_SERVER['PATH_INFO'], '/'));
    }
    if (!$charterCode && $input) {
        $charterCode = $input['charterCode'] ?? $input['charter_code'] ?? $input['code'] ?? null;
    }

    switch ($method) {
        case 'GET':
            // If charter_code provided, get single charter
            if ($charterCode) {
                $stmt = $pdo->prepare("
                    SELECT * FROM charters
                    WHERE charter_code = :code
                ");
                $stmt->execute(['code' => $charterCode]);
                $data = $stmt->fetch();

                if ($data) {
                    $result = convertKeysToCamel($data);
                    $result['payments'] = json_decode($data['payments'], true);

                    successResponse([
                        'charter' => $result
                    ]);
                } else {
                    successResponse([
                        'charter' => null,
                        'message' => 'No charter found with this code'
                    ]);
                }
            } else {
                // Get all charters with optional filters
                $vesselId = $_GET['vessel_id'] ?? $_GET['vesselId'] ?? null;
                $status = $_GET['status'] ?? null;
                $startDate = $_GET['start_date'] ?? $_GET['startDate'] ?? null;
                $endDate = $_GET['end_date'] ?? $_GET['endDate'] ?? null;

                $sql = "SELECT * FROM charters WHERE 1=1";
                $params = [];

                if ($vesselId) {
                    $sql .= " AND vessel_id = :vessel_id";
                    $params['vessel_id'] = $vesselId;
                }
                if ($status) {
                    $sql .= " AND status = :status";
                    $params['status'] = $status;
                }
                if ($startDate) {
                    $sql .= " AND start_date >= :start_date";
                    $params['start_date'] = $startDate;
                }
                if ($endDate) {
                    $sql .= " AND end_date <= :end_date";
                    $params['end_date'] = $endDate;
                }

                $sql .= " ORDER BY start_date DESC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $charters = $stmt->fetchAll();

                // Convert to camelCase and parse JSON
                $charterList = array_map(function($charter) {
                    $result = convertKeysToCamel($charter);
                    $result['payments'] = json_decode($charter['payments'], true);
                    return $result;
                }, $charters);

                successResponse([
                    'charters' => $charterList,
                    'count' => count($charterList)
                ]);
            }
            break;

        case 'POST':
            if (!$charterCode) {
                $charterCode = $input['charterCode'] ?? $input['charter_code'] ?? $input['code'] ?? null;
            }

            if (!$charterCode) {
                errorResponse('charter_code is required', 400);
            }

            // Check if charter already exists
            $checkStmt = $pdo->prepare("SELECT id FROM charters WHERE charter_code = :code");
            $checkStmt->execute(['code' => $charterCode]);

            if ($checkStmt->fetch()) {
                errorResponse('Charter already exists. Use PUT to update.', 409);
            }

            // Insert new charter
            $stmt = $pdo->prepare("
                INSERT INTO charters (
                    charter_code, vessel_id, vessel_name, owner_code,
                    start_date, end_date, departure_port, arrival_port,
                    status, booking_status, payment_status,
                    charter_amount, commission_percent, commission_amount, vat_on_commission,
                    skipper_first_name, skipper_last_name, skipper_address,
                    skipper_email, skipper_phone,
                    payments, notes, created_by, broker
                ) VALUES (
                    :charter_code, :vessel_id, :vessel_name, :owner_code,
                    :start_date, :end_date, :departure_port, :arrival_port,
                    :status, :booking_status, :payment_status,
                    :charter_amount, :commission_percent, :commission_amount, :vat_on_commission,
                    :skipper_first_name, :skipper_last_name, :skipper_address,
                    :skipper_email, :skipper_phone,
                    :payments, :notes, :created_by, :broker
                )
            ");

            $stmt->execute([
                'charter_code' => $charterCode,
                'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                'owner_code' => $input['ownerCode'] ?? $input['owner_code'] ?? null,
                'start_date' => $input['startDate'] ?? $input['start_date'] ?? null,
                'end_date' => $input['endDate'] ?? $input['end_date'] ?? null,
                'departure_port' => $input['departurePort'] ?? $input['departure_port'] ?? 'ALIMOS MARINA',
                'arrival_port' => $input['arrivalPort'] ?? $input['arrival_port'] ?? 'ALIMOS MARINA',
                'status' => $input['status'] ?? 'Option',
                'booking_status' => $input['bookingStatus'] ?? $input['booking_status'] ?? null,
                'payment_status' => $input['paymentStatus'] ?? $input['payment_status'] ?? 'Pending',
                'charter_amount' => $input['charterAmount'] ?? $input['charter_amount'] ?? null,
                'commission_percent' => $input['commissionPercent'] ?? $input['commission_percent'] ?? null,
                'commission_amount' => $input['commissionAmount'] ?? $input['commission_amount'] ?? null,
                'vat_on_commission' => $input['vatOnCommission'] ?? $input['vat_on_commission'] ?? null,
                'skipper_first_name' => $input['skipperFirstName'] ?? $input['skipper_first_name'] ?? null,
                'skipper_last_name' => $input['skipperLastName'] ?? $input['skipper_last_name'] ?? null,
                'skipper_address' => $input['skipperAddress'] ?? $input['skipper_address'] ?? null,
                'skipper_email' => $input['skipperEmail'] ?? $input['skipper_email'] ?? null,
                'skipper_phone' => $input['skipperPhone'] ?? $input['skipper_phone'] ?? null,
                'payments' => json_encode($input['payments'] ?? []),
                'notes' => $input['notes'] ?? null,
                'created_by' => $input['createdBy'] ?? $input['created_by'] ?? null,
                'broker' => $input['broker'] ?? ''
            ]);

            successResponse([
                'charter_code' => $charterCode
            ], 'Charter created successfully');
            break;

        case 'PUT':
            if (!$charterCode) {
                $charterCode = $input['charterCode'] ?? $input['charter_code'] ?? $input['code'] ?? null;
            }

            if (!$charterCode) {
                errorResponse('charter_code is required', 400);
            }

            // Check if charter exists
            $checkStmt = $pdo->prepare("SELECT id FROM charters WHERE charter_code = :code");
            $checkStmt->execute(['code' => $charterCode]);

            if (!$checkStmt->fetch()) {
                // Create new charter if doesn't exist (upsert behavior)
                $stmt = $pdo->prepare("
                    INSERT INTO charters (
                        charter_code, vessel_id, vessel_name, owner_code,
                        start_date, end_date, departure_port, arrival_port,
                        status, booking_status, payment_status,
                        charter_amount, commission_percent, commission_amount, vat_on_commission,
                        skipper_first_name, skipper_last_name, skipper_address,
                        skipper_email, skipper_phone,
                        payments, notes, created_by, broker
                    ) VALUES (
                        :charter_code, :vessel_id, :vessel_name, :owner_code,
                        :start_date, :end_date, :departure_port, :arrival_port,
                        :status, :booking_status, :payment_status,
                        :charter_amount, :commission_percent, :commission_amount, :vat_on_commission,
                        :skipper_first_name, :skipper_last_name, :skipper_address,
                        :skipper_email, :skipper_phone,
                        :payments, :notes, :created_by, :broker
                    )
                ");

                $stmt->execute([
                    'charter_code' => $charterCode,
                    'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'owner_code' => $input['ownerCode'] ?? $input['owner_code'] ?? null,
                    'start_date' => $input['startDate'] ?? $input['start_date'] ?? null,
                    'end_date' => $input['endDate'] ?? $input['end_date'] ?? null,
                    'departure_port' => $input['departurePort'] ?? $input['departure_port'] ?? 'ALIMOS MARINA',
                    'arrival_port' => $input['arrivalPort'] ?? $input['arrival_port'] ?? 'ALIMOS MARINA',
                    'status' => $input['status'] ?? 'Option',
                    'booking_status' => $input['bookingStatus'] ?? $input['booking_status'] ?? null,
                    'payment_status' => $input['paymentStatus'] ?? $input['payment_status'] ?? 'Pending',
                    'charter_amount' => $input['charterAmount'] ?? $input['charter_amount'] ?? null,
                    'commission_percent' => $input['commissionPercent'] ?? $input['commission_percent'] ?? null,
                    'commission_amount' => $input['commissionAmount'] ?? $input['commission_amount'] ?? null,
                    'vat_on_commission' => $input['vatOnCommission'] ?? $input['vat_on_commission'] ?? null,
                    'skipper_first_name' => $input['skipperFirstName'] ?? $input['skipper_first_name'] ?? null,
                    'skipper_last_name' => $input['skipperLastName'] ?? $input['skipper_last_name'] ?? null,
                    'skipper_address' => $input['skipperAddress'] ?? $input['skipper_address'] ?? null,
                    'skipper_email' => $input['skipperEmail'] ?? $input['skipper_email'] ?? null,
                    'skipper_phone' => $input['skipperPhone'] ?? $input['skipper_phone'] ?? null,
                    'payments' => json_encode($input['payments'] ?? []),
                    'notes' => $input['notes'] ?? null,
                    'created_by' => $input['createdBy'] ?? $input['created_by'] ?? null,
                    'broker' => $input['broker'] ?? ''
                ]);
            } else {
                // Update existing charter
                $stmt = $pdo->prepare("
                    UPDATE charters SET
                        vessel_id = COALESCE(:vessel_id, vessel_id),
                        vessel_name = COALESCE(:vessel_name, vessel_name),
                        owner_code = COALESCE(:owner_code, owner_code),
                        start_date = COALESCE(:start_date, start_date),
                        end_date = COALESCE(:end_date, end_date),
                        departure_port = COALESCE(:departure_port, departure_port),
                        arrival_port = COALESCE(:arrival_port, arrival_port),
                        status = COALESCE(:status, status),
                        booking_status = COALESCE(:booking_status, booking_status),
                        payment_status = COALESCE(:payment_status, payment_status),
                        charter_amount = COALESCE(:charter_amount, charter_amount),
                        commission_percent = COALESCE(:commission_percent, commission_percent),
                        commission_amount = COALESCE(:commission_amount, commission_amount),
                        vat_on_commission = COALESCE(:vat_on_commission, vat_on_commission),
                        skipper_first_name = COALESCE(:skipper_first_name, skipper_first_name),
                        skipper_last_name = COALESCE(:skipper_last_name, skipper_last_name),
                        skipper_address = COALESCE(:skipper_address, skipper_address),
                        skipper_email = COALESCE(:skipper_email, skipper_email),
                        skipper_phone = COALESCE(:skipper_phone, skipper_phone),
                        payments = COALESCE(:payments, payments),
                        notes = COALESCE(:notes, notes),
                        broker = COALESCE(:broker, broker)
                    WHERE charter_code = :charter_code
                ");

                $stmt->execute([
                    'charter_code' => $charterCode,
                    'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'owner_code' => $input['ownerCode'] ?? $input['owner_code'] ?? null,
                    'start_date' => $input['startDate'] ?? $input['start_date'] ?? null,
                    'end_date' => $input['endDate'] ?? $input['end_date'] ?? null,
                    'departure_port' => $input['departurePort'] ?? $input['departure_port'] ?? null,
                    'arrival_port' => $input['arrivalPort'] ?? $input['arrival_port'] ?? null,
                    'status' => $input['status'] ?? null,
                    'booking_status' => $input['bookingStatus'] ?? $input['booking_status'] ?? null,
                    'payment_status' => $input['paymentStatus'] ?? $input['payment_status'] ?? null,
                    'charter_amount' => $input['charterAmount'] ?? $input['charter_amount'] ?? null,
                    'commission_percent' => $input['commissionPercent'] ?? $input['commission_percent'] ?? null,
                    'commission_amount' => $input['commissionAmount'] ?? $input['commission_amount'] ?? null,
                    'vat_on_commission' => $input['vatOnCommission'] ?? $input['vat_on_commission'] ?? null,
                    'skipper_first_name' => $input['skipperFirstName'] ?? $input['skipper_first_name'] ?? null,
                    'skipper_last_name' => $input['skipperLastName'] ?? $input['skipper_last_name'] ?? null,
                    'skipper_address' => $input['skipperAddress'] ?? $input['skipper_address'] ?? null,
                    'skipper_email' => $input['skipperEmail'] ?? $input['skipper_email'] ?? null,
                    'skipper_phone' => $input['skipperPhone'] ?? $input['skipper_phone'] ?? null,
                    'payments' => isset($input['payments']) ? json_encode($input['payments']) : null,
                    'notes' => $input['notes'] ?? null,
                    'broker' => $input['broker'] ?? null
                ]);
            }

            successResponse([
                'charter_code' => $charterCode
            ], 'Charter updated successfully');
            break;

        case 'DELETE':
            if (!$charterCode) {
                errorResponse('charter_code is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM charters WHERE charter_code = :code");
            $stmt->execute(['code' => $charterCode]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Charter deleted successfully');
            } else {
                errorResponse('Charter not found', 404);
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
