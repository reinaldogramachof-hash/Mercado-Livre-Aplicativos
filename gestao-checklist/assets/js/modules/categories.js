
// ==========================================
// MÓDULO: CATEGORIAS
// ==========================================

function renderCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;

    container.innerHTML = db.categories.map(cat => {
        const categoryChecklists = db.checklists.filter(c => c.category === cat.id).length;

        return `
            <div class="glass-dark p-6 rounded-xl card-hover border border-white/5 relative overflow-hidden group">
                <!-- Glow Effect -->
                <div class="absolute -top-10 -right-10 w-24 h-24 bg-${cat.color}-500/10 rounded-full blur-2xl group-hover:bg-${cat.color}-500/20 transition-all duration-500"></div>

                <div class="relative z-10">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 rounded-full bg-${cat.color}-100 flex items-center justify-center">
                            <i data-lucide="${cat.icon}" class="w-5 h-5 text-${cat.color}-600"></i>
                        </div>
                        <span class="text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                            ${categoryChecklists} checklists
                        </span>
                    </div>

                    <h3 class="font-bold text-lg text-white mb-2">${sanitizeHTML(cat.name)}</h3>

                    <button onclick="filterByCategory('${cat.id}')"
                        class="mt-4 text-sm font-bold text-${cat.color}-600 hover:text-${cat.color}-800">
                        Ver checklists →
                    </button>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function openCategoryModal() {
    document.getElementById('categoryModal').classList.remove('hidden');
}

function populateCategorySelects() {
    const selects = [
        document.getElementById('cl-category'),
        document.getElementById('rep-category'),
        document.getElementById('filter-category')
    ];

    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">Todas Categorias</option>';
        db.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    });
}

// Expor globalmente
window.renderCategories = renderCategories;
window.openCategoryModal = openCategoryModal;
window.populateCategorySelects = populateCategorySelects;
