<?php
require_once __DIR__ . '/db_connect.php';

function ciResponse($success, $data = null, $error = null, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $success, 'data' => $data, 'error' => $error]);
    exit();
}

function generateToken() {
    return bin2hex(random_bytes(32));
}

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $action ?: ($input['action'] ?? '');

    if ($action === 'create') {
        $booking = trim($input['booking_number'] ?? '');
        $role = trim($input['role'] ?? 'crew');
        $firstName = trim($input['first_name'] ?? '');
        $lastName = trim($input['last_name'] ?? '');
        $email = trim($input['email'] ?? '');
        $lang = trim($input['language'] ?? 'en');
        if (!$booking || !$email) ciResponse(false, null, 'Missing booking_number or email', 400);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) ciResponse(false, null, 'Invalid email', 400);

        $token = generateToken();
        $stmt = $pdo->prepare('INSERT INTO crew_invitations (token, booking_number, role, invite_first_name, invite_last_name, invite_email, charterer_language) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, token, status, expires_at');
        $stmt->execute([$token, $booking, $role, $firstName, $lastName, $email, $lang]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        ciResponse(true, $row);
    }

    if ($action === 'submit') {
        $token = trim($input['token'] ?? '');
        if (!$token) ciResponse(false, null, 'Missing token', 400);
        $stmt = $pdo->prepare('SELECT * FROM crew_invitations WHERE token = ?');
        $stmt->execute([$token]);
        $inv = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$inv) ciResponse(false, null, 'Invalid token', 404);
        if ($inv['status'] === 'submitted') ciResponse(false, null, 'Already submitted', 409);
        if (strtotime($inv['expires_at']) < time()) ciResponse(false, null, 'Link expired', 410);

        $fields = ['first_name','last_name','address','email','phone','passport','date_of_birth','nationality'];
        $values = [];
        foreach ($fields as $f) {
            $values[$f] = trim($input[$f] ?? '');
        }
        $gdpr1 = !empty($input['gdpr_consent1']);
        $gdpr2 = !empty($input['gdpr_consent2']);
        $gdpr3 = !empty($input['gdpr_consent3']);
        $sig = $input['signature'] ?? '';
        if (!$values['first_name'] || !$values['last_name'] || !$values['email'] || !$sig) {
            ciResponse(false, null, 'Missing required fields', 400);
        }
        if (!$gdpr1 || !$gdpr2 || !$gdpr3) ciResponse(false, null, 'GDPR consent required', 400);

        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $stmt = $pdo->prepare('UPDATE crew_invitations SET status=?, submitted_at=NOW(), submitted_first_name=?, submitted_last_name=?, submitted_address=?, submitted_email=?, submitted_phone=?, submitted_passport=?, submitted_date_of_birth=?, submitted_nationality=?, gdpr_consent1=?, gdpr_consent2=?, gdpr_consent3=?, signature_data=?, submitter_ip=?, updated_at=NOW() WHERE token=?');
        $stmt->execute(['submitted', $values['first_name'], $values['last_name'], $values['address'], $values['email'], $values['phone'], $values['passport'], $values['date_of_birth'], $values['nationality'], $gdpr1, $gdpr2, $gdpr3, $sig, $ip, $token]);

        // Send emails async (via mail())
        require_once __DIR__ . '/../backend/send-crew-invite-email.php';
        @sendCrewSubmissionEmails($inv, $values, $sig);

        ciResponse(true, ['submitted' => true]);
    }

    if ($action === 'resend') {
        $token = trim($input['token'] ?? '');
        if (!$token) ciResponse(false, null, 'Missing token', 400);
        require_once __DIR__ . '/../backend/send-crew-invite-email.php';
        $stmt = $pdo->prepare('SELECT * FROM crew_invitations WHERE token = ?');
        $stmt->execute([$token]);
        $inv = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$inv) ciResponse(false, null, 'Invalid token', 404);
        @sendInvitationEmail($inv);
        $pdo->prepare('UPDATE crew_invitations SET sent_at=NOW() WHERE token=?')->execute([$token]);
        ciResponse(true, ['resent' => true]);
    }

    if ($action === 'delete') {
        $token = trim($input['token'] ?? '');
        if (!$token) ciResponse(false, null, 'Missing token', 400);
        $pdo->prepare('DELETE FROM crew_invitations WHERE token=? AND status != ?')->execute([$token, 'submitted']);
        ciResponse(true, ['deleted' => true]);
    }

    ciResponse(false, null, 'Unknown action', 400);
}

if ($method === 'GET') {
    if ($action === 'list') {
        $booking = trim($_GET['booking_number'] ?? '');
        if (!$booking) ciResponse(false, null, 'Missing booking_number', 400);
        $stmt = $pdo->prepare('SELECT id, token, booking_number, role, invite_first_name, invite_last_name, invite_email, charterer_language, status, sent_at, submitted_at, expires_at, submitted_first_name, submitted_last_name, submitted_address, submitted_email, submitted_phone, submitted_passport, submitted_date_of_birth, submitted_nationality , signature_data FROM crew_invitations WHERE booking_number = ? ORDER BY created_at DESC');
        $stmt->execute([$booking]);
        ciResponse(true, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($action === 'validate') {
        $token = trim($_GET['token'] ?? '');
        if (!$token) ciResponse(false, null, 'Missing token', 400);
        $stmt = $pdo->prepare('SELECT token, booking_number, role, invite_first_name, invite_last_name, invite_email, status, expires_at FROM crew_invitations WHERE token = ?');
        $stmt->execute([$token]);
        $inv = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$inv) ciResponse(false, null, 'Invalid token', 404);
        if (strtotime($inv['expires_at']) < time()) ciResponse(false, null, 'Link expired', 410);
        if ($inv['status'] === 'submitted') ciResponse(false, null, 'Already submitted', 409);
        // Also load booking context
        $bs = $pdo->prepare("SELECT booking_number, vessel_name, check_in_date, check_out_date FROM bookings WHERE booking_number = ?");
        try {
            $bs->execute([$inv['booking_number']]);
            $inv['booking'] = $bs->fetch(PDO::FETCH_ASSOC) ?: null;
        } catch (Exception $e) { $inv['booking'] = null; }
        ciResponse(true, $inv);
    }

    ciResponse(false, null, 'Unknown action', 400);
}

ciResponse(false, null, 'Method not allowed', 405);
