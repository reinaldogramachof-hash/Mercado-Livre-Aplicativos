
// ==========================================
// MÓDULO: RELATÓRIOS
// ==========================================

function generateReport() {
    const start = document.getElementById('rep-start').value;
    const end = document.getElementById('rep-end').value;
    const category = document.getElementById('rep-category').value;

    if (!start || !end) {
        alert('Por favor, selecione um período.');
        return;
    }

    const filtered = db.checklists.filter(c => {
        const created = new Date(c.createdAt);
        const matchesDate = created >= new Date(start) && created <= new Date(end);
        const matchesCategory = !category || c.category === category;
        return matchesDate && matchesCategory;
    });

    const total = filtered.length;
    const completed = filtered.filter(c => c.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calcular tempo médio (simulação)
    const avgTime = total > 0 ? Math.floor(Math.random() * 60) + 15 : 0;

    document.getElementById('rep-total').textContent = total;
    document.getElementById('rep-completed').textContent = completed;
    document.getElementById('rep-completion-rate').textContent = `${completionRate}%`;
    document.getElementById('rep-avg-time').textContent = `${avgTime} min`;

    // Distribuição por categoria
    renderCategoryDistribution(filtered);

    document.getElementById('report-result').classList.remove('hide');
}

function renderCategoryDistribution(checklists) {
    const container = document.getElementById('category-distribution');
    if (!container) return;

    const distribution = {};
    checklists.forEach(c => {
        const catName = db.categories.find(cat => cat.id === c.category)?.name || 'Outros';
        distribution[catName] = (distribution[catName] || 0) + 1;
    });

    container.innerHTML = Object.entries(distribution).map(([name, count]) => `
        <div class="text-center p-4 glass-dark rounded-xl border border-white/5 relative overflow-hidden group">
            <!-- Glow Effect -->
            <div class="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>

            <div class="relative z-10">
                <p class="text-xs text-slate-500 uppercase font-bold">${name}</p>
                <p class="text-2xl font-bold text-white mt-2">${count}</p>
            </div>
        </div>
    `).join('');
}

// Expor globalmente
window.generateReport = generateReport;
window.renderCategoryDistribution = renderCategoryDistribution;
