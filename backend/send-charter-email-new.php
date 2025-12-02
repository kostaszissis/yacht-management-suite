<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

$to = $data['to'] ?? [];
$subject = $data['subject'] ?? 'Charter Notification';

if (is_array($to)) {
    $recipients = implode(', ', $to);
} else {
    $recipients = $to;
}

// USE HTML FROM FRONTEND IF PROVIDED
if (!empty($data['html'])) {
    $html = $data['html'];
} else {
    // Fallback: Generate simple HTML from data
    $code = $data['code'] ?? '';
    $boatName = $data['boatName'] ?? '';
    $action = $data['action'] ?? '';
    $startDate = $data['startDate'] ?? '';
    $endDate = $data['endDate'] ?? '';
    $amount = $data['amount'] ?? 0;
    $netIncome = $data['netIncome'] ?? 0;

    // Status messages in Greek
    switch (strtolower($action)) {
        case 'option':
        case 'new_charter':
            $statusText = 'OPTION';
            $statusColor = '#F59E0B';
            $footerMessage = 'Ενημερώνουμε ότι το ναύλο είναι option. Παρακαλώ επιβεβαιώστε την λήψη του email.';
            break;
        case 'option_accepted':
        case 'option accepted':
            $statusText = 'ΕΠΙΒΕΒΑΙΩΘΗΚΕ (OPTION)';
            $statusColor = '#F59E0B';
            $footerMessage = 'Ενημερώνουμε ότι το ναύλο είναι option και επιβεβαιώθηκε. Παρακαλώ επιβεβαιώστε την λήψη του email.';
            break;
        case 'confirmed':
        case 'finalized':
        case 'reservation':
            $statusText = 'ΤΟ ΝΑΥΛΟ ΚΛΕΙΣΤΗΚΕ';
            $statusColor = '#10B981';
            $footerMessage = 'Ενημερώνουμε ότι το ναύλο κλείστηκε. Παρακαλώ επιβεβαιώστε την λήψη του email.';
            break;
        case 'cancelled':
        case 'rejected':
            $statusText = 'ΤΟ ΝΑΥΛΟ ΑΚΥΡΩΘΗΚΕ';
            $statusColor = '#EF4444';
            $footerMessage = 'Ενημερώνουμε ότι το ναύλο ακυρώθηκε.';
            break;
        case 'expired':
            $statusText = 'ΕΛΗΞΕ';
            $statusColor = '#6B7280';
            $footerMessage = 'Ενημερώνουμε ότι το option έληξε αυτόματα μετά από 6 ημέρες.';
            break;
        default:
            $statusText = strtoupper($action);
            $statusColor = '#6B7280';
            $footerMessage = 'Παρακαλώ επιβεβαιώστε την λήψη του email.';
    }

    $year = date('Y');

    $html = <<<HTML
<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <title>Charter Information - {$code}</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #e5e7eb;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: #ffffff; padding: 25px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="50%" style="vertical-align: top;">
                        <div style="font-size: 24px; font-weight: bold;">TAILWIND</div>
                    </td>
                    <td width="50%" style="vertical-align: top; text-align: right; font-size: 12px;">
                        <div style="font-weight: bold; margin-bottom: 5px;">TAILWIND YACHTING</div>
                        <div>Alimou 7, Alimos 17455</div>
                        <div>Tel: +30 210 9853180</div>
                        <div>info@tailwindyachting.com</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Title -->
        <div style="background-color: #1e3a5f; color: #ffffff; padding: 15px 30px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">CHARTERING INFORMATION - {$code}/{$year}</h2>
        </div>

        <!-- Body -->
        <div style="background-color: #f3f4f6; padding: 25px 30px;">
            <!-- Status Banner -->
            <div style="background-color: {$statusColor}; color: #ffffff; padding: 15px 20px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                {$statusText}
            </div>

            <!-- Charter Info -->
            <div style="background-color: #ffffff; border: 2px solid #1e3a5f; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: bold; color: #1e3a5f; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">ΣΤΟΙΧΕΙΑ ΝΑΥΛΟΥ</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="120" style="font-weight: bold; color: #374151; padding: 6px 0;">ΚΩΔΙΚΟΣ:</td>
                        <td style="color: #111827; padding: 6px 0;">{$code}/{$year}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #374151; padding: 6px 0;">ΣΚΑΦΟΣ:</td>
                        <td style="color: #111827; padding: 6px 0;">{$boatName}</td>
                    </tr>
                </table>
            </div>

            <!-- Period -->
            <div style="background-color: #ffffff; border: 2px solid #1e3a5f; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <div style="font-size: 14px; font-weight: bold; color: #1e3a5f; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">ΠΕΡΙΟΔΟΣ ΝΑΥΛΟΥ</div>
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="120" style="font-weight: bold; color: #374151; padding: 6px 0;">CHECK-IN:</td>
                        <td style="color: #111827; padding: 6px 0;">{$startDate} - ALIMOS MARINA</td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #374151; padding: 6px 0;">CHECK-OUT:</td>
                        <td style="color: #111827; padding: 6px 0;">{$endDate} - ALIMOS MARINA</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Footer -->
        <div style="padding: 25px 30px; text-align: center; background-color: #ffffff; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 15px; color: #374151; margin-bottom: 20px;">{$footerMessage}</p>
            <p style="font-size: 18px; color: #1e3a5f; font-weight: bold; margin-bottom: 5px;">Ευχαριστούμε πολύ!</p>
            <p style="font-size: 14px; color: #6b7280;">TAILWIND YACHTING</p>
        </div>

        <!-- Page Footer -->
        <div style="background-color: #f9fafb; padding: 15px 30px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
            Generated: <?php echo date('d/m/Y H:i'); ?><br>
            Charter Code: {$code}/{$year}
        </div>
    </div>
</body>
</html>
HTML;
}

// Email headers
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: TAILWIND YACHTING <info@tailwindyachting.com>\r\n";
$headers .= "Reply-To: info@tailwindyachting.com\r\n";

// Send email
$success = mail($recipients, $subject, $html, $headers);

if ($success) {
    echo json_encode([
        'success' => true,
        'message' => 'Email sent successfully',
        'recipients' => $recipients
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to send email'
    ]);
}
?>
