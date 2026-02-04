// Stats update function
function updateProjectStats() {
    const coreProjects = appState.projects.filter(p => p.status !== 'Idea');
    const inProgress = coreProjects.filter(p => p.status === 'In Development');
    const delivered = coreProjects.filter(p => p.status === 'Delivered');
    const ideas = appState.projects.filter(p => p.status === 'Idea');

    document.getElementById('stat-total-projects').textContent = coreProjects.length;
    document.getElementById('stat-in-dev').textContent = inProgress.length;
    document.getElementById('stat-delivered').textContent = delivered.length;
    document.getElementById('stat-upcoming').textContent = ideas.length;
}

// Call this after fetching projects
window.updateProjectStats = updateProjectStats;
