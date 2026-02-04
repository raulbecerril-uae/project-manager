CREATE DATABASE IF NOT EXISTS project_manager_db;
USE project_manager_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'Developer',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM('Planning', 'In Development', 'Code Review', 'Testing', 'Deployed') DEFAULT 'Planning',
    start_date DATE,
    deadline DATE,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    tech_stack_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    assigned_to_user_id INT,
    title VARCHAR(200) NOT NULL,
    status ENUM('Todo', 'In Progress', 'Blocked', 'Done') DEFAULT 'Todo',
    complexity ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed Data
INSERT INTO users (name, role, avatar_url) VALUES 
('Raul', 'Lead Developer', 'https://ui-avatars.com/api/?name=Raul&background=0D8ABC&color=fff'),
('Sarah', 'UI/UX Designer', 'https://ui-avatars.com/api/?name=Sarah&background=random'),
('John', 'Backend Dev', 'https://ui-avatars.com/api/?name=John&background=random'),
('Emma', 'Product Owner', 'https://ui-avatars.com/api/?name=Emma&background=random');

INSERT INTO projects (name, description, status, start_date, deadline, priority, tech_stack_json) VALUES 
('Modern Dashboard V2', 'Overhaul of the main administration panel with new analytics widgets.', 'In Development', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'High', '["Vue.js", "Laravel", "MySQL"]'),
('API Migration', 'Migrate legacy REST API to GraphQL for better mobile performance.', 'Planning', DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'Medium', '["Node.js", "GraphQL", "Redis"]'),
('Corporate Website', 'Refresh the main corporate website with new branding.', 'Code Review', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Low', '["WordPress", "PHP", "Tailwind"]');

INSERT INTO tasks (project_id, assigned_to_user_id, title, status, complexity, due_date) VALUES 
(1, 1, 'Setup Vue 3 Boilerplate', 'Done', 'Low', DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
(1, 2, 'Design High-Fidelity Mockups', 'In Progress', 'High', DATE_ADD(CURDATE(), INTERVAL 5 DAY)),
(1, 1, 'Implement Auth JWT Flow', 'Todo', 'Medium', DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
(2, 3, 'Schema Design for GraphQL', 'Todo', 'High', DATE_ADD(CURDATE(), INTERVAL 10 DAY)),
(3, 2, 'Finalize Homepage CSS', 'Code Review', 'Medium', DATE_ADD(CURDATE(), INTERVAL 1 DAY));
