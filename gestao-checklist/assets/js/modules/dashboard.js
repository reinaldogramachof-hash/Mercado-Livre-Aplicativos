
// ==========================================
// MÓDULO: DASHBOARD
// ==========================================

function updateDashboardStats() {
    const activeChecklists = db.checklists.filter(c => !c.completed).length;
    const completedToday = db.checklists.filter(c => {
        if (!c.completedAt) return false;
        const completedDate = new Date(c.completedAt).toDateString();
        const today = new Date().toDateString();
        return completedDate === today;
    }).length;

    const totalTasks = db.checklists.reduce((sum, c) => sum + (c.tasks?.length || 0), 0);
    const completedTasks = db.checklists.reduce((sum, c) => {
        return sum + (c.tasks?.filter(t => t.completed)?.length || 0);
    }, 0);

    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const dashActive = document.getElementById('dash-active');
    const dashCompletedToday = document.getElementById('dash-completed-today');
    const dashProductivity = document.getElementById('dash-productivity');
    const dashTemplates = document.getElementById('dash-templates');

    if (dashActive) dashActive.innerText = activeChecklists;
    if (dashCompletedToday) dashCompletedToday.innerText = completedToday;
    if (dashProductivity) dashProductivity.innerText = `${productivity}%`;
    if (dashTemplates) dashTemplates.innerText = db.templates.length;
}

// Expor globalmente
window.updateDashboardStats = updateDashboardStats;
