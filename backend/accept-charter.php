<?php
header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$code = $_GET['code'] ?? '';
$action = $_GET['action'] ?? '';

if (empty($code)) {
    echo '<!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>Error</title></head>
    <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: #EF4444;">❌ Σφάλμα</h1>
        <p>Λείπει ο κωδικός ναύλου</p>
    </body></html>';
    exit();
}

try {
    $pdo = new PDO("mysql:host=localhost;dbname=yacht_management;charset=utf8mb4", "root", "Yacht2024!");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 🔥 FIX: Fetch charter with boat and owner details
    $stmt = $pdo->prepare("
        SELECT c.*, b.name as boat_name, b.model as boat_model,
               o.company as owner_company, o.name as owner_name, o.email as owner_email,
               o.phone as owner_phone, o.tax_id as owner_tax_id, o.address as owner_address
        FROM charters c
        LEFT JOIN boats b ON c.vessel_id = b.id
        LEFT JOIN owners o ON b.owner_id = o.id
        WHERE c.charter_code = ? OR c.code = ?
    ");
    $stmt->execute([$code, $code]);
    $charter = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$charter) {
        echo '<!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #EF4444;">❌ Σφάλμα</h1>
            <p>Δεν βρέθηκε το ναύλο: ' . htmlspecialchars($code) . '</p>
        </body></html>';
        exit();
    }

    $currentStatus = $charter['status'] ?? '';
    if ($currentStatus === 'option' || $currentStatus === 'Option') {
        $newStatus = 'option_accepted';
    } elseif ($currentStatus === 'pending_final_confirmation' || $currentStatus === 'Pending Final Confirmation') {
        $newStatus = 'confirmed';
    } else {
        $newStatus = 'confirmed';
    }

    // Update status in database
    $updateStmt = $pdo->prepare("UPDATE charters SET status = ?, updated_at = NOW() WHERE id = ?");
    $updateStmt->execute([$newStatus, $charter['id']]);

    // 🔥 FIX: Send confirmation email via API
    $emailSent = false;
    $emailError = '';

    try {
        // Prepare email data
        $emailData = [
            'to' => ['info@tailwindyachting.com', 'charter@tailwindyachting.com'],
            'subject' => '',
            'charter' => [
                'code' => $charter['charter_code'] ?? $charter['code'] ?? $code,
                'startDate' => $charter['start_date'] ?? '',
                'endDate' => $charter['end_date'] ?? '',
                'departure' => $charter['departure'] ?? 'ALIMOS MARINA',
                'arrival' => $charter['arrival'] ?? 'ALIMOS MARINA',
                'amount' => floatval($charter['amount'] ?? 0),
                'commission' => floatval($charter['commission'] ?? 0),
                'vat_on_commission' => floatval($charter['vat_on_commission'] ?? 0)
            ],
            'boat' => [
                'name' => $charter['boat_name'] ?? '',
                'model' => $charter['boat_model'] ?? ''
            ],
            'owner' => [
                'company' => $charter['owner_company'] ?? '',
                'name' => $charter['owner_name'] ?? '',
                'email' => $charter['owner_email'] ?? ''
            ],
            'status' => $newStatus
        ];

        // Add owner email to recipients if available
        if (!empty($charter['owner_email'])) {
            $emailData['to'][] = $charter['owner_email'];
        }

        // Set subject based on new status
        $year = date('Y');
        $charterCode = $charter['charter_code'] ?? $charter['code'] ?? $code;
        if ($newStatus === 'option_accepted') {
            $emailData['subject'] = "CHARTER OPTION ACCEPTED {$charterCode}/{$year}";
        } elseif ($newStatus === 'confirmed') {
            $emailData['subject'] = "CHARTER CONFIRMED {$charterCode}/{$year}";
        }

        // Call the send-email endpoint
        $emailApiUrl = 'https://yachtmanagementsuite.com/email/send-email';

        $ch = curl_init($emailApiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($httpCode === 200) {
            $emailSent = true;
        } else {
            $emailError = "HTTP {$httpCode}: " . ($curlError ?: $response);
        }
    } catch (Exception $emailEx) {
        $emailError = $emailEx->getMessage();
    }

    // Show success page
    $emailStatusHtml = $emailSent
        ? '<p style="color: #10B981; font-size: 14px;">📧 Email επιβεβαίωσης εστάλη!</p>'
        : '<p style="color: #F59E0B; font-size: 14px;">⚠️ Email δεν εστάλη (θα σταλεί από την εφαρμογή)</p>';

    echo '<!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>Επιτυχία</title></head>
    <body style="font-family: Arial; text-align: center; padding: 50px; background: #f0fdf4;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #10B981;">✅ Επιτυχής Αποδοχή!</h1>
            <p style="font-size: 18px;">Το ναύλο <strong>' . htmlspecialchars($code) . '</strong> αποδέχθηκε επιτυχώς.</p>
            <p style="color: #666;">Νέα κατάσταση: <strong>' . htmlspecialchars($newStatus) . '</strong></p>
            ' . $emailStatusHtml . '
            <p style="margin-top: 30px;">
                <a href="https://yachtmanagementsuite.com"
                   style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 30px;
                          text-decoration: none; border-radius: 6px;">
                    Μετάβαση στο σύστημα
                </a>
            </p>
        </div>
    </body></html>';

} catch (Exception $e) {
    echo '<!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>Error</title></head>
    <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: #EF4444;">❌ Σφάλμα</h1>
        <p>' . htmlspecialchars($e->getMessage()) . '</p>
    </body></html>';
}
?>
