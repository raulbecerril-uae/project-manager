// Project Management System Dashboard Logic

const appState = {
    projects: [],
    users: [],
    tasks: [],
    currentUser: null,
    currentProject: null, // For details/edit
    activeSection: 'projects' // Default section
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

    // Track active section for refresh operations
    console.log('Switching to section:', sectionId);
    appState.activeSection = sectionId;
};

// --- Data Fetching ---
async function fetchProjects() {
    try {
        const res = await fetch(window.API.projects);
        appState.projects = await res.json();
    } catch (e) { console.error(e); }
}

async function fetchUsers() {
    try {
        const res = await fetch(window.API.users);
        appState.users = await res.json();
    } catch (e) { console.error(e); }
}

async function fetchAllTasks() {
    try {
        const res = await fetch(window.API.tasks);
        appState.tasks = await res.json();
    } catch (e) { console.error(e); }
}

// Stats update function
function updateProjectStats() {
    // "Total" now includes EVERYTHING (Ideas, Upcoming, Active, etc.)
    const total = appState.projects.length;

    const planning = appState.projects.filter(p => p.status === 'Planning');
    const inProgress = appState.projects.filter(p => p.status === 'In Development');
    const delivered = appState.projects.filter(p => p.status === 'Delivered' || p.status === 'Done' || p.status === 'Completed');
    const upcoming = appState.projects.filter(p => p.status === 'Idea' || p.status === 'Upcoming');

    animateValue('stat-total-projects', 0, total, 1000);
    animateValue('stat-planning', 0, planning.length, 1000);
    animateValue('stat-in-dev', 0, inProgress.length, 1000);
    animateValue('stat-delivered', 0, delivered.length, 1000);
    animateValue('stat-upcoming', 0, upcoming.length, 1000);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;

    // If end is 0, just show 0 immediately
    if (end === 0) {
        obj.textContent = 0;
        return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);

        // Easing function (easeOutExpo) for smooth effect
        const easeOut = 1 - Math.pow(2, -10 * progress);

        obj.textContent = Math.floor(progress * (end - start) + start);

        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.textContent = end;
        }
    };
    window.requestAnimationFrame(step);
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
    } else if (sectionId === 'settings') {
        renderSettings();
    }
}

// --- Filter Logic ---
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

    // Determine context based on active section
    if (appState.activeSection === 'ideas') {
        // If we are in ideas section, filtering might be different or not needed yet
        // For now, re-render ideas
        renderIdeas();
        return;
    }

    if (filter === 'all') {
        filtered = appState.projects.filter(p => p.status !== 'Idea' && p.status !== 'Upcoming');
    } else if (filter === 'planning') {
        filtered = appState.projects.filter(p => p.status === 'Planning');
    } else if (filter === 'inprogress') {
        filtered = appState.projects.filter(p => p.status === 'In Development');
    } else if (filter === 'delivered') {
        filtered = appState.projects.filter(p => p.status === 'Delivered' || p.status === 'Done' || p.status === 'Completed');
    } else if (filter === 'upcoming') {
        filtered = appState.projects.filter(p => p.status === 'Idea' || p.status === 'Upcoming');
    }

    // Apply smart sorting
    filtered = smartSort(filtered || []);
    renderProjects(filtered);
};

window.toggleViewMode = () => {
    console.log('Toggling view mode. Current:', appState.viewMode, 'Active Section:', appState.activeSection);
    appState.viewMode = appState.viewMode === 'list' ? 'card' : 'list';
    console.log('New view mode:', appState.viewMode);

    if (!appState.activeSection) {
        console.warn('No active section found. Defaulting to projects.');
        appState.activeSection = 'projects';
    }

    renderSectionData(appState.activeSection);
};


