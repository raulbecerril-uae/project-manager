// Configuration for API endpoints
// Change this to switch between Node.js (local) and PHP (production)

const API_MODE = 'nodejs'; // Change to 'php' when deploying to cPanel

const API_ENDPOINTS = {
    nodejs: {
        projects: 'api/projects',
        users: 'api/users',
        tasks: 'api/tasks',
        upload: 'api/upload'
    },
    php: {
        projects: 'api/projects.php',
        users: 'api/users.php',
        tasks: 'api/tasks.php',
        upload: 'api/upload.php'
    }
};

// Get the current API endpoints based on mode
window.API = API_ENDPOINTS[API_MODE];
