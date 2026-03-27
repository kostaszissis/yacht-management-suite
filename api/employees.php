<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = 'localhost';
$dbname = 'yachtdb';
$user = 'yachtadmin';
$password = 'YachtDB2024!';

try {
    $pdo = new PDO("pgsql:host=$host;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // GET /api/employees.php — return all employees
        // GET /api/employees.php?code=XXX — login check
        if (isset($_GET['code'])) {
            $stmt = $pdo->prepare("SELECT * FROM employee_codes WHERE code = $1 AND enabled = true");
            $stmt = $pdo->prepare("SELECT * FROM employee_codes WHERE code = :code AND enabled = true");
            $stmt->execute(['code' => $_GET['code']]);
            $emp = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($emp) {
                $emp['permissions'] = json_decode($emp['permissions'], true);
                echo json_encode(['success' => true, 'employee' => $emp]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Invalid code or disabled']);
            }
        } else {
            $stmt = $pdo->query("SELECT * FROM employee_codes ORDER BY id");
            $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($employees as &$emp) {
                $emp['permissions'] = json_decode($emp['permissions'], true);
            }
            echo json_encode(['success' => true, 'employees' => $employees]);
        }
        break;

    case 'POST':
        // Add new employee
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['code']) || !isset($data['name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing code or name']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("INSERT INTO employee_codes (code, name, role, permissions, enabled) VALUES (:code, :name, :role, :permissions, :enabled)");
            $stmt->execute([
                'code' => $data['code'],
                'name' => $data['name'],
                'role' => $data['role'] ?? 'TECHNICAL',
                'permissions' => json_encode($data['permissions'] ?? []),
                'enabled' => isset($data['enabled']) ? ($data['enabled'] ? 'true' : 'false') : 'true'
            ]);
            echo json_encode(['success' => true, 'message' => 'Employee added']);
        } catch (PDOException $e) {
            http_response_code(409);
            echo json_encode(['error' => 'Code already exists']);
        }
        break;

    case 'PUT':
        // Update employee
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['code'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing code']);
            exit;
        }
        $fields = [];
        $params = ['code' => $data['code']];
        
        if (isset($data['name'])) { $fields[] = "name = :name"; $params['name'] = $data['name']; }
        if (isset($data['role'])) { $fields[] = "role = :role"; $params['role'] = $data['role']; }
        if (isset($data['permissions'])) { $fields[] = "permissions = :permissions"; $params['permissions'] = json_encode($data['permissions']); }
        if (isset($data['enabled'])) { $fields[] = "enabled = :enabled"; $params['enabled'] = $data['enabled'] ? 'true' : 'false'; }
        if (isset($data['newCode'])) { $fields[] = "code = :newCode"; $params['newCode'] = $data['newCode']; }
        
        $fields[] = "updated_at = NOW()";
        
        $sql = "UPDATE employee_codes SET " . implode(', ', $fields) . " WHERE code = :code";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'message' => 'Employee updated']);
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['code'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing code']);
            exit;
        }
        if ($data['code'] === 'ADMIN2025') {
            http_response_code(403);
            echo json_encode(['error' => 'Cannot delete admin']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM employee_codes WHERE code = :code");
        $stmt->execute(['code' => $data['code']]);
        echo json_encode(['success' => true, 'message' => 'Employee deleted']);
        break;
}
?>
