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

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>