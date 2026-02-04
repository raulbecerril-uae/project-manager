// Project Management System Dashboard Logic

const appState = {
    projects: [],
    users: [],
    tasks: [],
    currentUser: null,
    currentProject: null // For details/edit
};

const cardStyles = [
    { bg: 'pastel-orange', progress: 'bg-orange-400' },
    { bg: 'pastel-blue', progress: 'bg-blue-400' },
    { bg: 'pastel-green', progress: 'bg-green-400' },
    { bg: 'pastel-pink', progress: 'bg-pink-400' }
];

document.addEventListener('DOMContentLoaded', async () => {
    await initApp();

    // Search Listener
    document.getElementById('global-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = appState.projects.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.description || '').toLowerCase().includes(query)
        );
        renderProjects(filtered);
    });

    // New Project Form
    document.getElementById('create-project-form').onsubmit = handleCreateProject;
});

async function initApp() {
    const savedUserId = localStorage.getItem('pms_user_id');
    await fetchUsers();
    await fetchProjects();
    await fetchAllTasks();
    updateProjectStats(); // Update stats after loading projects

    if (savedUserId) {
        const user = appState.users.find(u => u.id == savedUserId);
        if (user) login(user);
        else showLogin();
    } else {
        showLogin();
    }
}

// --- Auth ---
function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-screen').classList.add('flex');
    const list = document.getElementById('login-user-list');
    list.innerHTML = appState.users.map(user => `
         <div onclick="loginById(${user.id})" class="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors">
            <img src="${user.avatar_url}" class="w-12 h-12 rounded-full">
            <div class="text-left">
                <p class="font-bold text-gray-900 text-lg leading-none">${user.name}</p>
                <p class="text-sm text-gray-400 mt-1">${user.role}</p>
            </div>
        </div>
    `).join('');
}

function loginById(id) {
    const user = appState.users.find(u => u.id === id);
    if (user) login(user);
}

function login(user) {
    appState.currentUser = user;
    localStorage.setItem('pms_user_id', user.id);
    document.getElementById('current-user-avatar').src = user.avatar_url;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('flex');
    showSection('projects');
}

function logout() {
    appState.currentUser = null;
    localStorage.removeItem('pms_user_id');
    window.location.reload();
}

// --- Navigation ---
window.showSection = (sectionId) => {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('text-gray-900');
        btn.classList.add('text-gray-400');
    });

    const activeBtn = Array.from(document.querySelectorAll('.nav-item')).find(b => b.getAttribute('onclick').includes(sectionId));
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400');
        activeBtn.classList.add('text-gray-900');
    }

    document.querySelectorAll('.section-view').forEach(el => el.classList.add('hidden'));

    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.remove('hidden');
        renderSectionData(sectionId);
    }

    const titles = {
        'projects': 'Dashboard',
        'mytasks': 'My Tasks',
        'team': 'Team',
        'reports': 'Reports',
        'ideas': 'Future Concepts',
        'settings': 'Settings'
    };
    document.getElementById('page-title').textContent = titles[sectionId] || 'Dashboard';
};

// --- Data Fetching ---
async function fetchProjects() {
    try {
        const res = await fetch('api/projects');
        appState.projects = await res.json();
    } catch (e) { console.error(e); }
}

async function fetchUsers() {
    try {
        const res = await fetch('api/users');
        appState.users = await res.json();
    } catch (e) { console.error(e); }
}

async function fetchAllTasks() {
    try {
        const res = await fetch('api/tasks');
        appState.tasks = await res.json();
    } catch (e) { console.error(e); }
}

// Stats update function
function updateProjectStats() {
    const coreProjects = appState.projects.filter(p => p.status !== 'Idea' && p.status !== 'Upcoming');
    const inProgress = coreProjects.filter(p => p.status === 'In Development');
    const delivered = coreProjects.filter(p => p.status === 'Delivered' || p.status === 'Done' || p.status === 'Completed');
    const upcoming = appState.projects.filter(p => p.status === 'Idea' || p.status === 'Upcoming');

    document.getElementById('stat-total-projects').textContent = coreProjects.length;
    document.getElementById('stat-in-dev').textContent = inProgress.length;
    document.getElementById('stat-delivered').textContent = delivered.length;
    document.getElementById('stat-upcoming').textContent = upcoming.length;
}

