<?php
/**
 * Vessels API Endpoint
 * Returns all vessels (hardcoded for now, can be moved to database later)
 */

// CORS headers for API access
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hardcoded vessels list (matching INITIAL_FLEET in FleetManagement.tsx)
$vessels = [
    ['id' => 8, 'name' => 'Bob', 'type' => 'Catamaran', 'model' => 'Lagoon 42'],
    ['id' => 7, 'name' => 'Perla', 'type' => 'Catamaran', 'model' => 'Lagoon 46'],
    ['id' => 6, 'name' => 'Infinity', 'type' => 'Catamaran', 'model' => 'Bali 4.2'],
    ['id' => 1, 'name' => 'Maria 1', 'type' => 'Monohull', 'model' => 'Jeanneau Sun Odyssey 449'],
    ['id' => 2, 'name' => 'Maria 2', 'type' => 'Monohull', 'model' => 'Jeanneau yacht 54'],
    ['id' => 4, 'name' => 'Bar Bar', 'type' => 'Monohull', 'model' => 'Beneteau Oceanis 46.1'],
    ['id' => 5, 'name' => 'Kalispera', 'type' => 'Monohull', 'model' => 'Bavaria c42 Cruiser'],
    ['id' => 3, 'name' => 'Valesia', 'type' => 'Monohull', 'model' => 'Bavaria c42 Cruiser'],
];

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Return all vessels
        echo json_encode([
            'success' => true,
            'vessels' => $vessels,
            'count' => count($vessels)
        ]);
        break;

    case 'POST':
        // For future: add vessel to database
        echo json_encode([
            'success' => false,
            'error' => 'Adding vessels not yet implemented - vessels are hardcoded'
        ]);
        break;

    case 'PUT':
        // For future: update vessel in database
        echo json_encode([
            'success' => false,
            'error' => 'Updating vessels not yet implemented - vessels are hardcoded'
        ]);
        break;

    case 'DELETE':
        // For future: delete vessel from database
        echo json_encode([
            'success' => false,
            'error' => 'Deleting vessels not yet implemented - vessels are hardcoded'
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
?>