function renderIdeas() {
    const container = document.getElementById('ideas-container');
    const ideas = appState.projects.filter(p => p.status === 'Idea');
    const totalIdeasEl = document.getElementById('stat-total-ideas');
    if (totalIdeasEl) totalIdeasEl.innerText = ideas.length;

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

    if (appState.viewMode === 'list') {
        container.className = 'flex flex-col gap-3 animate-fade-in w-full';

        // Header
        const header = document.createElement('div');
        header.className = 'hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2';
        header.innerHTML = `
            <div class="col-span-4">Project</div>
            <div class="col-span-2">Status</div>
            <div class="col-span-2">Priority</div>
            <div class="col-span-2">Deadline</div>
            <div class="col-span-2 text-right">Progress</div>
        `;
        container.appendChild(header);

        projects.forEach((project) => {
            const row = document.createElement('div');
            row.className = 'bg-white p-4 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-50 cursor-pointer transition-colors shadow-sm hover:shadow-md';
            row.onclick = () => openEnhancedDetail(project);

            const dateStr = project.deadline ? new Date(project.deadline).toLocaleDateString() : '-';

            row.innerHTML = `
                <div class="col-span-1 md:col-span-4 flex items-center gap-4">
                    <img src="https://ui-avatars.com/api/?name=${project.name.charAt(0)}&background=random" class="w-8 h-8 rounded-full">
                    <div>
                        <h4 class="font-bold text-gray-900 line-clamp-1">${project.name}</h4>
                        <p class="text-xs text-gray-400 md:hidden">${project.status}</p>
                    </div>
                </div>
                <div class="col-span-1 md:col-span-2 hidden md:block">
                    <span class="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-500">${project.status}</span>
                </div>
                <div class="col-span-1 md:col-span-2 hidden md:block">
                     <span class="text-xs font-bold text-gray-600">${project.priority}</span>
                </div>
                <div class="col-span-1 md:col-span-2 hidden md:block">
                    <div class="text-xs text-gray-500">${dateStr}</div>
                </div>
                 <div class="col-span-1 md:col-span-2 flex items-center gap-2 justify-end">
                    <div class="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-blue-500 h-full rounded-full" style="width: ${project.progress || 0}%"></div>
                    </div>
                    <span class="text-xs font-bold text-gray-400 w-8 text-right">${project.progress || 0}%</span>
                </div>
             `;
            container.appendChild(row);
        });

    } else {
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
    }
    lucide.createIcons();
}

// --- Update Detail View ---
let isEditMode = false;
let uploadedMediaData = null;

