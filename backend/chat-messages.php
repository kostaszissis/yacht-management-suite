<?php
/**
 * Chat Messages API
 * =====================================================
 * Handles chat messages for yacht check-in system
 * Deploy to: https://yachtmanagementsuite.com/api/chat-messages.php
 *
 * Database Table: chat_messages
 * CREATE TABLE chat_messages (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   chat_id VARCHAR(100) NOT NULL,
 *   booking_code VARCHAR(100) NOT NULL,
 *   vessel_name VARCHAR(255),
 *   customer_name VARCHAR(255),
 *   sender_id VARCHAR(50) NOT NULL,
 *   sender_name VARCHAR(255) NOT NULL,
 *   sender_role ENUM('CUSTOMER', 'TECHNICAL', 'FINANCIAL', 'BOOKING', 'ADMIN') NOT NULL,
 *   recipient_role ENUM('TECHNICAL', 'FINANCIAL', 'BOOKING', 'ADMIN') NOT NULL,
 *   category ENUM('TECHNICAL', 'FINANCIAL', 'BOOKING') NOT NULL,
 *   message TEXT NOT NULL,
 *   timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
 *   read_status TINYINT(1) DEFAULT 0,
 *   is_visitor TINYINT(1) DEFAULT 0,
 *   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 *   INDEX idx_chat_id (chat_id),
 *   INDEX idx_booking_code (booking_code),
 *   INDEX idx_recipient_role (recipient_role),
 *   INDEX idx_category (category)
 * );
 *
 * CREATE TABLE chats (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   chat_id VARCHAR(100) UNIQUE NOT NULL,
 *   booking_code VARCHAR(100) NOT NULL,
 *   vessel_name VARCHAR(255),
 *   customer_name VARCHAR(255),
 *   category ENUM('TECHNICAL', 'FINANCIAL', 'BOOKING') NOT NULL,
 *   status ENUM('ACTIVE', 'CLOSED') DEFAULT 'ACTIVE',
 *   is_visitor TINYINT(1) DEFAULT 0,
 *   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 *   last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 *   INDEX idx_booking_code (booking_code),
 *   INDEX idx_category (category),
 *   INDEX idx_status (status)
 * );
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection - adjust credentials for your server
$host = 'localhost';
$dbname = 'yacht_management';
$username = 'your_username';
$password = 'your_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

// Auto-create tables if they don't exist
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id VARCHAR(100) UNIQUE NOT NULL,
        booking_code VARCHAR(100) NOT NULL,
        vessel_name VARCHAR(255) DEFAULT NULL,
        customer_name VARCHAR(255) DEFAULT NULL,
        category ENUM('TECHNICAL', 'FINANCIAL', 'BOOKING') NOT NULL DEFAULT 'BOOKING',
        status ENUM('ACTIVE', 'CLOSED') DEFAULT 'ACTIVE',
        is_visitor TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_booking_code (booking_code),
        INDEX idx_category (category),
        INDEX idx_status (status),
        INDEX idx_is_visitor (is_visitor)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id VARCHAR(100) NOT NULL,
        booking_code VARCHAR(100) NOT NULL,
        vessel_name VARCHAR(255) DEFAULT NULL,
        customer_name VARCHAR(255) DEFAULT NULL,
        sender_id VARCHAR(100) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role ENUM('CUSTOMER', 'TECHNICAL', 'FINANCIAL', 'BOOKING', 'ADMIN') NOT NULL,
        recipient_role ENUM('TECHNICAL', 'FINANCIAL', 'BOOKING', 'ADMIN') NOT NULL,
        category ENUM('TECHNICAL', 'FINANCIAL', 'BOOKING') NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_status TINYINT(1) DEFAULT 0,
        is_visitor TINYINT(1) DEFAULT 0,
        INDEX idx_chat_id (chat_id),
        INDEX idx_booking_code (booking_code),
        INDEX idx_recipient_role (recipient_role),
        INDEX idx_category (category),
        INDEX idx_read_status (read_status),
        INDEX idx_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch(PDOException $e) {
    // Tables already exist or creation failed - continue anyway
}

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'GET':
        handleGet($pdo, $path);
        break;
    case 'POST':
        handlePost($pdo, $path);
        break;
    case 'PUT':
        handlePut($pdo, $path);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

// =====================================================
// GET HANDLERS
// =====================================================
function handleGet($pdo, $path) {
    switch ($path) {
        case 'chats':
            getChats($pdo);
            break;
        case 'messages':
            getMessages($pdo);
            break;
        case 'unread':
            getUnreadCount($pdo);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

// Get all chats (with filters)
function getChats($pdo) {
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $bookingCode = isset($_GET['booking_code']) ? $_GET['booking_code'] : null;
    $recipientRole = isset($_GET['recipient_role']) ? $_GET['recipient_role'] : null;
    $status = isset($_GET['status']) ? $_GET['status'] : 'ACTIVE';

    $sql = "SELECT c.*,
            (SELECT COUNT(*) FROM chat_messages m WHERE m.chat_id = c.chat_id AND m.read_status = 0 AND m.sender_role = 'CUSTOMER') as unread_count,
            (SELECT message FROM chat_messages m WHERE m.chat_id = c.chat_id ORDER BY m.timestamp DESC LIMIT 1) as last_message
            FROM chats c WHERE 1=1";
    $params = [];

    if ($category && $category !== 'ALL') {
        $sql .= " AND c.category = ?";
        $params[] = $category;
    }

    if ($bookingCode) {
        $sql .= " AND c.booking_code = ?";
        $params[] = $bookingCode;
    }

    if ($recipientRole) {
        $sql .= " AND EXISTS (SELECT 1 FROM chat_messages m WHERE m.chat_id = c.chat_id AND m.recipient_role = ?)";
        $params[] = $recipientRole;
    }

    if ($status) {
        $sql .= " AND c.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY c.last_message_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get messages for each chat
    foreach ($chats as &$chat) {
        $msgStmt = $pdo->prepare("SELECT * FROM chat_messages WHERE chat_id = ? ORDER BY timestamp ASC");
        $msgStmt->execute([$chat['chat_id']]);
        $chat['messages'] = $msgStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(['success' => true, 'chats' => $chats]);
}

// Get messages for a specific chat
function getMessages($pdo) {
    $chatId = isset($_GET['chat_id']) ? $_GET['chat_id'] : null;
    $since = isset($_GET['since']) ? $_GET['since'] : null;

    if (!$chatId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'chat_id required']);
        return;
    }

    $sql = "SELECT * FROM chat_messages WHERE chat_id = ?";
    $params = [$chatId];

    if ($since) {
        $sql .= " AND timestamp > ?";
        $params[] = $since;
    }

    $sql .= " ORDER BY timestamp ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'messages' => $messages]);
}

// Get unread count
function getUnreadCount($pdo) {
    $bookingCode = isset($_GET['booking_code']) ? $_GET['booking_code'] : null;
    $role = isset($_GET['role']) ? $_GET['role'] : null;

    $sql = "SELECT COUNT(*) as count FROM chat_messages WHERE read_status = 0";
    $params = [];

    if ($bookingCode) {
        $sql .= " AND booking_code = ? AND sender_role != 'CUSTOMER'";
        $params[] = $bookingCode;
    } elseif ($role) {
        $sql .= " AND recipient_role = ? AND sender_role = 'CUSTOMER'";
        $params[] = $role;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'unread_count' => (int)$result['count']]);
}

// =====================================================
// POST HANDLERS
// =====================================================
function handlePost($pdo, $path) {
    $data = json_decode(file_get_contents('php://input'), true);

    switch ($path) {
        case 'chat':
            createChat($pdo, $data);
            break;
        case 'message':
            sendMessage($pdo, $data);
            break;
        case 'mark-read':
            markAsRead($pdo, $data);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

// Create new chat
function createChat($pdo, $data) {
    $chatId = $data['chat_id'] ?? 'chat-' . time() . '-' . bin2hex(random_bytes(4));
    $bookingCode = $data['booking_code'] ?? '';
    $vesselName = $data['vessel_name'] ?? '';
    $customerName = $data['customer_name'] ?? 'Guest';
    $category = $data['category'] ?? 'BOOKING';
    $isVisitor = $data['is_visitor'] ?? 0;

    // Check if chat already exists
    $stmt = $pdo->prepare("SELECT * FROM chats WHERE booking_code = ? AND category = ?");
    $stmt->execute([$bookingCode, $category]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        echo json_encode(['success' => true, 'chat' => $existing, 'existing' => true]);
        return;
    }

    // Create new chat
    $stmt = $pdo->prepare("INSERT INTO chats (chat_id, booking_code, vessel_name, customer_name, category, is_visitor, status, created_at, last_message_at) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW())");
    $stmt->execute([$chatId, $bookingCode, $vesselName, $customerName, $category, $isVisitor]);

    $chat = [
        'id' => $pdo->lastInsertId(),
        'chat_id' => $chatId,
        'booking_code' => $bookingCode,
        'vessel_name' => $vesselName,
        'customer_name' => $customerName,
        'category' => $category,
        'is_visitor' => $isVisitor,
        'status' => 'ACTIVE',
        'messages' => [],
        'unread_count' => 0
    ];

    echo json_encode(['success' => true, 'chat' => $chat, 'existing' => false]);
}

// Send message
function sendMessage($pdo, $data) {
    $chatId = $data['chat_id'] ?? '';
    $bookingCode = $data['booking_code'] ?? '';
    $vesselName = $data['vessel_name'] ?? '';
    $customerName = $data['customer_name'] ?? '';
    $senderId = $data['sender_id'] ?? '';
    $senderName = $data['sender_name'] ?? '';
    $senderRole = $data['sender_role'] ?? 'CUSTOMER';
    $recipientRole = $data['recipient_role'] ?? 'BOOKING';
    $category = $data['category'] ?? 'BOOKING';
    $message = $data['message'] ?? '';
    $isVisitor = $data['is_visitor'] ?? 0;

    if (!$chatId || !$message) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'chat_id and message required']);
        return;
    }

    // Insert message
    $stmt = $pdo->prepare("INSERT INTO chat_messages (chat_id, booking_code, vessel_name, customer_name, sender_id, sender_name, sender_role, recipient_role, category, message, is_visitor, timestamp, read_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)");
    $stmt->execute([$chatId, $bookingCode, $vesselName, $customerName, $senderId, $senderName, $senderRole, $recipientRole, $category, $message, $isVisitor]);

    $messageId = $pdo->lastInsertId();

    // Update chat last_message_at
    $stmt = $pdo->prepare("UPDATE chats SET last_message_at = NOW() WHERE chat_id = ?");
    $stmt->execute([$chatId]);

    // Get the inserted message
    $stmt = $pdo->prepare("SELECT * FROM chat_messages WHERE id = ?");
    $stmt->execute([$messageId]);
    $newMessage = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'message' => $newMessage]);
}

// Mark messages as read
function markAsRead($pdo, $data) {
    $chatId = $data['chat_id'] ?? '';
    $reader = $data['reader'] ?? '';

    if (!$chatId || !$reader) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'chat_id and reader required']);
        return;
    }

    // If reader is CUSTOMER, mark all non-customer messages as read
    // If reader is staff, mark all customer messages as read
    if ($reader === 'CUSTOMER') {
        $stmt = $pdo->prepare("UPDATE chat_messages SET read_status = 1 WHERE chat_id = ? AND sender_role != 'CUSTOMER'");
    } else {
        $stmt = $pdo->prepare("UPDATE chat_messages SET read_status = 1 WHERE chat_id = ? AND sender_role = 'CUSTOMER'");
    }

    $stmt->execute([$chatId]);

    echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);
}

// =====================================================
// PUT HANDLERS
// =====================================================
function handlePut($pdo, $path) {
    $data = json_decode(file_get_contents('php://input'), true);

    switch ($path) {
        case 'chat-status':
            updateChatStatus($pdo, $data);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
}

// Update chat status (ACTIVE/CLOSED)
function updateChatStatus($pdo, $data) {
    $chatId = $data['chat_id'] ?? '';
    $status = $data['status'] ?? 'ACTIVE';

    if (!$chatId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'chat_id required']);
        return;
    }

    $stmt = $pdo->prepare("UPDATE chats SET status = ? WHERE chat_id = ?");
    $stmt->execute([$status, $chatId]);

    echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);
}
?>
