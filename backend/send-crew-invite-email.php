<?php
function crewInviteStrings($lang) {
    static $cache = null;
    if ($cache === null) {
        $path = __DIR__ . '/crew_invite_translations.json';
        $cache = file_exists($path) ? (json_decode(file_get_contents($path), true) ?: []) : [];
    }
    return $cache[$lang] ?? ($cache['en'] ?? []);
}

function sendViaEmailServer($to, $subject, $html) {
    $payload = json_encode(['to' => $to, 'subject' => $subject, 'html' => $html]);
    $ch = curl_init('http://localhost:3001/send-email');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $httpCode === 200;
}

function sendInvitationEmail($inv) {
    $lang = $inv['charterer_language'] ?? 'en';
    $s = crewInviteStrings($lang);
    $to = $inv['invite_email'];
    $name = trim(($inv['invite_first_name'] ?? '') . ' ' . ($inv['invite_last_name'] ?? ''));
    $link = 'https://yachtmanagementsuite.com/crew-invite/' . $inv['token'];
    $booking = htmlspecialchars($inv['booking_number']);
    $role = htmlspecialchars($inv['role'] ?? 'crew');

    $subjectText = $s['subject'] ?? 'Crew/Skipper Information Request - Tailwind Yachting';

    $html = '<html><body style="font-family:Arial,sans-serif;background:#f3f4f6;padding:20px;">';
    $html .= '<div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">';
    $html .= '<div style="text-align:center;margin-bottom:20px;"><h1 style="color:#0c4a6e;margin:0;">Tailwind Yachting</h1></div>';
    $html .= '<h2>' . htmlspecialchars($s['greeting'] ?? 'Dear') . ' ' . htmlspecialchars($name) . ',</h2>';
    $html .= '<p>' . htmlspecialchars($s['intro'] ?? '') . '</p>';
    $html .= '<p><strong>Booking:</strong> ' . $booking . '<br><strong>Role:</strong> ' . $role . '</p>';
    $html .= '<div style="text-align:center;margin:30px 0;"><a href="' . $link . '" style="display:inline-block;background:linear-gradient(135deg,#0c4a6e,#0ea5e9);color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;">' . htmlspecialchars($s['cta'] ?? 'Complete Your Details') . '</a></div>';
    $html .= '<p style="color:#64748b;font-size:13px;">' . htmlspecialchars($s['expiry'] ?? '') . '</p>';
    $html .= '<p style="color:#64748b;font-size:12px;word-break:break-all;">' . $link . '</p>';
    $html .= '<hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb;">';
    $html .= '<p style="color:#64748b;font-size:12px;text-align:center;">Tailwind Yachting | info@tailwindyachting.com</p>';
    $html .= '</div></body></html>';

    return sendViaEmailServer($to, $subjectText, $html);
}

function sendCrewSubmissionEmails($inv, $values, $sig) {
    $lang = $inv['charterer_language'] ?? 'en';
    $s = crewInviteStrings($lang);

    $subj1 = $s['thanks_subject'] ?? 'Thank you - details received';
    $html1 = '<html><body style="font-family:Arial,sans-serif;padding:20px;">';
    $html1 .= '<div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:30px;border:1px solid #e5e7eb;">';
    $html1 .= '<h1 style="color:#0c4a6e;">Tailwind Yachting</h1>';
    $html1 .= '<p>' . htmlspecialchars($s['greeting'] ?? 'Dear') . ' ' . htmlspecialchars($values['first_name']) . ',</p>';
    $html1 .= '<p>' . htmlspecialchars($s['thanks_body'] ?? 'Thank you.') . '</p>';
    $html1 .= '<p><strong>Booking:</strong> ' . htmlspecialchars($inv['booking_number']) . '</p>';
    $html1 .= '</div></body></html>';
    sendViaEmailServer($values['email'], $subj1, $html1);

    $subj2 = 'Crew Form Submitted - ' . $inv['booking_number'];
    $html2 = '<html><body style="font-family:Arial,sans-serif;padding:20px;">';
    $html2 .= '<h2>Crew/Skipper Form Submitted</h2>';
    $html2 .= '<p><strong>Booking:</strong> ' . htmlspecialchars($inv['booking_number']) . '<br>';
    $html2 .= '<strong>Role:</strong> ' . htmlspecialchars($inv['role']) . '<br>';
    $html2 .= '<strong>Language:</strong> ' . htmlspecialchars($lang) . '<br>';
    $html2 .= '<strong>Submitted at:</strong> ' . date('Y-m-d H:i:s') . '</p>';
    $html2 .= '<h3>Submitted Data</h3>';
    $html2 .= '<table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;font-size:13px;">';
    $rows = [['First Name', $values['first_name']], ['Last Name', $values['last_name']], ['Address', $values['address']], ['Email', $values['email']], ['Phone', $values['phone']], ['Passport', $values['passport']], ['Date of Birth', $values['date_of_birth']], ['Nationality', $values['nationality']]];
    foreach ($rows as $r) {
        $html2 .= '<tr><td><strong>' . htmlspecialchars($r[0]) . '</strong></td><td>' . htmlspecialchars($r[1]) . '</td></tr>';
    }
    $html2 .= '</table><p>Signature stored in database.</p></body></html>';
    sendViaEmailServer('info@tailwindyachting.com', $subj2, $html2);

    return true;
}

function sendCrewReminder($inv) {
    $lang = $inv['charterer_language'] ?? 'en';
    $s = crewInviteStrings($lang);
    $tmpInv = $inv;
    $tmpInv['_reminder_subject_override'] = $s['remind_subject'] ?? ($s['subject'] ?? '');
    return sendInvitationEmail($tmpInv);
}