window.handleMediaUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading state
    const preview = document.getElementById('media-preview');
    preview.innerHTML = `<div class="flex flex-col items-center justify-center text-blue-500"><i data-lucide="loader-2" class="w-8 h-8 animate-spin mb-2"></i><span class="text-xs font-bold">Uploading...</span></div>`;
    lucide.createIcons();

    const formData = new FormData();
    formData.append('media', file);

    try {
        const res = await fetch(window.API.upload, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            uploadedMediaData = data.url; // URL path from server

            // Render preview
            if (file.type.startsWith('video/')) {
                preview.innerHTML = `<video src="${uploadedMediaData}" class="w-full h-full object-cover" controls></video>`;
            } else {
                preview.innerHTML = `<img src="${uploadedMediaData}" class="w-full h-full object-cover" alt="Project media">`;
            }
        } else {
            console.error('Upload failed:', data.error);
            alert('Upload failed: ' + (data.error || 'Unknown error'));
            preview.innerHTML = `<span class="text-red-400 text-sm">Upload failed</span>`;
        }
    } catch (err) {
        console.error('Upload error:', err);
        alert('Upload error. See console.');
        preview.innerHTML = `<span class="text-red-400 text-sm">Error</span>`;
    }
    lucide.createIcons();
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


            <!-- Main Grid Container -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">

            <!-- LEFT COLUMN: Metadata (Edit Mode) --> 
            <div class="lg:col-span-2 space-y-8">
                <div class="grid grid-cols-2 gap-x-8 gap-y-4">
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

            <!-- RIGHT COLUMN: Estimation (Edit Mode) -->
            <div class="lg:col-span-1">
                <div class="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 h-full">
                    <h3 class="text-xs text-blue-500 font-bold uppercase tracking-wider block mb-4 flex items-center gap-2">
                        <i data-lucide="timer" class="w-4 h-4"></i> Project Estimation
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Est. Duration</label>
                            <input type="text" id="edit-duration" value="${project.estimated_duration || ''}" 
                                placeholder="e.g. 2 months"
                                class="w-full bg-white border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-200">
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Required Team</label>
                            <textarea id="edit-team" rows="6" 
                                placeholder="Role: Count (one per line)&#10;Backend Developer: 2&#10;UI Designer: 1"
                                class="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-200 font-mono text-gray-700 leading-relaxed shadow-sm">${(project.required_team || []).map(m => `${m.role}: ${m.count}`).join('\n')}</textarea>
                            <p class="text-xs text-gray-400 mt-2">Format: "Role: Count"</p>
                        </div>
                    </div>
                </div>
            </div>
            
            </div> <!-- End Grid -->
            
            <div class="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button onclick="cancelEdit()" class="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                    Cancel
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
                ${project.media_url ?
                (project.media_url.match(/\.(mp4|webm|ogg)$/i) ?
                    `<video src="${project.media_url}" class="w-full h-full object-cover" controls></video>` :
                    `<img src="${project.media_url}" class="w-full h-full object-cover" alt="Project media">`)
                :
                `<span class="text-gray-400 flex flex-col items-center">
                    <i data-lucide="image" class="w-12 h-12 mb-2 opacity-50"></i>
                    <span class="text-sm font-medium">Project Preview</span>
                </span>`}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                <!-- LEFT COLUMN: Metadata & Tech -->
                <div class="lg:col-span-2 space-y-8">
                    <div class="grid grid-cols-2 gap-x-8 gap-y-6">
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

                <!-- RIGHT COLUMN: Estimation -->
                <div class="lg:col-span-1">
                    <div class="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 h-full">
                        <h3 class="text-xs text-blue-500 font-bold uppercase tracking-wider block mb-6 flex items-center gap-2">
                            <i data-lucide="timer" class="w-4 h-4"></i> Project Estimation
                        </h3>
                        
                        <div class="space-y-6">
                            <div>
                                <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Est. Duration</span>
                                <span class="font-bold text-gray-900 text-xl block">${project.estimated_duration || 'Not set'}</span>
                            </div>
                            
                            <div>
                                <span class="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-3">Required Team</span>
                                <div class="space-y-3">
                                    ${(project.required_team || []).map(member => `
                                        <div class="flex items-center justify-between text-sm group">
                                            <div class="flex items-center gap-3 text-gray-700">
                                                <div class="w-8 h-8 rounded-full bg-white border border-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shadow-sm">
                                                    ${member.role.charAt(0)}
                                                </div>
                                                <span class="font-medium group-hover:text-blue-600 transition-colors">${member.role}</span>
                                            </div>
                                            <span class="font-bold text-gray-900 bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm text-xs">x${member.count}</span>
                                        </div>
                                    `).join('') || '<span class="text-gray-400 italic text-sm">No team requirements specified</span>'}
                                </div>
                            </div>
                        </div>
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
        tech_stack_json: JSON.stringify(techArray),
        estimated_duration: document.getElementById('edit-duration')?.value,
        required_team: document.getElementById('edit-team')?.value.split('\n')
            .map(line => {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    return {
                        role: parts[0].trim(),
                        count: parseInt(parts[1].trim()) || 1
                    };
                }
                return null;
            }).filter(item => item) || []
    };

    // Also save required_team as JSON string for compatibility
    updated.required_team_json = JSON.stringify(updated.required_team);

    // Add media if uploaded
    // Add media if uploaded
    if (uploadedMediaData) {
        updated.media_url = uploadedMediaData;
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





// Reusable upload helper
window.uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('media', file);

    const res = await fetch(window.API.upload, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.url;
};

window.openCreateModal = (defaultStatus = '') => {
    const form = document.getElementById('create-project-form');
    form.reset();
    form.dataset.mode = 'create';
    delete form.dataset.id;

    const optionalFields = document.getElementById('optional-fields');
    const mediaInput = document.getElementById('create-media-upload');
    if (mediaInput) mediaInput.value = ''; // Reset file input

    if (defaultStatus) {
        form.status.value = defaultStatus;
    }

    if (defaultStatus === 'Idea') {
        document.querySelector('#newProjectModal h3').innerText = 'Submit Future Concept';
        document.querySelector('#newProjectModal button[type="submit"]').innerText = 'Submit Concept';
        if (optionalFields) optionalFields.classList.add('hidden');
    } else {
        document.querySelector('#newProjectModal h3').innerText = 'New Project';
        document.querySelector('#newProjectModal button[type="submit"]').innerText = 'Create Project';
        if (optionalFields) optionalFields.classList.remove('hidden');
    }

    openModal('newProjectModal');
}

window.deleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
        await fetch(`api/projects/${appState.currentProject.id}`, { method: 'DELETE' });
        closeModal('projectDetailModal');
        await fetchProjects();
        renderProjects(appState.projects);
        updateProjectStats();
    } catch (e) { console.error('Delete failed', e); }
};

