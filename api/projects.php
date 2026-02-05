<?php
require_once 'config.php';

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Get single project
                $stmt = $conn->prepare("SELECT * FROM projects WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $project = $stmt->fetch();

                if ($project) {
                    // Parse JSON fields
                    $project['tech_stack'] = json_decode($project['tech_stack_json']);
                    $project['required_team'] = json_decode($project['required_team_json'] ?? '[]');
                    echo json_encode($project);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Project not found']);
                }
            } else {
                // Get all projects
                $stmt = $conn->query("SELECT * FROM projects ORDER BY id DESC");
                $projects = $stmt->fetchAll();

                // Parse JSON fields for each project
                foreach ($projects as &$project) {
                    $project['tech_stack'] = json_decode($project['tech_stack_json']);
                    $project['required_team'] = json_decode($project['required_team_json'] ?? '[]');
                }

                echo json_encode($projects);
            }
            break;

        case 'POST':
            // Create new project
            $data = json_decode(file_get_contents('php://input'), true);

            $stmt = $conn->prepare("
                INSERT INTO projects (name, description, status, progress, start_date, deadline, priority, tech_stack_json, estimated_duration, required_team_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['name'],
                $data['description'] ?? '',
                $data['status'] ?? 'In Development',
                $data['progress'] ?? 0,
                $data['start_date'] ?? null,
                $data['deadline'] ?? null,
                $data['priority'] ?? 'Medium',
                isset($data['tech_stack']) ? json_encode($data['tech_stack']) : '[]',
                $data['estimated_duration'] ?? null,
                isset($data['required_team']) ? json_encode($data['required_team']) : '[]'
            ]);

            $newId = $conn->lastInsertId();

            // Fetch and return the new project
            $stmt = $conn->prepare("SELECT * FROM projects WHERE id = ?");
            $stmt->execute([$newId]);
            $project = $stmt->fetch();
            $project['tech_stack'] = json_decode($project['tech_stack_json']);
            $project['required_team'] = json_decode($project['required_team_json'] ?? '[]');

            http_response_code(201);
            echo json_encode($project);
            break;

        case 'PUT':
            // Update project
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Project ID required']);
                exit();
            }

            $stmt = $conn->prepare("
                UPDATE projects 
                SET name = ?, description = ?, status = ?, progress = ?, 
                    start_date = ?, deadline = ?, priority = ?, tech_stack_json = ?,
                    estimated_duration = ?, required_team_json = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $data['name'],
                $data['description'] ?? '',
                $data['status'] ?? 'In Development',
                $data['progress'] ?? 0,
                $data['start_date'] ?? null,
                $data['deadline'] ?? null,
                $data['priority'] ?? 'Medium',
                isset($data['tech_stack']) ? json_encode($data['tech_stack']) : '[]',
                $data['estimated_duration'] ?? null,
                isset($data['required_team']) ? json_encode($data['required_team']) : '[]',
                $data['id']
            ]);

            // Fetch and return updated project
            $stmt = $conn->prepare("SELECT * FROM projects WHERE id = ?");
            $stmt->execute([$data['id']]);
            $project = $stmt->fetch();
            $project['tech_stack'] = json_decode($project['tech_stack_json']);
            $project['required_team'] = json_decode($project['required_team_json'] ?? '[]');

            echo json_encode($project);
            break;

        case 'DELETE':
            // Delete project
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Project ID required']);
                exit();
            }

            $stmt = $conn->prepare("DELETE FROM projects WHERE id = ?");
            $stmt->execute([$data['id']]);

            echo json_encode(['success' => true, 'message' => 'Project deleted']);
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