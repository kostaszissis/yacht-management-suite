<?php
/**
 * PAGE 5 API - Final Agreement & Signatures
 * Handles: terms acceptance, deposits, charges, signatures, PDF generation status
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
                SELECT * FROM page5_agreement
                WHERE booking_number = :bn
            ");
            $stmt->execute(['bn' => $bookingNumber]);
            $data = $stmt->fetch();

            if ($data) {
                // Parse JSON fields
                $result = convertKeysToCamel($data);
                $result['otherCharges'] = json_decode($data['other_charges'], true);

                successResponse([
                    'agreementData' => $result
                ]);
            } else {
                successResponse([
                    'agreementData' => null,
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
            $checkStmt = $pdo->prepare("SELECT id FROM page5_agreement WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if ($checkStmt->fetch()) {
                errorResponse('Record already exists. Use PUT to update.', 409);
            }

            // Insert new record
            $stmt = $pdo->prepare("
                INSERT INTO page5_agreement (
                    booking_number, agreement_type,
                    terms_accepted, deposit_amount, deposit_paid, deposit_method,
                    damage_deposit, fuel_charge, other_charges, total_amount,
                    skipper_signature, skipper_signed_at,
                    company_signature, company_signed_at, company_representative,
                    pdf_generated, pdf_url, email_sent, email_sent_at, notes
                ) VALUES (
                    :booking_number, :agreement_type,
                    :terms_accepted, :deposit_amount, :deposit_paid, :deposit_method,
                    :damage_deposit, :fuel_charge, :other_charges, :total_amount,
                    :skipper_signature, :skipper_signed_at,
                    :company_signature, :company_signed_at, :company_representative,
                    :pdf_generated, :pdf_url, :email_sent, :email_sent_at, :notes
                )
            ");

            $stmt->execute([
                'booking_number' => $bookingNumber,
                'agreement_type' => $input['agreementType'] ?? $input['agreement_type'] ?? 'check_in',
                'terms_accepted' => $input['termsAccepted'] ?? $input['terms_accepted'] ?? false,
                'deposit_amount' => $input['depositAmount'] ?? $input['deposit_amount'] ?? null,
                'deposit_paid' => $input['depositPaid'] ?? $input['deposit_paid'] ?? false,
                'deposit_method' => $input['depositMethod'] ?? $input['deposit_method'] ?? null,
                'damage_deposit' => $input['damageDeposit'] ?? $input['damage_deposit'] ?? null,
                'fuel_charge' => $input['fuelCharge'] ?? $input['fuel_charge'] ?? null,
                'other_charges' => json_encode($input['otherCharges'] ?? $input['other_charges'] ?? []),
                'total_amount' => $input['totalAmount'] ?? $input['total_amount'] ?? null,
                'skipper_signature' => $input['skipperSignature'] ?? $input['skipper_signature'] ?? null,
                'skipper_signed_at' => $input['skipperSignedAt'] ?? $input['skipper_signed_at'] ?? null,
                'company_signature' => $input['companySignature'] ?? $input['company_signature'] ?? null,
                'company_signed_at' => $input['companySignedAt'] ?? $input['company_signed_at'] ?? null,
                'company_representative' => $input['companyRepresentative'] ?? $input['company_representative'] ?? null,
                'pdf_generated' => $input['pdfGenerated'] ?? $input['pdf_generated'] ?? false,
                'pdf_url' => $input['pdfUrl'] ?? $input['pdf_url'] ?? null,
                'email_sent' => $input['emailSent'] ?? $input['email_sent'] ?? false,
                'email_sent_at' => $input['emailSentAt'] ?? $input['email_sent_at'] ?? null,
                'notes' => $input['notes'] ?? null
            ]);

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 5 agreement data saved successfully');
            break;

        case 'PUT':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            // Ensure booking exists
            ensureBookingExists($pdo, $bookingNumber);

            // Check if record exists
            $checkStmt = $pdo->prepare("SELECT id FROM page5_agreement WHERE booking_number = :bn");
            $checkStmt->execute(['bn' => $bookingNumber]);

            if (!$checkStmt->fetch()) {
                // Create new record if doesn't exist (upsert behavior)
                $stmt = $pdo->prepare("
                    INSERT INTO page5_agreement (
                        booking_number, agreement_type,
                        terms_accepted, deposit_amount, deposit_paid, deposit_method,
                        damage_deposit, fuel_charge, other_charges, total_amount,
                        skipper_signature, skipper_signed_at,
                        company_signature, company_signed_at, company_representative,
                        pdf_generated, pdf_url, email_sent, email_sent_at, notes
                    ) VALUES (
                        :booking_number, :agreement_type,
                        :terms_accepted, :deposit_amount, :deposit_paid, :deposit_method,
                        :damage_deposit, :fuel_charge, :other_charges, :total_amount,
                        :skipper_signature, :skipper_signed_at,
                        :company_signature, :company_signed_at, :company_representative,
                        :pdf_generated, :pdf_url, :email_sent, :email_sent_at, :notes
                    )
                ");

                $stmt->execute([
                    'booking_number' => $bookingNumber,
                    'agreement_type' => $input['agreementType'] ?? $input['agreement_type'] ?? 'check_in',
                    'terms_accepted' => $input['termsAccepted'] ?? $input['terms_accepted'] ?? false,
                    'deposit_amount' => $input['depositAmount'] ?? $input['deposit_amount'] ?? null,
                    'deposit_paid' => $input['depositPaid'] ?? $input['deposit_paid'] ?? false,
                    'deposit_method' => $input['depositMethod'] ?? $input['deposit_method'] ?? null,
                    'damage_deposit' => $input['damageDeposit'] ?? $input['damage_deposit'] ?? null,
                    'fuel_charge' => $input['fuelCharge'] ?? $input['fuel_charge'] ?? null,
                    'other_charges' => json_encode($input['otherCharges'] ?? $input['other_charges'] ?? []),
                    'total_amount' => $input['totalAmount'] ?? $input['total_amount'] ?? null,
                    'skipper_signature' => $input['skipperSignature'] ?? $input['skipper_signature'] ?? null,
                    'skipper_signed_at' => $input['skipperSignedAt'] ?? $input['skipper_signed_at'] ?? null,
                    'company_signature' => $input['companySignature'] ?? $input['company_signature'] ?? null,
                    'company_signed_at' => $input['companySignedAt'] ?? $input['company_signed_at'] ?? null,
                    'company_representative' => $input['companyRepresentative'] ?? $input['company_representative'] ?? null,
                    'pdf_generated' => $input['pdfGenerated'] ?? $input['pdf_generated'] ?? false,
                    'pdf_url' => $input['pdfUrl'] ?? $input['pdf_url'] ?? null,
                    'email_sent' => $input['emailSent'] ?? $input['email_sent'] ?? false,
                    'email_sent_at' => $input['emailSentAt'] ?? $input['email_sent_at'] ?? null,
                    'notes' => $input['notes'] ?? null
                ]);
            } else {
                // Update existing record
                $stmt = $pdo->prepare("
                    UPDATE page5_agreement SET
                        agreement_type = COALESCE(:agreement_type, agreement_type),
                        terms_accepted = COALESCE(:terms_accepted, terms_accepted),
                        deposit_amount = COALESCE(:deposit_amount, deposit_amount),
                        deposit_paid = COALESCE(:deposit_paid, deposit_paid),
                        deposit_method = COALESCE(:deposit_method, deposit_method),
                        damage_deposit = COALESCE(:damage_deposit, damage_deposit),
                        fuel_charge = COALESCE(:fuel_charge, fuel_charge),
                        other_charges = COALESCE(:other_charges, other_charges),
                        total_amount = COALESCE(:total_amount, total_amount),
                        skipper_signature = COALESCE(:skipper_signature, skipper_signature),
                        skipper_signed_at = COALESCE(:skipper_signed_at, skipper_signed_at),
                        company_signature = COALESCE(:company_signature, company_signature),
                        company_signed_at = COALESCE(:company_signed_at, company_signed_at),
                        company_representative = COALESCE(:company_representative, company_representative),
                        pdf_generated = COALESCE(:pdf_generated, pdf_generated),
                        pdf_url = COALESCE(:pdf_url, pdf_url),
                        email_sent = COALESCE(:email_sent, email_sent),
                        email_sent_at = COALESCE(:email_sent_at, email_sent_at),
                        notes = COALESCE(:notes, notes)
                    WHERE booking_number = :booking_number
                ");

                $stmt->execute([
                    'booking_number' => $bookingNumber,
                    'agreement_type' => $input['agreementType'] ?? $input['agreement_type'] ?? null,
                    'terms_accepted' => isset($input['termsAccepted']) || isset($input['terms_accepted'])
                        ? ($input['termsAccepted'] ?? $input['terms_accepted']) : null,
                    'deposit_amount' => $input['depositAmount'] ?? $input['deposit_amount'] ?? null,
                    'deposit_paid' => isset($input['depositPaid']) || isset($input['deposit_paid'])
                        ? ($input['depositPaid'] ?? $input['deposit_paid']) : null,
                    'deposit_method' => $input['depositMethod'] ?? $input['deposit_method'] ?? null,
                    'damage_deposit' => $input['damageDeposit'] ?? $input['damage_deposit'] ?? null,
                    'fuel_charge' => $input['fuelCharge'] ?? $input['fuel_charge'] ?? null,
                    'other_charges' => isset($input['otherCharges']) || isset($input['other_charges'])
                        ? json_encode($input['otherCharges'] ?? $input['other_charges']) : null,
                    'total_amount' => $input['totalAmount'] ?? $input['total_amount'] ?? null,
                    'skipper_signature' => $input['skipperSignature'] ?? $input['skipper_signature'] ?? null,
                    'skipper_signed_at' => $input['skipperSignedAt'] ?? $input['skipper_signed_at'] ?? null,
                    'company_signature' => $input['companySignature'] ?? $input['company_signature'] ?? null,
                    'company_signed_at' => $input['companySignedAt'] ?? $input['company_signed_at'] ?? null,
                    'company_representative' => $input['companyRepresentative'] ?? $input['company_representative'] ?? null,
                    'pdf_generated' => isset($input['pdfGenerated']) || isset($input['pdf_generated'])
                        ? ($input['pdfGenerated'] ?? $input['pdf_generated']) : null,
                    'pdf_url' => $input['pdfUrl'] ?? $input['pdf_url'] ?? null,
                    'email_sent' => isset($input['emailSent']) || isset($input['email_sent'])
                        ? ($input['emailSent'] ?? $input['email_sent']) : null,
                    'email_sent_at' => $input['emailSentAt'] ?? $input['email_sent_at'] ?? null,
                    'notes' => $input['notes'] ?? null
                ]);
            }

            successResponse([
                'booking_number' => $bookingNumber
            ], 'Page 5 agreement data updated successfully');
            break;

        case 'DELETE':
            if (!$bookingNumber) {
                errorResponse('booking_number is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM page5_agreement WHERE booking_number = :bn");
            $stmt->execute(['bn' => $bookingNumber]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Page 5 agreement data deleted successfully');
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
