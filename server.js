const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads folder
console.log('Serving static files from:', __dirname);

// Import upload router
const uploadRouter = require('./api/upload');
app.use('/api', uploadRouter);

// Helper to read DB
async function readDB() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading database:", err);
        return { projects: [], tasks: [], users: [] };
    }
}

// Helper to write DB
async function writeDB(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// --- API Endpoints ---

// Get Users
app.get('/api/users', async (req, res) => {
    const db = await readDB();
    res.json(db.users);
});

// Get Projects
app.get('/api/projects', async (req, res) => {
    const db = await readDB();
    res.json(db.projects);
});

// Create Project
app.post('/api/projects', async (req, res) => {
    const db = await readDB();
    const newProject = {
        id: db.projects.length ? Math.max(...db.projects.map(p => p.id)) + 1 : 1,
        ...req.body,
        tech_stack_json: JSON.stringify(req.body.tech_stack || [])
    };
    db.projects.push(newProject);
    await writeDB(db);
    res.json({ message: "Project created", id: newProject.id });
});

// Update Project
app.put('/api/projects/:id', async (req, res) => {
    const db = await readDB();
    const id = parseInt(req.params.id);
    const index = db.projects.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Project not found" });
    }

    const updatedProject = { ...db.projects[index], ...req.body };
    // Ensure tech_stack_json is handled if passed as array or string in body
    if (req.body.tech_stack) {
        updatedProject.tech_stack_json = JSON.stringify(req.body.tech_stack);
    }

    db.projects[index] = updatedProject;
    await writeDB(db);
    res.json(updatedProject);
});

// Delete Project
app.delete('/api/projects/:id', async (req, res) => {
    const db = await readDB();
    const id = parseInt(req.params.id);
    const initialLength = db.projects.length;
    db.projects = db.projects.filter(p => p.id !== id);

    if (db.projects.length === initialLength) {
        return res.status(404).json({ error: "Project not found" });
    }

    // Also delete associated tasks
    db.tasks = db.tasks.filter(t => t.project_id !== id);

    await writeDB(db);
    res.json({ message: "Project deleted" });
});

// Get Tasks
app.get('/api/tasks', async (req, res) => {
    const db = await readDB();
    let tasks = db.tasks;

    // Filter by project_id
    if (req.query.project_id) {
        tasks = tasks.filter(t => t.project_id == req.query.project_id);
    }

    // Join with user data
    const enrichedTasks = tasks.map(task => {
        const user = db.users.find(u => u.id == task.assigned_to_user_id);
        const project = db.projects.find(p => p.id == task.project_id);
        return {
            ...task,
            assigned_user_name: user ? user.name : null,
            assigned_user_avatar: user ? user.avatar_url : null,
            project_name: project ? project.name : null
        };
    });

    res.json(enrichedTasks);
});

// Create Task (Mock - not fully used in UI yet but good to have)
app.post('/api/tasks', async (req, res) => {
    const db = await readDB();
    const newTask = {
        id: db.tasks.length ? Math.max(...db.tasks.map(t => t.id)) + 1 : 1,
        ...req.body
    };
    db.tasks.push(newTask);
    await writeDB(db);
    res.json({ message: "Task created", id: newTask.id });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
