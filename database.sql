-- Project Management System Database Schema
-- MySQL Database for cPanel Hosting

-- Create database (run this in cPanel MySQL Database wizard or phpMyAdmin)
-- CREATE DATABASE project_manager;
-- USE project_manager;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'Team',
  `title` VARCHAR(100),
  `avatar_url` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) DEFAULT 'In Development',
  `progress` INT DEFAULT 0,
  `start_date` DATE,
  `deadline` DATE,
  `priority` VARCHAR(20) DEFAULT 'Medium',
  `tech_stack_json` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT,
  `user_id` INT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` VARCHAR(50) DEFAULT 'Pending',
  `priority` VARCHAR(20) DEFAULT 'Medium',
  `due_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Users
INSERT INTO `users` (`id`, `name`, `role`, `title`, `avatar_url`) VALUES
(1, 'Raul', 'Admin', 'System Administrator', 'https://ui-avatars.com/api/?name=Raul&background=0D8ABC&color=fff'),
(2, 'Sarah', 'Team', 'UI/UX Designer', 'https://ui-avatars.com/api/?name=Sarah&background=random'),
(3, 'John', 'Team', 'Backend Developer', 'https://ui-avatars.com/api/?name=John&background=random'),
(4, 'Emma', 'HR', 'HR Manager', 'https://ui-avatars.com/api/?name=Emma&background=random');

