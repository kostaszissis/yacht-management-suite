<?php
/**
 * TASKS API - Εργασίες (Work Orders/Tasks)
 * Handles: task management per vessel
 */

require_once __DIR__ . '/db_connect.php';

// Auto-create tasks table if it doesn't exist
function ensureTasksTable($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        vessel_id INTEGER NOT NULL,
        vessel_name VARCHAR(255),
        task_code VARCHAR(100) UNIQUE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(50) DEFAULT 'general',
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(30) DEFAULT 'pending',
        assigned_to VARCHAR(255),
        due_date DATE,
        completed_at TIMESTAMP,
        completed_by VARCHAR(255),
        estimated_cost DECIMAL(10,2),
        actual_cost DECIMAL(10,2),
        notes TEXT,
        photos TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_tasks_vessel_id ON tasks(vessel_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)");
}

try {
    $pdo = getDbConnection();
    ensureTasksTable($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $input = getJsonInput();

    // Get task_code from various sources
    $taskCode = $_GET['task_code'] ?? $_GET['code'] ?? $_GET['id'] ?? null;
    if (!$taskCode && isset($_SERVER['PATH_INFO'])) {
        $taskCode = urldecode(trim($_SERVER['PATH_INFO'], '/'));
    }
    if (!$taskCode && $input) {
        $taskCode = $input['taskCode'] ?? $input['task_code'] ?? $input['code'] ?? $input['id'] ?? null;
    }

    switch ($method) {
        case 'GET':
            // If task_code provided, get single task
            if ($taskCode) {
                $stmt = $pdo->prepare("SELECT * FROM tasks WHERE task_code = :code OR id::text = :code");
                $stmt->execute(['code' => $taskCode]);
                $data = $stmt->fetch();

                if ($data) {
                    $result = convertKeysToCamel($data);
                    $result['photos'] = json_decode($data['photos'], true) ?? [];
                    successResponse(['task' => $result]);
                } else {
                    successResponse([
                        'task' => null,
                        'message' => 'No task found with this code'
                    ]);
                }
            } else {
                // Get all tasks with optional filters
                $vesselId = $_GET['vessel_id'] ?? $_GET['vesselId'] ?? null;
                $status = $_GET['status'] ?? null;
                $category = $_GET['category'] ?? null;
                $priority = $_GET['priority'] ?? null;

                $sql = "SELECT * FROM tasks WHERE 1=1";
                $params = [];

                if ($vesselId) {
                    $sql .= " AND vessel_id = :vessel_id";
                    $params['vessel_id'] = $vesselId;
                }
                if ($status) {
                    $sql .= " AND status = :status";
                    $params['status'] = $status;
                }
                if ($category) {
                    $sql .= " AND category = :category";
                    $params['category'] = $category;
                }
                if ($priority) {
                    $sql .= " AND priority = :priority";
                    $params['priority'] = $priority;
                }

                $sql .= " ORDER BY created_at DESC";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $tasks = $stmt->fetchAll();

                // Convert to camelCase and parse JSON
                $taskList = array_map(function($task) {
                    $result = convertKeysToCamel($task);
                    $result['photos'] = json_decode($task['photos'], true) ?? [];
                    return $result;
                }, $tasks);

                successResponse([
                    'tasks' => $taskList,
                    'count' => count($taskList)
                ]);
            }
            break;

        case 'POST':
            if (!$taskCode) {
                // Generate task code if not provided
                $taskCode = 'TASK-' . date('Ymd') . '-' . bin2hex(random_bytes(4));
            }

            // Check if task already exists
            $checkStmt = $pdo->prepare("SELECT id FROM tasks WHERE task_code = :code");
            $checkStmt->execute(['code' => $taskCode]);

            if ($checkStmt->fetch()) {
                errorResponse('Task already exists. Use PUT to update.', 409);
            }

            // Insert new task
            $stmt = $pdo->prepare("
                INSERT INTO tasks (
                    task_code, vessel_id, vessel_name,
                    title, description, category, priority, status,
                    assigned_to, due_date, estimated_cost,
                    notes, photos, created_by
                ) VALUES (
                    :task_code, :vessel_id, :vessel_name,
                    :title, :description, :category, :priority, :status,
                    :assigned_to, :due_date, :estimated_cost,
                    :notes, :photos, :created_by
                )
            ");

            $stmt->execute([
                'task_code' => $taskCode,
                'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                'title' => $input['title'] ?? 'Untitled Task',
                'description' => $input['description'] ?? null,
                'category' => $input['category'] ?? 'general',
                'priority' => $input['priority'] ?? 'medium',
                'status' => $input['status'] ?? 'pending',
                'assigned_to' => $input['assignedTo'] ?? $input['assigned_to'] ?? null,
                'due_date' => $input['dueDate'] ?? $input['due_date'] ?? null,
                'estimated_cost' => $input['estimatedCost'] ?? $input['estimated_cost'] ?? null,
                'notes' => $input['notes'] ?? null,
                'photos' => json_encode($input['photos'] ?? []),
                'created_by' => $input['createdBy'] ?? $input['created_by'] ?? null
            ]);

            successResponse([
                'task_code' => $taskCode,
                'id' => $pdo->lastInsertId()
            ], 'Task created successfully');
            break;

        case 'PUT':
            if (!$taskCode) {
                $taskCode = $input['taskCode'] ?? $input['task_code'] ?? $input['code'] ?? $input['id'] ?? null;
            }

            if (!$taskCode) {
                errorResponse('task_code is required', 400);
            }

            // Check if task exists
            $checkStmt = $pdo->prepare("SELECT id FROM tasks WHERE task_code = :code OR id::text = :code");
            $checkStmt->execute(['code' => $taskCode]);

            if (!$checkStmt->fetch()) {
                // Create new task if doesn't exist (upsert behavior)
                $newCode = is_numeric($taskCode) ? 'TASK-' . date('Ymd') . '-' . bin2hex(random_bytes(4)) : $taskCode;

                $stmt = $pdo->prepare("
                    INSERT INTO tasks (
                        task_code, vessel_id, vessel_name,
                        title, description, category, priority, status,
                        assigned_to, due_date, estimated_cost, actual_cost,
                        completed_at, completed_by, notes, photos, created_by
                    ) VALUES (
                        :task_code, :vessel_id, :vessel_name,
                        :title, :description, :category, :priority, :status,
                        :assigned_to, :due_date, :estimated_cost, :actual_cost,
                        :completed_at, :completed_by, :notes, :photos, :created_by
                    )
                ");

                $stmt->execute([
                    'task_code' => $newCode,
                    'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'title' => $input['title'] ?? 'Untitled Task',
                    'description' => $input['description'] ?? null,
                    'category' => $input['category'] ?? 'general',
                    'priority' => $input['priority'] ?? 'medium',
                    'status' => $input['status'] ?? 'pending',
                    'assigned_to' => $input['assignedTo'] ?? $input['assigned_to'] ?? null,
                    'due_date' => $input['dueDate'] ?? $input['due_date'] ?? null,
                    'estimated_cost' => $input['estimatedCost'] ?? $input['estimated_cost'] ?? null,
                    'actual_cost' => $input['actualCost'] ?? $input['actual_cost'] ?? null,
                    'completed_at' => $input['completedAt'] ?? $input['completed_at'] ?? null,
                    'completed_by' => $input['completedBy'] ?? $input['completed_by'] ?? null,
                    'notes' => $input['notes'] ?? null,
                    'photos' => json_encode($input['photos'] ?? []),
                    'created_by' => $input['createdBy'] ?? $input['created_by'] ?? null
                ]);

                successResponse(['task_code' => $newCode], 'Task created successfully');
            } else {
                // Update existing task
                $stmt = $pdo->prepare("
                    UPDATE tasks SET
                        vessel_id = COALESCE(:vessel_id, vessel_id),
                        vessel_name = COALESCE(:vessel_name, vessel_name),
                        title = COALESCE(:title, title),
                        description = COALESCE(:description, description),
                        category = COALESCE(:category, category),
                        priority = COALESCE(:priority, priority),
                        status = COALESCE(:status, status),
                        assigned_to = COALESCE(:assigned_to, assigned_to),
                        due_date = COALESCE(:due_date, due_date),
                        estimated_cost = COALESCE(:estimated_cost, estimated_cost),
                        actual_cost = COALESCE(:actual_cost, actual_cost),
                        completed_at = COALESCE(:completed_at, completed_at),
                        completed_by = COALESCE(:completed_by, completed_by),
                        notes = COALESCE(:notes, notes),
                        photos = COALESCE(:photos, photos),
                        updated_at = NOW()
                    WHERE task_code = :task_code OR id::text = :task_code
                ");

                $stmt->execute([
                    'task_code' => $taskCode,
                    'vessel_id' => $input['vesselId'] ?? $input['vessel_id'] ?? null,
                    'vessel_name' => $input['vesselName'] ?? $input['vessel_name'] ?? null,
                    'title' => $input['title'] ?? null,
                    'description' => $input['description'] ?? null,
                    'category' => $input['category'] ?? null,
                    'priority' => $input['priority'] ?? null,
                    'status' => $input['status'] ?? null,
                    'assigned_to' => $input['assignedTo'] ?? $input['assigned_to'] ?? null,
                    'due_date' => $input['dueDate'] ?? $input['due_date'] ?? null,
                    'estimated_cost' => $input['estimatedCost'] ?? $input['estimated_cost'] ?? null,
                    'actual_cost' => $input['actualCost'] ?? $input['actual_cost'] ?? null,
                    'completed_at' => $input['completedAt'] ?? $input['completed_at'] ?? null,
                    'completed_by' => $input['completedBy'] ?? $input['completed_by'] ?? null,
                    'notes' => $input['notes'] ?? null,
                    'photos' => isset($input['photos']) ? json_encode($input['photos']) : null
                ]);

                successResponse(['task_code' => $taskCode], 'Task updated successfully');
            }
            break;

        case 'DELETE':
            if (!$taskCode) {
                errorResponse('task_code is required', 400);
            }

            $stmt = $pdo->prepare("DELETE FROM tasks WHERE task_code = :code OR id::text = :code");
            $stmt->execute(['code' => $taskCode]);

            if ($stmt->rowCount() > 0) {
                successResponse([], 'Task deleted successfully');
            } else {
                errorResponse('Task not found', 404);
            }
            break;

        default:
            errorResponse('Method not allowed', 405);
    }

} catch (PDOException $e) {
    errorResponse('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
?>
