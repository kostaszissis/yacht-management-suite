<?php
/**
 * ONE-TIME SCRIPT - Create Chat Database Tables
 * =============================================
 * Run this script once via browser to create tables.
 * DELETE THIS FILE IMMEDIATELY AFTER RUNNING!
 *
 * Usage: Upload to server and visit in browser
 * Example: https://yachtmanagementsuite.com/api/create-chat-tables.php
 */

header('Content-Type: text/html; charset=utf-8');

$host = 'localhost';
$dbname = 'yacht_management';
$username = 'root';
$password = 'Yacht2024!';

echo "<h2>Chat Tables Setup Script</h2>";
echo "<hr>";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p style='color:green'>✅ Database connection successful</p>";

    // Create chats table
    $sql1 = "CREATE TABLE IF NOT EXISTS chats (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql1);
    echo "<p style='color:green'>✅ Table 'chats' created successfully</p>";

    // Create chat_messages table
    $sql2 = "CREATE TABLE IF NOT EXISTS chat_messages (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql2);
    echo "<p style='color:green'>✅ Table 'chat_messages' created successfully</p>";

    echo "<hr>";
    echo "<h3 style='color:green'>ALL DONE!</h3>";
    echo "<p><strong style='color:red'>IMPORTANT: Delete this file from the server NOW!</strong></p>";
    echo "<p>File to delete: <code>create-chat-tables.php</code></p>";

} catch(PDOException $e) {
    echo "<p style='color:red'>❌ Database Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Check your database credentials and try again.</p>";
}
?>
