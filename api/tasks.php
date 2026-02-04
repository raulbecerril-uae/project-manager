<?php
require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all tasks
            $stmt = $conn->query("SELECT * FROM tasks ORDER BY id DESC");
            $tasks = $stmt->fetchAll();
            echo json_encode($tasks);
            break;

        case 'POST':
            // Create new task
            $data = json_decode(file_get_contents('php://input'), true);

            $stmt = $conn->prepare("
                INSERT INTO tasks (project_id, user_id, title, description, status, priority, due_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['project_id'] ?? null,
                $data['user_id'] ?? null,
                $data['title'],
                $data['description'] ?? '',
                $data['status'] ?? 'Pending',
                $data['priority'] ?? 'Medium',
                $data['due_date'] ?? null
            ]);

            $newId = $conn->lastInsertId();

            // Fetch and return the new task
            $stmt = $conn->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$newId]);
            $task = $stmt->fetch();

            http_response_code(201);
            echo json_encode($task);
            break;

        case 'PUT':
            // Update task
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Task ID required']);
                exit();
            }

            $stmt = $conn->prepare("
                UPDATE tasks 
                SET title = ?, description = ?, status = ?, priority = ?, due_date = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $data['title'],
                $data['description'] ?? '',
                $data['status'] ?? 'Pending',
                $data['priority'] ?? 'Medium',
                $data['due_date'] ?? null,
                $data['id']
            ]);

            // Fetch and return updated task
            $stmt = $conn->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$data['id']]);
            $task = $stmt->fetch();

            echo json_encode($task);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>