
// ==========================================
// MÓDULO: TEMPLATES
// ==========================================

function renderTemplates() {
    const container = document.getElementById('templates-grid');
    if (!container) return;

    container.innerHTML = db.templates.map(template => {
        const category = db.categories.find(c => c.id === template.category) || { name: 'Outros', color: 'gray' };

        return `
            <div class="glass-dark p-6 rounded-xl card-hover border border-white/5 relative overflow-hidden group">
                <!-- Glow Effect -->
                <div class="absolute -top-10 -right-10 w-24 h-24 bg-${category.color}-500/10 rounded-full blur-2xl group-hover:bg-${category.color}-500/20 transition-all duration-500"></div>

                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-10 h-10 rounded-full bg-${category.color}-100 flex items-center justify-center">
                            <i data-lucide="${category.icon || 'file-text'}" class="w-5 h-5 text-${category.color}-600"></i>
                        </div>
                        <span class="text-xs font-bold bg-slate-100 px-2 py-1 rounded">
                            ${template.tasks?.length || 0} tarefas
                        </span>
                    </div>

                    <h3 class="font-bold text-lg text-white mb-2">${sanitizeHTML(template.name)}</h3>
                    <p class="text-sm text-slate-600 mb-4">${sanitizeHTML(template.description || '')}</p>

                    <button onclick="useTemplate('${template.id}')"
                        class="w-full mt-4 bg-brand-green text-white py-2 rounded-lg text-sm font-bold hover:bg-brand-dark transition-colors">
                        Usar Template
                    </button>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function useTemplate(templateId) {
    const template = db.templates.find(t => t.id === templateId);
    if (!template) return;

    const checklist = {
        id: getID(),
        title: template.name,
        category: template.category,
        description: template.description,
        tasks: template.tasks?.map(task => ({
            text: task,
            completed: false,
            createdAt: new Date().toISOString()
        })) || [],
        completed: false,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    db.checklists.push(checklist);
    save();

    router('my-checklists');
    showNotification('Checklist criado a partir do template!', 'success');
}

function openTemplateModal() {
    document.getElementById('templateModal').classList.remove('hidden');
}

// Expor globalmente
window.renderTemplates = renderTemplates;
window.useTemplate = useTemplate;
window.openTemplateModal = openTemplateModal;
