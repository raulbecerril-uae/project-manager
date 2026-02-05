<?php
require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single user
                $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $user = $stmt->fetch();

                if ($user) {
                    echo json_encode($user);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found']);
                }
            } else {
                // Get all users
                $stmt = $conn->query("SELECT * FROM users ORDER BY id");
                $users = $stmt->fetchAll();
                echo json_encode($users);
            }
            break;

        case 'POST':
            // Create new user
            $data = json_decode(file_get_contents('php://input'), true);

            $stmt = $conn->prepare("
                INSERT INTO users (name, role, title, avatar_url)
                VALUES (?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['name'],
                $data['role'] ?? 'Team',
                $data['title'] ?? '',
                $data['avatar_url'] ?? 'https://ui-avatars.com/api/?name=' . urlencode($data['name'])
            ]);

            $newId = $conn->lastInsertId();

            // Fetch and return the new user
            $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$newId]);
            $user = $stmt->fetch();

            http_response_code(201);
            echo json_encode($user);
            break;

        case 'PUT':
            // Update user
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                exit();
            }

            $stmt = $conn->prepare("
                UPDATE users 
                SET name = ?, role = ?, title = ?, avatar_url = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $data['name'],
                $data['role'] ?? 'Team',
                $data['title'] ?? '',
                $data['avatar_url'] ?? '',
                $data['id']
            ]);

            // Fetch and return updated user
            $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$data['id']]);
            $user = $stmt->fetch();

            echo json_encode($user);
            break;

        case 'DELETE':
            // Delete user
            $data = json_decode(file_get_contents('php://input'), true);

            // Allow delete by URL param or body
            $id = $data['id'] ?? $_GET['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                exit();
            }

            $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => 'User deleted']);
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