// --- Rendering ---
function renderSectionData(sectionId) {
    if (sectionId === 'projects') {
        // Exclude ideas and upcoming from main dashboard
        const mainProjects = appState.projects.filter(p => p.status !== 'Idea' && p.status !== 'Upcoming');
        const sorted = smartSort([...mainProjects]);
        renderProjects(sorted);
        updateProjectStats();
    } else if (sectionId === 'team') {
        renderTeam();
    } else if (sectionId === 'mytasks') {
        renderMyTasks();
    } else if (sectionId === 'ideas') {
        renderIdeas();
    }
}

// --- Filter Logic ---
function smartSort(projects) {
    return projects.sort((a, b) => {
        // Priority 1: In Progress/In Development first
        const aInProgress = a.status.toLowerCase().includes('development');
        const bInProgress = b.status.toLowerCase().includes('development');

        if (aInProgress && !bInProgress) return -1;
        if (!aInProgress && bInProgress) return 1;

        // Priority 2: Sort by deadline (newest first, oldest last)
        const aDate = a.deadline ? new Date(a.deadline) : new Date('2099-12-31');
        const bDate = b.deadline ? new Date(b.deadline) : new Date('2099-12-31');
        return aDate - bDate; // Ascending (soonest deadline first)
    });
}

window.filterProjects = (filter) => {
    appState.currentFilter = filter; // Store for sorting reuse
    let filtered;
    const coreProjects = appState.projects.filter(p => p.status !== 'Idea' && p.status !== 'Upcoming');

    if (filter === 'all') {
        filtered = coreProjects;
    } else if (filter === 'inprogress') {
        // Only "In Development" status
        filtered = coreProjects.filter(p => p.status === 'In Development');
    } else if (filter === 'delivered') {
        // ALL finished/completed projects
        filtered = coreProjects.filter(p => p.status === 'Delivered' || p.status === 'Done' || p.status === 'Completed');
    } else if (filter === 'upcoming') {
        // Show Upcoming/Ideas (future concepts)
        filtered = appState.projects.filter(p => p.status === 'Idea' || p.status === 'Upcoming');
    }

    // Apply smart sorting
    filtered = smartSort(filtered);
    renderProjects(filtered);
};


