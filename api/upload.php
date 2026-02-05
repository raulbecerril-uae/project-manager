<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uploadsDir = '../uploads/';

// Ensure uploads directory exists
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (!isset($_FILES['media'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit();
    }

    $file = $_FILES['media'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type']);
        exit();
    }

    if ($file['size'] > 50 * 1024 * 1024) { // 50MB
        http_response_code(400);
        echo json_encode(['error' => 'File too large']);
        exit();
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = time() . '-' . uniqid() . '.' . $extension;
    $targetPath = $uploadsDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        // Construct URL relative to the API location or absolute based on server config
        // Assuming API is in /api/ and uploads in /uploads/
        // URL should typically be /uploads/filename relative to root

        $url = '/uploads/' . $filename;

        echo json_encode([
            'success' => true,
            'url' => $url,
            'filename' => $filename
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }

} elseif ($method === 'DELETE') {
    $filename = $_GET['filename'] ?? null;

    if (!$filename) {
        http_response_code(400);
        echo json_encode(['error' => 'Filename required']);
        exit();
    }

    // Security check: exclude directory traversal
    if (basename($filename) !== $filename) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid filename']);
        exit();
    }

    $filePath = $uploadsDir . $filename;

    if (file_exists($filePath)) {
        if (unlink($filePath)) {
            echo json_encode(['success' => true, 'message' => 'File deleted']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete file']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>