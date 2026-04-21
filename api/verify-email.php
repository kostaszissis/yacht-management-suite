<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$dbname = 'yachtdb';
$username = 'yachtadmin';
$password = 'YachtDB2024!';
try {
    $dsn = "pgsql:host=$host;dbname=$dbname";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'DB connection failed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {

    case 'send_code':
        $email = strtolower(trim($input['email'] ?? ''));
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'error' => 'Invalid email']);
            exit();
        }
        $code = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        
        $stmt = $pdo->prepare("DELETE FROM gdpr_consents WHERE email = :email AND verified_at IS NULL");
        $stmt->execute(['email' => $email]);
        
        $stmt = $pdo->prepare("INSERT INTO gdpr_consents (email, verification_code, ip_address, user_agent) VALUES (:email, :code, :ip, :ua)");
        $stmt->execute([
            'email' => $email,
            'code' => $code,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
            'ua' => $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
        
        $htmlBody = '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;text-align:center">'
            . '<div style="background:linear-gradient(135deg,#0ea5e9,#1e40af);color:white;padding:30px;border-radius:12px 12px 0 0">'
            . '<h1 style="margin:0">&#x26F5; Tailwind Yachting</h1></div>'
            . '<div style="padding:30px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">'
            . '<p style="font-size:18px">Your verification code is:</p>'
            . '<div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af;margin:20px 0">' . $code . '</div>'
            . '<p style="color:#64748b">Enter this code to access the app.</p>'
            . '</div></div>';
        
        $emailData = json_encode([
            'to' => $email,
            'subject' => 'Your Verification Code - Tailwind Yachting',
            'html' => $htmlBody
        ]);
        
        $ch = curl_init('http://localhost:3001/send-email');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $emailData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        curl_close($ch);
        
        echo json_encode(['success' => true, 'message' => 'Code sent']);
        break;

    case 'verify_code':
        $email = strtolower(trim($input['email'] ?? ''));
        $code = trim($input['code'] ?? '');
        
        $stmt = $pdo->prepare("SELECT id FROM gdpr_consents WHERE email = :email AND verification_code = :code AND verified_at IS NULL AND created_at > NOW() - INTERVAL '15 minutes' ORDER BY created_at DESC LIMIT 1");
        $stmt->execute(['email' => $email, 'code' => $code]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            $stmt = $pdo->prepare("UPDATE gdpr_consents SET verified_at = NOW() WHERE id = :id");
            $stmt->execute(['id' => $row['id']]);
            echo json_encode(['success' => true, 'verified' => true, 'consent_id' => $row['id']]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid or expired code']);
        }
        break;

    case 'save_gdpr':
    case 'save_consent':
        $consentId = $input['consent_id'] ?? '';
        $fullName = trim($input['full_name'] ?? '');
        $language = $input['language'] ?? 'en';
        $signatureData = $input['signature_data'] ?? '';
        $bookingNumber = $input['booking_number'] ?? '';
        
        $stmt = $pdo->prepare("UPDATE gdpr_consents SET full_name = :name, language = :lang, gdpr_consent_1 = NOW(), gdpr_consent_2 = NOW(), gdpr_consent_3 = NOW(), signature_data = :sig, booking_number = :bn WHERE id = :id AND verified_at IS NOT NULL");
        $stmt->execute([
            'name' => $fullName,
            'lang' => $language,
            'sig' => $signatureData,
            'bn' => $bookingNumber,
            'id' => $consentId
        ]);
        
        echo json_encode(['success' => true, 'message' => 'GDPR consent saved']);
        break;

    case 'update_booking':
        $email = strtolower(trim($input['email'] ?? ''));
        $bn = trim($input['booking_number'] ?? '');
        $stmt = $pdo->prepare("UPDATE gdpr_consents SET booking_number = :bn WHERE id = (SELECT id FROM gdpr_consents WHERE email = :email AND gdpr_consent_1 IS NOT NULL ORDER BY created_at DESC LIMIT 1)");
        $stmt->execute(['bn' => $bn, 'email' => $email]);
        echo json_encode(['success' => true]);
        break;

    case 'check_booking':
        $bn = trim($input['booking_number'] ?? '');
        $stmt = $pdo->prepare("SELECT gc.email, gc.gdpr_consent_1 FROM gdpr_consents gc WHERE gc.booking_number = :bn AND gc.gdpr_consent_1 IS NOT NULL ORDER BY gc.created_at DESC LIMIT 1");
        $stmt->execute(['bn' => $bn]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            echo json_encode(['success' => true, 'has_gdpr' => true]);
        } else {
            echo json_encode(['success' => true, 'has_gdpr' => false]);
        }
        break;

    case 'check_gdpr':
        $email = strtolower(trim($input['email'] ?? $_GET['email'] ?? ''));
        
        $stmt = $pdo->prepare("SELECT id, email, full_name, gdpr_consent_1, gdpr_consent_2, gdpr_consent_3 FROM gdpr_consents WHERE email = :email AND gdpr_consent_1 IS NOT NULL ORDER BY created_at DESC LIMIT 1");
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            echo json_encode(['success' => true, 'has_gdpr' => true, 'data' => $row]);
        } else {
            echo json_encode(['success' => true, 'has_gdpr' => false]);
        }
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
}
?>