-- Insert Projects
INSERT INTO `projects` (`id`, `name`, `description`, `status`, `progress`, `start_date`, `deadline`, `priority`, `tech_stack_json`) VALUES
(1, 'Ball Pump – Interactive Game', 'End-to-end development of a custom C++ game integrated with an Arduino-based pressure sensor. The sensor captures real-time air pressure and sends values directly to the game.', 'Done', 100, '2025-11-01', '2025-12-05', 'High', '[\"C++\",\"Arduino\",\"Unity\"]'),
(2, 'Immersive Room (v1)', 'First version of an immersive room experience with full-body tracking, allowing players to interact and move naturally inside the game environment.', 'Done', 100, '2025-11-01', '2025-12-05', 'High', '[\"Unity\", \"C++\", \"Arduino\"]'),
(3, 'DIFC – Real-Time Quiz', 'Real-time quiz platform similar to Kahoot. Users join from phones, answer questions simultaneously, and see results on a main screen.', 'Done', 100, '2025-11-10', '2025-11-24', 'Medium', '[\"JavaScript\", \"WebSocket\", \"MongoDB\"]'),
(4, 'Event Ticketing System', 'Ticketing system allowing users to register, log in, purchase tickets, and download/print them. Includes admin panel for event management.', 'Done', 100, '2025-11-15', '2025-12-06', 'Critical', '[\"React\", \"Express\", \"MySQL\"]'),
(5, 'Cycle Game - Rebuild', 'Rebuild the ''Cycle Game'' with Arduino connection and develop a new game platform with a new API server on no1events server.', 'Done', 100, '2025-12-01', '2026-01-05', 'High', '[\"Unity\",\"Arduino\",\"C++\",\"API\"]'),
(6, 'Fast Feet Game - Rebuild', 'Rebuild the ''Fast Feet'' game with Arduino connected to sensors and lights. Creating a responsive game that reacts to player movements.', 'In Development', 10, '2025-12-05', '2026-01-09', 'High', '[\"Arduino\", \"C++\", \"Unity\", \"Sensors\"]'),
(8, 'NHRI Engagement App', 'Rebrand and extend the quiz/engagement app for the National Human Rights Institution, updating all questions and visuals.', 'Done', 100, '2025-12-10', '2025-12-13', 'Low', '[\"JavaScript\", \"WebSocket\", \"React\"]'),
(9, 'UAE Pro League History', 'Bilingual (Arabic/English) history experience for the UAE Pro League with club trophies and tournament cards.', 'Done', 100, '2025-12-15', '2025-12-17', 'Medium', '[\"React\", \"Next.js\", \"Tailwind\"]'),
(12, 'Showroom: Holographic Fan', 'Design and develop high impact 3D holographic visual content. New animations, product visualizations, and branding sequences.', 'In Development', 0, '2026-01-21', '2026-02-15', 'High', '[\"Hologram\",\"3D\",\"Animation\"]'),
(13, 'Showroom: Touchscreen 1 (Vertical)', 'Upgrade and redesign vertical interface. Improve UI/UX layout, navigation flows, and response time.', 'In Development', 0, '2026-01-21', '2026-02-15', 'High', '[\"Touchscreen\",\"UI/UX\",\"Interactive\"]'),
(14, 'Showroom: Touchscreen 2 (Vertical)', 'New interactive content modules. Enhance user interaction logic and storytelling elements.', 'In Development', 0, '2026-01-21', '2026-02-15', 'High', '[\"Touchscreen\",\"CMS\",\"Logic\"]'),
(15, 'Showroom: Main LED Screen', 'Large scale visual experiences, brand presentations, and synchronized multi-screen content.', 'In Development', 0, '2026-01-21', '2026-02-15', 'High', '[\"LED\",\"Motion Graphics\",\"4K\"]'),
(16, 'Photobooth Experience', 'Develop multiple photobooth experience versions designed for events and entertainment environments. Features may include AI background replacement, augmented reality filters, branded overlays, facial tracking effects, gesture based capture, instant sharing through QR code or mobile download, and multiplayer photo sessions.', 'Upcoming', 0, NULL, NULL, 'Medium', '[\"AI\",\"AR\",\"Computer Vision\",\"Mobile\"]'),
(17, 'Kahoot System Upgrade', 'Develop an upgraded interactive quiz and audience engagement platform with enhanced UI, custom branding, real time participation via mobile devices, leaderboard systems, analytics dashboards, and multiple question formats.', 'Upcoming', 0, NULL, NULL, 'High', '[\"JavaScript\",\"WebSocket\",\"React\",\"Analytics\"]'),
(18, 'Interactive Photo Experience', 'Build a real time system that allows users to capture photos on their mobile devices and instantly display them on large LED screens. The experience should include moderation controls, automatic visual enhancements, dynamic gallery layouts, and event themed animations.', 'Upcoming', 0, NULL, NULL, 'Medium', '[\"Mobile\",\"LED Integration\",\"Real-time Sync\"]'),
(19, 'Interactive Text Display', 'Create a live messaging platform where users can submit text from their mobile devices and display it instantly on large screens. The system should support animated typography, customizable visual styles, content moderation, and audience polls.', 'Upcoming', 0, NULL, NULL, 'Low', '[\"WebSocket\",\"Typography\",\"Mobile\"]'),
(20, 'AI Drawing Platform', 'Develop a collaborative AI assisted drawing platform where users create sketches on their mobile devices and display them on large screens in real time. The system can enhance drawings using AI stylization, animation effects, and artistic filters.', 'Upcoming', 0, NULL, NULL, 'Medium', '[\"AI\",\"Canvas API\",\"Mobile\",\"Real-time\"]'),
(21, 'New Interactive Games', 'Design and develop new interactive gaming experiences tailored for exhibitions, fan zones, and immersive environments. Games should support multiple input methods including mobile devices, gesture tracking, touch interaction, and external controllers.', 'Upcoming', 0, NULL, NULL, 'High', '[\"Unity\",\"Gesture Tracking\",\"Mobile\"]'),
(22, 'Interactive Wall Effects', 'Develop immersive LED wall experiences that react to human movement, touch interaction, or gesture tracking. Effects may include particle simulations, fluid visual effects, light trails, and environmental transformations.', 'Upcoming', 0, NULL, NULL, 'Medium', '[\"Computer Vision\",\"LED\",\"Particle Systems\"]'),
(23, 'Interactive Big Screen Game', 'Create entertainment focused games designed specifically for large LED screens or projection walls. The games should allow interaction through smartphones, motion tracking systems, or gesture controls.', 'Upcoming', 0, NULL, NULL, 'Medium', '[\"Unity\",\"Mobile\",\"Motion Tracking\"]'),
(24, 'Penalty Shooter Game', 'Develop an interactive football penalty shooting experience using body tracking technology such as Kinect or computer vision pose detection. Users perform physical kicking gestures to shoot virtual balls toward a goal.', 'Upcoming', 0, NULL, NULL, 'Low', '[\"Kinect\",\"Computer Vision\",\"Unity\"]'),
(25, 'Graffiti Paint Experience', 'Create a digital graffiti painting platform where users simulate spray painting using motion tracking, touchscreens, or mobile devices. Features include realistic spray paint effects, customizable brush sizes, and color palettes.', 'Upcoming', 0, NULL, NULL, 'Low', '[\"Motion Tracking\",\"Canvas API\",\"Touch\"]'),
(26, 'Big Size Platform Game (Mario Style)', 'Develop a large scale side scrolling platform game designed for wall sized LED displays. Players control characters using their mobile phones or gesture input. The game should support single player and multiplayer modes.', 'Upcoming', 0, NULL, NULL, 'Medium', '[\"Unity\",\"Mobile\",\"Gesture Input\"]');

-- Insert Tasks
INSERT INTO `tasks` (`id`, `project_id`, `user_id`, `title`, `status`, `priority`, `due_date`) VALUES
(1, 6, 1, 'Sensor Integration Testing', 'In Progress', 'High', '2026-01-02'),
(2, 6, 2, 'Game Loop Logic', 'Pending', 'Medium', '2026-01-05'),
(3, 5, 1, 'API Documentation', 'Done', 'Low', '2025-12-20'),
(4, 4, 3, 'Payment Gateway Hook', 'Done', 'High', '2025-11-30'),
(5, 1, 2, 'Pressure Sensor Calibration', 'Done', 'Medium', '2025-11-10');