window.handleCreateProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    const isEdit = form.dataset.mode === 'edit';
    const id = form.dataset.id;

    // Handle Media Upload First
    let mediaUrl = null;
    const mediaInput = document.getElementById('create-media-upload');
    if (mediaInput && mediaInput.files[0]) {
        try {
            // Show some loading indication if needed, or just wait
            mediaUrl = await uploadFile(mediaInput.files[0]);
        } catch (err) {
            console.error('Upload failed during creation:', err);
            alert('Media upload failed: ' + err.message);
            return; // Stop creation
        }
    }

    const payload = {
        name: form.name.value,
        description: form.description.value,
        status: form.status.value,
        priority: form.priority.value,
        tech_stack: form.tech_stack_str.value.split(',').map(s => s.trim()).filter(s => s),
        start_date: form.start_date.value ? new Date(form.start_date.value).toISOString() : new Date().toISOString(),
        deadline: form.deadline.value ? new Date(form.deadline.value).toISOString() : null
    };

    if (mediaUrl) {
        payload.media_url = mediaUrl;
    }

    // Keep progress if editing, else 0
    if (isEdit && appState.currentProject) {
        payload.progress = appState.currentProject.progress;
        // Keep existing media if no new one uploaded
        if (!mediaUrl && appState.currentProject.media_url) {
            payload.media_url = appState.currentProject.media_url;
        }
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

        // Refresh views correctly
        updateProjectStats();
        renderIdeas(); // Update Ideas section
        // Update main dashboard with current filter (default 'all' hides ideas)
        filterProjects(appState.currentFilter || 'all');

        // If we were editing, notify or refresh details
        if (isEdit) {
            appState.currentProject = appState.projects.find(p => p.id == id);
            renderDetailView(); // Refresh detail view to show new changes
        }

    } catch (e) {
        console.error('Save failed', e);
        alert('Failed to save project/idea. Ensure server is running.');
    }
};

// --- Helpers ---
window.closeModal = (id) => document.getElementById(id).classList.add('hidden');
window.openModal = (id) => document.getElementById(id).classList.remove('hidden');


function renderTeam() {
    const container = document.getElementById('team-grid');
    container.innerHTML = '';

    if (appState.viewMode === 'list') {
        container.className = 'flex flex-col gap-3 animate-fade-in w-full';
        appState.users.forEach(u => {
            const div = document.createElement('div');
            div.className = 'bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50';
            div.innerHTML = `
                <div class="flex items-center gap-4">
                    <img src="${u.avatar_url}" class="w-10 h-10 rounded-full">
                    <div>
                        <h4 class="font-bold text-gray-900">${u.name}</h4>
                        <p class="text-sm text-gray-400 font-medium">${u.title}</p>
                    </div>
                </div>
                <div class="text-sm text-gray-500">${u.role}</div>
            `;
            container.appendChild(div);
        });
    } else {
        container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
        container.innerHTML = appState.users.map(u => `
            <div class="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
            <img src="${u.avatar_url}" class="w-16 h-16 rounded-full">
                <div>
                    <h4 class="font-bold text-gray-900">${u.name}</h4>
                    <p class="text-sm text-gray-400 font-medium">${u.title}</p>
                </div>
            </div>
        `).join('');
    }
}

function renderMyTasks() {
    const container = document.getElementById('mytasks-list');
    const my = appState.tasks.filter(t => t.assigned_to_user_id == appState.currentUser.id);
    container.innerHTML = '';

    if (appState.viewMode === 'list') {
        container.className = 'space-y-3';
        container.innerHTML = my.map(t => `
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
    } else {
        // Grid view for tasks
        container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        container.innerHTML = my.map(t => `
            <div class="bg-white p-6 rounded-[32px] border border-gray-100 hover:shadow-lg transition-shadow flex flex-col h-48 justify-between">
                <div>
                     <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
                        <i data-lucide="file-text" class="w-5 h-5"></i>
                     </div>
                     <h4 class="font-bold text-gray-900 text-lg line-clamp-2">${t.title}</h4>
                </div>
                <div class="flex justify-between items-center">
                    <p class="text-xs text-gray-400">Due ${t.due_date}</p>
                    <span class="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-500">${t.status}</span>
                </div>
            </div>
        `).join('');
    }
    lucide.createIcons();
}

// --- Settings Logic ---
window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// Initialize Theme
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.checked = true;
}

window.exportData = () => {
    const data = {
        projects: appState.projects,
        tasks: appState.tasks,
        users: appState.users,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

function renderSettings() {
    if (appState.currentUser) {
        document.getElementById('settings-avatar').src = appState.currentUser.avatar_url;
        document.getElementById('settings-name').innerText = appState.currentUser.name;
        document.getElementById('settings-role').innerText = appState.currentUser.role;
    }
}