function renderIdeas() {
    const container = document.getElementById('ideas-container');
    const ideas = appState.projects.filter(p => p.status === 'Idea');
    document.getElementById('stat-total-ideas').innerText = ideas.length;

    container.innerHTML = '';

    if (ideas.length === 0) {
        container.innerHTML = `<p class="text-gray-400 col-span-3 text-center py-10">No ideas yet. Use the + button to add one!</p>`;
        return;
    }

    if (appState.viewMode === 'list') {
        container.className = 'flex flex-col gap-3 animate-fade-in w-full';

        // Header
        const header = document.createElement('div');
        header.className = 'grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2';
        header.innerHTML = `<div class="col-span-12">Idea Information</div>`;
        container.appendChild(header);

        ideas.forEach((project) => {
            const row = document.createElement('div');
            row.className = 'bg-yellow-50/50 hover:bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors';
            row.onclick = () => openEnhancedDetail(project);
            row.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                        <i data-lucide="lightbulb" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">${project.name}</h4>
                        <p class="text-sm text-gray-500 line-clamp-1">${project.description}</p>
                    </div>
                </div>
                <button class="bg-white p-2 rounded-full text-gray-400 shadow-sm"><i data-lucide="arrow-right" class="w-4 h-4"></i></button>
             `;
            container.appendChild(row);
        });
    } else {
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in mb-8';
        ideas.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = `bg-yellow-50 card-hover rounded-[32px] p-8 flex flex-col h-[320px] cursor-pointer animate-fade-in relative overflow-hidden group border border-yellow-100`;
            card.style.animationDelay = `${index * 50}ms`;
            card.onclick = () => openEnhancedDetail(project);
            card.innerHTML = `
                <div class="mb-auto">
                    <div class="w-12 h-12 bg-yellow-400 text-yellow-900 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <i data-lucide="lightbulb" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2 leading-tight">${project.name}</h3>
                    <p class="text-gray-600 font-medium text-sm line-clamp-3">${project.description}</p>
                </div>
                <div class="flex justify-between items-center mt-6">
                    <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Concept</span>
                    <button class="w-8 h-8 rounded-full bg-white hover:bg-yellow-200 flex items-center justify-center transition-colors">
                        <i data-lucide="arrow-right" class="w-5 h-5 text-gray-600"></i>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }
    lucide.createIcons();
}

function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    if (projects.length === 0) {
        container.innerHTML = `<p class="text-gray-400 col-span-3 text-center py-10">No projects found.</p>`;
        return;
    }

    projects.forEach((project, index) => {
        const style = cardStyles[index % cardStyles.length];
        const progress = project.progress || 0;

        const card = document.createElement('div');
        card.className = `${style.bg} card-hover rounded-[32px] p-8 flex flex-col h-[320px] cursor-pointer animate-fade-in relative overflow-hidden group`;
        card.style.animationDelay = `${index * 50}ms`;
        card.onclick = () => openEnhancedDetail(project);

        const dateStr = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No Deadline';
        const startStr = project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No Start';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                 <div class="flex flex-col">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery</span>
                    <span class="text-sm font-bold text-gray-800">${dateStr}</span>
                </div>
                <button class="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-colors">
                    <i data-lucide="more-horizontal" class="w-5 h-5 text-gray-600"></i>
                </button>
            </div>
            
            <div class="mb-auto">
                <h3 class="text-2xl font-bold text-gray-800 mb-2 leading-tight">${project.name}</h3>
                 <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs text-gray-500">Submitted: ${startStr}</span>
                </div>
                <p class="text-gray-600 font-medium text-sm line-clamp-2">${project.status}</p>
            </div>
            
            <div class="mb-8">
                <div class="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>${progress}%</span>
                </div>
                <div class="w-full bg-white/50 h-2 rounded-full overflow-hidden">
                    <div class="${style.progress} h-full rounded-full" style="width: ${progress}%"></div>
                </div>
            </div>

            <div class="flex justify-between items-center">
                <div class="flex -space-x-3">
                     <img src="https://ui-avatars.com/api/?name=${project.name.charAt(0)}&background=random" class="w-10 h-10 rounded-full border-2 border-white">
                </div>
                 <span class="bg-white px-4 py-2 rounded-xl text-xs font-bold text-gray-700 shadow-sm">${project.priority}</span>
            </div>
        `;
        container.appendChild(card);
    });
    lucide.createIcons();
}

// --- Update Detail View ---
let isEditMode = false;
let uploadedMediaData = null;

window.handleMediaUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedMediaData = e.target.result;
        const preview = document.getElementById('media-preview');

        if (file.type.startsWith('video/')) {
            preview.innerHTML = `<video src="${e.target.result}" class="w-full h-full object-cover" controls></video>`;
        } else {
            preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover" alt="Project media">`;
        }

        lucide.createIcons();
    };
    reader.readAsDataURL(file);
};

window.removeMedia = () => {
    uploadedMediaData = null;
    appState.currentProject.media_url = null;
    const preview = document.getElementById('media-preview');
    preview.innerHTML = `
        <span class="text-gray-400 flex flex-col items-center pointer-events-none">
            <i data-lucide="upload" class="w-12 h-12 mb-2 opacity-50"></i>
            <span class="text-sm font-medium">Click to upload image or video</span>
        </span>
    `;
    const input = document.getElementById('media-upload');
    if (input) input.value = '';
    lucide.createIcons();
};

function openEnhancedDetail(project) {
    appState.currentProject = project;
    isEditMode = false;
    renderDetailView();

    // Show edit/delete buttons for admin only
    const isAdmin = appState.currentUser?.role === 'Admin';
    document.getElementById('edit-btn').classList.toggle('hidden', !isAdmin);
    document.getElementById('delete-btn').classList.toggle('hidden', !isAdmin);

    openModal('projectDetailModal');
}

function renderDetailView() {
    const project = appState.currentProject;

    if (isEditMode) {
        // EDIT MODE
        document.getElementById('detail-title').innerHTML = `
            <input type="text" id="edit-name" value="${project.name}" 
                class="w-full text-3xl font-bold text-gray-900 bg-gray-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-200">
        `;
        document.getElementById('detail-desc').innerHTML = `
            <textarea id="edit-desc" rows="3" 
                class="w-full text-gray-600 bg-gray-50 border-none rounded-xl px-4 py-3 mt-4 focus:ring-2 focus:ring-blue-200">${project.description || ''}</textarea>
        `;

        // Edit icon changes to Save/Cancel
        document.getElementById('edit-btn').innerHTML = '<i data-lucide="check" class="w-5 h-5"></i>';
        document.getElementById('edit-btn').title = 'Save';
        document.getElementById('edit-btn').classList.remove('hover:text-blue-600');
        document.getElementById('edit-btn').classList.add('hover:text-green-600', 'text-green-600');

        const submitted = project.start_date ? project.start_date.split('T')[0] : '';
        const delivery = project.deadline ? project.deadline.split('T')[0] : '';
        const tech = JSON.parse(project.tech_stack_json || '[]');

        document.getElementById('detail-content').innerHTML = `
            <div class="w-full h-56 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 overflow-hidden relative group border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
                <input type="file" id="media-upload" accept="image/*,video/*" class="hidden" onchange="handleMediaUpload(event)">
                <div id="media-preview" class="w-full h-full flex items-center justify-center" onclick="document.getElementById('media-upload').click()">
                    ${project.media_url ?
                (project.media_url.match(/\.(mp4|webm|ogg)$/i) ?
                    `<video src="${project.media_url}" class="w-full h-full object-cover" controls></video>` :
                    `<img src="${project.media_url}" class="w-full h-full object-cover" alt="Project media">`) :
                `<span class="text-gray-400 flex flex-col items-center pointer-events-none">
                            <i data-lucide="upload" class="w-12 h-12 mb-2 opacity-50"></i>
                            <span class="text-sm font-medium">Click to upload image or video</span>
                        </span>`
            }
                </div>
                ${project.media_url ? `<button onclick="event.stopPropagation(); removeMedia()" class="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>` : ''}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <div class="col-span-2 grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                        <label class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Status</label>
                        <select id="edit-status" class="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-200">
                            <option ${project.status === 'Planning' ? 'selected' : ''}>Planning</option>
                            <option ${project.status === 'In Development' ? 'selected' : ''}>In Development</option>
                            <option ${project.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            <option ${project.status === 'Idea' ? 'selected' : ''}>Idea</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Priority</label>
                        <select id="edit-priority" class="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-200">
                            <option ${project.priority === 'Low' ? 'selected' : ''}>Low</option>
                            <option ${project.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option ${project.priority === 'High' ? 'selected' : ''}>High</option>
                            <option ${project.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Submitted</label>
                        <input type="date" id="edit-start" value="${submitted}" 
                            class="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-200">
                    </div>
                    <div>
                        <label class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Delivery</label>
                        <input type="date" id="edit-deadline" value="${delivery}" 
                            class="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-200">
                    </div>
                </div>
                
                <div>
                    <label class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-3">Technologies</label>
                    <input type="text" id="edit-tech" value="${tech.join(', ')}" 
                        placeholder="React, Node, MongoDB" 
                        class="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200">
                    <p class="text-xs text-gray-400 mt-2">Separate with commas</p>
                </div>
            </div>
            
            <div class="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button onclick="cancelEdit()" class="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                    Cancel
                </button>
                <button onclick="saveEdit()" class="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    Save Changes
                </button>
            </div>
        `;
    } else {
        // VIEW MODE
        document.getElementById('detail-title').innerText = project.name;
        document.getElementById('detail-desc').innerText = project.description || 'No description.';
        document.getElementById('detail-desc').className = "text-gray-500 mt-6 leading-relaxed max-w-3xl";

        // Reset edit button
        document.getElementById('edit-btn').innerHTML = '<i data-lucide="pencil" class="w-5 h-5"></i>';
        document.getElementById('edit-btn').title = 'Edit';
        document.getElementById('edit-btn').classList.remove('hover:text-green-600', 'text-green-600');
        document.getElementById('edit-btn').classList.add('hover:text-blue-600');

        const submitted = project.start_date ? new Date(project.start_date).toDateString() : 'N/A';
        const delivery = project.deadline ? new Date(project.deadline).toDateString() : 'N/A';
        const tech = JSON.parse(project.tech_stack_json || '[]');

        document.getElementById('detail-content').innerHTML = `
            <div class="w-full h-56 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 overflow-hidden relative group border border-gray-100">
                <span class="text-gray-400 flex flex-col items-center">
                    <i data-lucide="image" class="w-12 h-12 mb-2 opacity-50"></i>
                    <span class="text-sm font-medium">Project Preview</span>
                </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <div class="col-span-2 grid grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Status</span>
                        <span class="font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-xl text-sm inline-block">${project.status}</span>
                    </div>
                    <div>
                        <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Priority</span>
                        <span class="font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-xl text-sm inline-block">${project.priority}</span>
                    </div>
                    <div>
                        <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Submitted</span>
                        <span class="font-bold text-gray-900 text-sm">${submitted}</span>
                    </div>
                    <div>
                        <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Delivery</span>
                        <span class="font-bold text-gray-900 text-sm">${delivery}</span>
                    </div>
                </div>
                
                <div>
                    <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-3">Technologies</span>
                    <div class="flex flex-wrap gap-2">
                        ${tech.map(t => `<span class="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600">${t}</span>`).join('') || '<span class="text-gray-400 italic text-sm">None</span>'}
                    </div>
                </div>
            </div>
        `;
    }

    lucide.createIcons();
}

window.toggleEditMode = () => {
    if (isEditMode) {
        // Currently in edit mode, clicking saves
        saveEdit();
    } else {
        // Enter edit mode
        isEditMode = true;
        renderDetailView();
    }
};

window.cancelEdit = () => {
    isEditMode = false;
    uploadedMediaData = null;
    renderDetailView();
};

window.saveEdit = async () => {
    const project = appState.currentProject;
    const techStr = document.getElementById('edit-tech').value;
    const techArray = techStr.split(',').map(t => t.trim()).filter(t => t);

    const updated = {
        ...project,
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-desc').value,
        status: document.getElementById('edit-status').value,
        priority: document.getElementById('edit-priority').value,
        start_date: document.getElementById('edit-start').value,
        deadline: document.getElementById('edit-deadline').value,
        tech_stack: techArray,
        tech_stack_json: JSON.stringify(techArray)
    };

    // Add media if uploaded
    if (window.uploadedMediaData) {
        updated.media_url = window.uploadedMediaData;
    }

    try {
        const res = await fetch(`/api/projects/${project.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });

        if (res.ok) {
            uploadedMediaData = null;
            await fetchProjects();
            appState.currentProject = appState.projects.find(p => p.id === project.id);
            isEditMode = false;
            renderDetailView();
            renderSectionData(appState.activeSection);
        } else {
            alert('Failed to update project');
        }
    } catch (err) {
        console.error('Update error:', err);
        alert('Error updating project');
    }
};

// --- Update Edit Form Population ---
window.editProject = () => {
    const p = appState.currentProject;
    closeModal('projectDetailModal');

    // Populate form
    const form = document.getElementById('create-project-form');
    form.dataset.mode = 'edit';
    form.dataset.id = p.id;

    form.name.value = p.name;
    form.description.value = p.description || '';
    form.status.value = p.status;
    form.priority.value = p.priority;

    // Dates (Format YYYY-MM-DD for input type="date")
    if (p.start_date) form.start_date.value = p.start_date.split('T')[0];
    if (p.deadline) form.deadline.value = p.deadline.split('T')[0];

    // Tech
    const tech = JSON.parse(p.tech_stack_json || '[]');
    form.tech_stack_str.value = tech.join(', ');

    // Update Modal Title
    document.querySelector('#newProjectModal h3').innerText = 'Edit Project';
    document.querySelector('#newProjectModal button[type="submit"]').innerText = 'Save Changes';

    openModal('newProjectModal');
};

// --- Handle Create/Edit Project ---
window.handleCreateProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    const isEdit = form.dataset.mode === 'edit';
    const id = form.dataset.id;

    const payload = {
        name: form.name.value,
        description: form.description.value,
        status: form.status.value,
        priority: form.priority.value,
        tech_stack: form.tech_stack_str.value.split(',').map(s => s.trim()).filter(s => s),
        start_date: form.start_date.value ? new Date(form.start_date.value).toISOString() : new Date().toISOString(),
        deadline: form.deadline.value ? new Date(form.deadline.value).toISOString() : null
    };

    // Keep progress if editing, else 0
    if (isEdit && appState.currentProject) {
        payload.progress = appState.currentProject.progress;
    } else {
        payload.progress = 0;
    }

    try {
        const url = isEdit ? `api/projects/${id}` : 'api/projects';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Request failed');

        closeModal('newProjectModal');
        await fetchProjects();
        renderProjects(appState.projects);
        updateStats();

        // If we were editing, update current project ref
        if (isEdit) {
            appState.currentProject = appState.projects.find(p => p.id == id);
        }

    } catch (e) {
        console.error('Save failed', e);
        alert('Failed to save project. Ensure server is running.');
    }
};

// --- View Mode Logic ---
window.toggleViewMap = {
    'grid': 'list',
    'list': 'grid'
};

window.toggleViewMode = () => {
    appState.viewMode = window.toggleViewMap[appState.viewMode] || 'list';
    renderProjects(appState.projects);

    // Update Icon
    const icon = appState.viewMode === 'list' ? 'grid' : 'list';
    const btn = document.getElementById('view-toggle-btn');
    if (btn) btn.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5"></i>`;
    lucide.createIcons();
};

// --- Sorting Logic ---
window.sortProjects = (field) => {
    if (!appState.sort) appState.sort = { field: 'deadline', direction: 'asc' };

    if (appState.sort.field === field) {
        appState.sort.direction = appState.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        appState.sort.field = field;
        appState.sort.direction = 'asc';
    }
    filterProjects(appState.currentFilter || 'all');
};

function getSortIcon(field) {
    if (appState.sort?.field !== field) return `<i data-lucide="arrow-up-down" class="w-3 h-3 inline ml-1 opacity-20"></i>`;
    const icon = appState.sort.direction === 'asc' ? 'arrow-up' : 'arrow-down';
    return `<i data-lucide="${icon}" class="w-3 h-3 inline ml-1 text-gray-900"></i>`;
}

// --- Rendering ---
function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    if (projects.length === 0) {
        container.innerHTML = `<p class="text-gray-400 col-span-3 text-center py-10">No projects found.</p>`;
        return;
    }

    // LIST VIEW
    // Sort Projects
    if (appState.sort) {
        projects.sort((a, b) => {
            let valA = a[appState.sort.field];
            let valB = b[appState.sort.field];

            // Handle dates and numbers
            if (appState.sort.field === 'deadline') {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            } else if (appState.sort.field === 'progress') {
                valA = valA || 0;
                valB = valB || 0;
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return appState.sort.direction === 'asc' ? -1 : 1;
            if (valA > valB) return appState.sort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    if (appState.viewMode === 'list') {
        container.className = 'flex flex-col gap-4 animate-fade-in';

        // Header
        const header = document.createElement('div');
        header.className = 'grid grid-cols-12 gap-4 px-6 py-3 text-sm font-bold text-gray-500 border-b border-gray-100 uppercase tracking-wider select-none';
        header.innerHTML = `
            <div class="col-span-4 cursor-pointer hover:text-gray-800 transition-colors" onclick="sortProjects('name')">
                Project Name ${getSortIcon('name')}
            </div>
            <div class="col-span-2 cursor-pointer hover:text-gray-800 transition-colors" onclick="sortProjects('status')">
                Status ${getSortIcon('status')}
            </div>
            <div class="col-span-2 cursor-pointer hover:text-gray-800 transition-colors" onclick="sortProjects('priority')">
                Priority ${getSortIcon('priority')}
            </div>
            <div class="col-span-2 cursor-pointer hover:text-gray-800 transition-colors" onclick="sortProjects('deadline')">
                Delivery ${getSortIcon('deadline')}
            </div>
            <div class="col-span-2 cursor-pointer hover:text-gray-800 transition-colors" onclick="sortProjects('progress')">
                Progress ${getSortIcon('progress')}
            </div>
        `;
        container.appendChild(header);

        projects.forEach((project, index) => {
            const dateStr = project.deadline ? new Date(project.deadline).toLocaleDateString() : '-';

            const row = document.createElement('div');
            row.className = 'grid grid-cols-12 gap-4 px-6 py-4 bg-white rounded-2xl items-center hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-gray-100';
            row.onclick = () => openEnhancedDetail(project);

            row.innerHTML = `
                <div class="col-span-4 font-bold text-gray-900 flex items-center gap-3">
                    <img src="https://ui-avatars.com/api/?name=${project.name.charAt(0)}&background=random" class="w-8 h-8 rounded-full">
                    ${project.name}
                </div>
                <div class="col-span-2">
                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">${project.status}</span>
                </div>
                <div class="col-span-2 text-sm font-medium text-gray-700">${project.priority}</div>
                <div class="col-span-2 text-sm text-gray-500">${dateStr}</div>
                <div class="col-span-2 flex items-center gap-2">
                    <div class="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-gray-900 h-full rounded-full" style="width: ${project.progress || 0}%"></div>
                    </div>
                    <span class="text-xs font-bold text-gray-500">${project.progress || 0}%</span>
                </div>
            `;
            container.appendChild(row);
        });
        return;
    }

    // GRID VIEW
    container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
    projects.forEach((project, index) => {
        const style = cardStyles[index % cardStyles.length];
        const progress = project.progress || 0;

        const card = document.createElement('div');
        card.className = `${style.bg} card-hover rounded-[32px] p-8 flex flex-col h-[320px] cursor-pointer animate-fade-in relative overflow-hidden group`;
        card.style.animationDelay = `${index * 50}ms`;
        card.onclick = () => openEnhancedDetail(project);

        const dateStr = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No Deadline';
        const startStr = project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No Start';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                 <div class="flex flex-col">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery</span>
                    <span class="text-sm font-bold text-gray-800">${dateStr}</span>
                </div>
                <button class="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition-colors">
                    <i data-lucide="more-horizontal" class="w-5 h-5 text-gray-600"></i>
                </button>
            </div>
            
            <div class="mb-auto">
                <h3 class="text-2xl font-bold text-gray-800 mb-2 leading-tight">${project.name}</h3>
                 <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs text-gray-500">Submitted: ${startStr}</span>
                </div>
                <p class="text-gray-600 font-medium text-sm line-clamp-2">${project.status}</p>
            </div>
            
            <div class="mb-8">
                <div class="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>${progress}%</span>
                </div>
                <div class="w-full bg-white/50 h-2 rounded-full overflow-hidden">
                    <div class="${style.progress} h-full rounded-full" style="width: ${progress}%"></div>
                </div>
            </div>

            <div class="flex justify-between items-center">
                <div class="flex -space-x-3">
                     <img src="https://ui-avatars.com/api/?name=${project.name.charAt(0)}&background=random" class="w-10 h-10 rounded-full border-2 border-white">
                </div>
                 <span class="bg-white px-4 py-2 rounded-xl text-xs font-bold text-gray-700 shadow-sm">${project.priority}</span>
            </div>
        `;
        container.appendChild(card);
    });
    lucide.createIcons();
}

function updateStats() {
    const projects = appState.projects;
    const totalEl = document.getElementById('stat-total-projects');
    const inDevEl = document.getElementById('stat-in-dev');
    const upcomingEl = document.getElementById('stat-upcoming');

    if (totalEl) totalEl.innerText = projects.length;
    if (inDevEl) inDevEl.innerText = projects.filter(p => !p.status.toLowerCase().includes('done') && !p.status.toLowerCase().includes('plan')).length;
    if (upcomingEl) upcomingEl.innerText = projects.filter(p => p.status.toLowerCase().includes('plan')).length;
}

// --- Update Edit Form Population ---
window.editProject = () => {
    const p = appState.currentProject;
    closeModal('projectDetailModal');

    // Populate form
    const form = document.getElementById('create-project-form');
    form.dataset.mode = 'edit';
    form.dataset.id = p.id;

    form.name.value = p.name;
    form.description.value = p.description || '';
    form.status.value = p.status;
    form.priority.value = p.priority;

    // Dates (Format YYYY-MM-DD for input type="date")
    if (p.start_date) form.start_date.value = p.start_date.split('T')[0];
    if (p.deadline) form.deadline.value = p.deadline.split('T')[0];

    // Tech
    const tech = JSON.parse(p.tech_stack_json || '[]');
    form.tech_stack_str.value = tech.join(', ');

    // Update Modal Title
    document.querySelector('#newProjectModal h3').innerText = 'Edit Project';
    document.querySelector('#newProjectModal button[type="submit"]').innerText = 'Save Changes';

    openModal('newProjectModal');
};



window.openCreateModal = (defaultStatus = '') => {
    const form = document.getElementById('create-project-form');
    form.reset();
    form.dataset.mode = 'create';
    delete form.dataset.id;

    if (defaultStatus) {
        form.status.value = defaultStatus;
    }

    document.querySelector('#newProjectModal h3').innerText = 'New Project';
    document.querySelector('#newProjectModal button[type="submit"]').innerText = 'Create Project';

    openModal('newProjectModal');
}

window.deleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
        await fetch(`api/projects/${appState.currentProject.id}`, { method: 'DELETE' });
        closeModal('projectDetailModal');
        await fetchProjects();
        renderProjects(appState.projects);
        updateStats();
    } catch (e) { console.error('Delete failed', e); }
};

window.handleCreateProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    const isEdit = form.dataset.mode === 'edit';
    const id = form.dataset.id;

    const payload = {
        name: form.name.value,
        description: form.description.value,
        status: form.status.value,
        priority: form.priority.value,
        tech_stack: form.tech_stack_str.value.split(',').map(s => s.trim()).filter(s => s),
        start_date: form.start_date.value ? new Date(form.start_date.value).toISOString() : new Date().toISOString(),
        deadline: form.deadline.value ? new Date(form.deadline.value).toISOString() : null
    };

    // Keep progress if editing, else 0
    if (isEdit && appState.currentProject) {
        payload.progress = appState.currentProject.progress;
    } else {
        payload.progress = 0;
    }

    try {
        const url = isEdit ? `api/projects/${id}` : 'api/projects';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Request failed');

        closeModal('newProjectModal');
        await fetchProjects();
        renderProjects(appState.projects);
        updateStats();

        // If we were editing, notify or refresh details
        if (isEdit) {
            appState.currentProject = appState.projects.find(p => p.id == id);
        }

    } catch (e) {
        console.error('Save failed', e);
        alert('Failed to save project. Ensure server is running.');
    }
};

// --- Helpers ---
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');

// Stub other renderers
function renderTeam() {
    const grid = document.getElementById('team-grid');
    grid.innerHTML = appState.users.map(u => `
        <div class="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
        <img src="${u.avatar_url}" class="w-16 h-16 rounded-full">
            <div>
                <h4 class="font-bold text-gray-900">${u.name}</h4>
                <p class="text-sm text-gray-400 font-medium">${u.title}</p>
            </div>
        </div>
`).join('');
}
function renderMyTasks() {
    const list = document.getElementById('mytasks-list');
    const my = appState.tasks.filter(t => t.assigned_to_user_id == appState.currentUser.id);
    list.innerHTML = my.map(t => `
        <div class="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-4">
                 <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <i data-lucide="file-text" class="w-6 h-6"></i>
                 </div>
                 <div>
                    <h4 class="font-bold text-gray-900">${t.title}</h4>
                    <p class="text-xs text-gray-400">Due ${t.due_date}</p>
                 </div>
            </div>
            <span class="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-500">${t.status}</span>
        </div>
    `).join('');
    lucide.createIcons();
}
