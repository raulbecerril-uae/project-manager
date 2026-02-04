<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root'); // Standard default, change if needed
define('DB_PASS', '');     // Standard default, change if needed
define('DB_NAME', 'project_manager_db');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // In production, log this instead of showing it
    die("DB Connection Failed: " . $e->getMessage());
}
?>
