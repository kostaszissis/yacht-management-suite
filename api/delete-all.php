<?php
/**
 * Delete All API Endpoint
 * Deletes ALL records from specified database tables
 *
 * DANGER: This endpoint permanently deletes data!
 *
 * Supported types:
 * - bookings: Deletes from 'bookings' table (Ναύλοι)
 * - chats: Deletes from 'chats' and 'chat_messages' tables (Μηνύματα)
 * - page1, page2, page3, page4, page5: Deletes from respective page data tables
 *
 * Usage: POST /api/delete-all.php
 * Body: { "type": "bookings" }
 */

// CORS headers for API access
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. Use POST.'
    ]);
    exit();
}

// PostgreSQL connection settings
$host = 'localhost';
$dbname = 'yachtdb';
$username = 'yachtadmin';
$password = 'YachtDB2024!';

try {
    // Connect to PostgreSQL
    $dsn = "pgsql:host=$host;dbname=$dbname";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['type'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required field: type'
        ]);
        exit();
    }

    $type = strtolower(trim($input['type']));
    $deletedCount = 0;
    $deletedTables = [];

    // Begin transaction for data integrity
    $pdo->beginTransaction();

    switch ($type) {
        case 'bookings':
        case 'charters':
            // Delete all bookings (Ναύλοι)
            // First delete related page data to maintain referential integrity
            $tables = ['page1_data', 'page2_data', 'page3_data', 'page4_data', 'page5_data', 'bookings'];

            foreach ($tables as $table) {
                // Check if table exists
                $checkStmt = $pdo->prepare("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table)");
                $checkStmt->execute(['table' => $table]);
                $exists = $checkStmt->fetchColumn();

                if ($exists) {
                    $stmt = $pdo->prepare("DELETE FROM {$table}");
                    $stmt->execute();
                    $count = $stmt->rowCount();
                    $deletedCount += $count;
                    $deletedTables[] = "{$table}: {$count} records";
                }
            }
            break;

        case 'chats':
        case 'messages':
            // Delete all chat messages first (child records)
            $stmt = $pdo->prepare("DELETE FROM chat_messages");
            $stmt->execute();
            $msgCount = $stmt->rowCount();
            $deletedCount += $msgCount;
            $deletedTables[] = "chat_messages: {$msgCount} records";

            // Then delete all chats (parent records)
            $stmt = $pdo->prepare("DELETE FROM chats");
            $stmt->execute();
            $chatCount = $stmt->rowCount();
            $deletedCount += $chatCount;
            $deletedTables[] = "chats: {$chatCount} records";
            break;

        case 'page1':
            $stmt = $pdo->prepare("DELETE FROM page1_data");
            $stmt->execute();
            $deletedCount = $stmt->rowCount();
            $deletedTables[] = "page1_data: {$deletedCount} records";
            break;

        case 'page2':
            $stmt = $pdo->prepare("DELETE FROM page2_data");
            $stmt->execute();
            $deletedCount = $stmt->rowCount();
            $deletedTables[] = "page2_data: {$deletedCount} records";
            break;

        case 'page3':
            $stmt = $pdo->prepare("DELETE FROM page3_data");
            $stmt->execute();
            $deletedCount = $stmt->rowCount();
            $deletedTables[] = "page3_data: {$deletedCount} records";
            break;

        case 'page4':
            $stmt = $pdo->prepare("DELETE FROM page4_data");
            $stmt->execute();
            $deletedCount = $stmt->rowCount();
            $deletedTables[] = "page4_data: {$deletedCount} records";
            break;

        case 'page5':
            $stmt = $pdo->prepare("DELETE FROM page5_data");
            $stmt->execute();
            $deletedCount = $stmt->rowCount();
            $deletedTables[] = "page5_data: {$deletedCount} records";
            break;

        case 'all':
            // NUCLEAR OPTION: Delete everything
            $allTables = [
                'chat_messages', 'chats',
                'page1_data', 'page2_data', 'page3_data', 'page4_data', 'page5_data',
                'bookings'
            ];

            foreach ($allTables as $table) {
                $checkStmt = $pdo->prepare("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = :table)");
                $checkStmt->execute(['table' => $table]);
                $exists = $checkStmt->fetchColumn();

                if ($exists) {
                    $stmt = $pdo->prepare("DELETE FROM {$table}");
                    $stmt->execute();
                    $count = $stmt->rowCount();
                    $deletedCount += $count;
                    $deletedTables[] = "{$table}: {$count} records";
                }
            }
            break;

        default:
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => "Unknown type: {$type}. Supported types: bookings, chats, page1-5, all"
            ]);
            exit();
    }

    // Commit transaction
    $pdo->commit();

    // Log the deletion (you may want to add proper logging)
    error_log("[DELETE-ALL] Type: {$type}, Deleted: {$deletedCount} records, Tables: " . implode(', ', $deletedTables));

    echo json_encode([
        'success' => true,
        'message' => "Successfully deleted {$deletedCount} records",
        'type' => $type,
        'deleted_count' => $deletedCount,
        'details' => $deletedTables
    ]);

} catch (PDOException $e) {
    // Rollback on error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
