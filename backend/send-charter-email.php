<?php
/**
 * Charter Email API - Send Charter Emails
 * =========================================
 * This endpoint sends emails using the FRONTEND-PROVIDED text.
 * It does NOT generate its own email body - it trusts the frontend.
 *
 * Deploy to: https://yachtmanagementsuite.com/email/send-charter-email
 * Replace the existing endpoint or deploy as new.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get JSON body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

// Extract email fields
$to = $data['to'] ?? [];
$subject = $data['subject'] ?? 'Charter Notification';
$text = $data['text'] ?? '';

// Handle recipients - can be array or string
if (is_array($to)) {
    $recipients = implode(', ', $to);
} else {
    $recipients = $to;
}

// Validate
if (empty($recipients)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No recipients']);
    exit();
}

if (empty($text)) {
    // If no text provided, generate minimal body from legacy fields
    $action = $data['action'] ?? 'notification';
    $code = $data['code'] ?? '';
    $boatName = $data['boatName'] ?? '';
    $startDate = $data['startDate'] ?? '';
    $endDate = $data['endDate'] ?? '';

    // Map action to Greek status
    switch ($action) {
        case 'option_accepted':
            $status = 'ΕΠΙΒΕΒΑΙΩΘΗΚΕ (OPTION)';
            break;
        case 'reservation':
        case 'confirmed':
            $status = 'ΟΡΙΣΤΙΚΟΠΟΙΗΘΗΚΕ';
            break;
        case 'cancelled':
        case 'rejected':
            $status = 'ΑΚΥΡΩΘΗΚΕ';
            break;
        default:
            $status = strtoupper($action);
    }

    $text = "TAILWIND YACHTING - CHARTER NOTIFICATION\n\n";
    $text .= "CHARTER: $code\n";
    $text .= "BOAT: $boatName\n";
    $text .= "FROM: $startDate\n";
    $text .= "TILL: $endDate\n\n";
    $text .= "Status: $status\n\n";
    $text .= "Tailwind Yachting";
}

// Convert plain text to HTML (preserve line breaks)
$html = '<pre style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">'
      . htmlspecialchars($text)
      . '</pre>';

// SMTP Configuration - UPDATE THESE!
$smtpHost = 'smtp.gmail.com';
$smtpPort = 587;
$smtpUser = 'your-email@gmail.com';
$smtpPass = 'your-app-password';
$fromEmail = 'noreply@tailwindyachting.com';
$fromName = 'Tailwind Yachting';

// Log the email being sent
error_log("📧 Sending charter email:");
error_log("📧 To: $recipients");
error_log("📧 Subject: $subject");
error_log("📧 Action: " . ($data['action'] ?? 'none'));

// Try to send using PHP's mail() or use PHPMailer if available
try {
    // Using mail() function (simplest approach)
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: $fromName <$fromEmail>\r\n";
    $headers .= "Reply-To: $fromEmail\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $mailSent = mail($recipients, $subject, $html, $headers);

    if ($mailSent) {
        echo json_encode([
            'success' => true,
            'message' => 'Email sent successfully',
            'to' => $recipients,
            'subject' => $subject
        ]);
    } else {
        error_log("📧 mail() failed");
        echo json_encode([
            'success' => false,
            'error' => 'Failed to send email',
            'debug' => 'mail() returned false'
        ]);
    }
} catch (Exception $e) {
    error_log("📧 Exception: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
