
// ==========================================
// MÓDULO: CHECKLISTS
// ==========================================

function openChecklistModal(checklist = null) {
    const modal = document.getElementById('checklistModal');
    const form = document.getElementById('checklistForm');

    if (checklist) {
        document.getElementById('cl-id').value = checklist.id;
        document.getElementById('cl-title').value = checklist.title;
        document.getElementById('cl-category').value = checklist.category || 'other';
        document.getElementById('cl-priority').value = checklist.priority || 'medium';
        document.getElementById('cl-description').value = checklist.description || '';
        document.getElementById('cl-deadline').value = checklist.deadline || '';

        // Preencher tarefas
        const tasksContainer = document.getElementById('tasks-container');
        tasksContainer.innerHTML = '';
        if (checklist.tasks && checklist.tasks.length > 0) {
            checklist.tasks.forEach((task, index) => {
                addTask(task.text, task.completed, index);
            });
        } else {
            addTask();
            addTask();
        }
    } else {
        form.reset();
        document.getElementById('cl-id').value = '';
        const tasksContainer = document.getElementById('tasks-container');
        tasksContainer.innerHTML = '';
        addTask();
        addTask();
    }

    modal.classList.remove('hidden');
}

function addTask(text = '', completed = false, index = null) {
    const container = document.getElementById('tasks-container');
    const taskId = index !== null ? index : container.children.length;

    const taskHTML = `
        <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input type="checkbox" ${completed ? 'checked' : ''}
                   class="mt-1 w-5 h-5 rounded border-slate-300 text-brand-green focus:ring-brand-green">
            <input type="text" value="${sanitizeHTML(text)}"
                   class="flex-1 border-0 bg-transparent p-0 focus:ring-0 outline-none"
                   placeholder="Descreva a tarefa...">
            <button type="button" onclick="removeTask(this)" class="text-slate-400 hover:text-red-500">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `;

    if (index !== null) {
        const existingTask = container.children[index];
        if (existingTask) {
            existingTask.outerHTML = taskHTML;
        } else {
            container.insertAdjacentHTML('beforeend', taskHTML);
        }
    } else {
        container.insertAdjacentHTML('beforeend', taskHTML);
    }

    lucide.createIcons();
}

function removeTask(button) {
    const container = document.getElementById('tasks-container');
    if (container.children.length > 1) {
        button.closest('.flex').remove();
    }
}

function submitChecklist(e) {
    e.preventDefault();

    const id = document.getElementById('cl-id').value;
    const title = document.getElementById('cl-title').value.trim();
    const category = document.getElementById('cl-category').value;
    const priority = document.getElementById('cl-priority').value;
    const description = document.getElementById('cl-description').value.trim();
    const deadline = document.getElementById('cl-deadline').value;

    if (!title) {
        alert('Por favor, insira um título para o checklist.');
        return;
    }

    // Coletar tarefas
    const taskElements = document.querySelectorAll('#tasks-container .flex');
    const tasks = Array.from(taskElements).map(el => {
        const checkbox = el.querySelector('input[type="checkbox"]');
        const input = el.querySelector('input[type="text"]');
        return {
            text: input.value.trim(),
            completed: checkbox.checked,
            createdAt: new Date().toISOString()
        };
    }).filter(task => task.text); // Remover tarefas vazias

    const checklist = {
        id: id || getID(),
        title,
        category,
        priority,
        description,
        deadline: deadline || null,
        tasks,
        completed: tasks.length > 0 && tasks.every(t => t.completed),
        favorite: false,
        createdAt: id ? db.checklists.find(c => c.id === id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null
    };

    // Atualizar completed e completedAt
    if (tasks.length > 0 && tasks.every(t => t.completed)) {
        checklist.completed = true;
        checklist.completedAt = checklist.completedAt || new Date().toISOString();
    } else {
        checklist.completed = false;
        checklist.completedAt = null;
    }

    if (id) {
        // Atualizar checklist existente
        const index = db.checklists.findIndex(c => c.id === id);
        if (index !== -1) {
            db.checklists[index] = { ...db.checklists[index], ...checklist };
        }
    } else {
        // Adicionar novo checklist
        db.checklists.push(checklist);
    }

    save();
    closeModal('checklistModal');

    if (document.getElementById('view-my-checklists').classList.contains('hide') === false) {
        renderChecklists();
    }

    updateDashboardStats();
    renderRecentChecklists();

    showNotification('Checklist salvo com sucesso!', 'success');
}

function renderRecentChecklists() {
    const container = document.getElementById('recent-checklists');
    if (!container) return;

    const recent = db.checklists
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);

    if (recent.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-center text-sm py-4">Nenhum checklist recente.</p>';
        return;
    }

    container.innerHTML = recent.map(c => {
        const total = c.tasks?.length || 0;
        const done = c.tasks?.filter(t => t.completed).length || 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return `
            <div class="glass-dark p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/5 border border-white/5 transition-colors group relative overflow-hidden" onclick="editChecklist('${c.id}')">
                <!-- Glow Effect -->
                <div class="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>

                <div class="relative z-10">
                    <h4 class="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">${sanitizeHTML(c.title)}</h4>
                    <p class="text-xs text-slate-500 mt-1">${pct}% concluído</p>
                </div>
                <div class="w-8 h-8 rounded-full bg-emerald-100/50 flex items-center justify-center">
                    <i data-lucide="chevron-right" class="w-4 h-4 text-emerald-600"></i>
                </div>
            </div>
         `;
    }).join('');
    lucide.createIcons();
}

function renderChecklists() {
    const container = document.getElementById('checklists-grid');
    if (!container) return;

    const searchTerm = document.getElementById('search-checklists')?.value.toLowerCase() || '';
    const filter = document.querySelector('#view-my-checklists .bg-brand-green')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1] || 'all';
    const categoryFilter = document.getElementById('filter-category')?.value || '';

    let filtered = db.checklists.filter(checklist => {
        const matchesSearch = checklist.title.toLowerCase().includes(searchTerm) ||
            checklist.description?.toLowerCase().includes(searchTerm);
        const matchesFilter = filter === 'all' ? true :
            filter === 'active' ? !checklist.completed :
                filter === 'completed' ? checklist.completed :
                    filter === 'favorite' ? checklist.favorite : true;
        const matchesCategory = !categoryFilter || checklist.category === categoryFilter;

        return matchesSearch && matchesFilter && matchesCategory;
    });

    // Ordenar por data de criação (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i data-lucide="list-checks" class="w-16 h-16 mx-auto mb-4 text-slate-300"></i>
                <h3 class="text-lg font-bold text-slate-800 mb-2">Nenhum checklist encontrado</h3>
                <p class="text-slate-500 mb-6">Crie seu primeiro checklist clicando no botão acima.</p>
                <button onclick="openChecklistModal()"
                    class="inline-flex items-center gap-2 px-6 py-3 bg-brand-green text-white rounded-lg font-bold hover:bg-brand-dark">
                    <i data-lucide="plus" class="w-5 h-5"></i>
                    Criar Checklist
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(checklist => {
        const completedTasks = checklist.tasks?.filter(t => t.completed)?.length || 0;
        const totalTasks = checklist.tasks?.length || 0;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const category = db.categories.find(c => c.id === checklist.category) || { name: 'Outros', color: 'gray' };

        return `
            <div class="glass-dark p-6 rounded-xl card-hover border border-white/5 relative overflow-hidden group" >
                <!-- Glow Effect -->
                <div class="absolute -top-10 -right-10 w-24 h-24 bg-${category.color}-500/10 rounded-full blur-2xl group-hover:bg-${category.color}-500/20 transition-all duration-500"></div>

                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-${category.color}-100 flex items-center justify-center">
                                <i data-lucide="${category.icon || 'folder'}" class="w-5 h-5 text-${category.color}-600"></i>
                            </div>
                            <div>
                                <span class="text-xs font-bold text-${category.color}-600">${category.name}</span>
                                <div class="flex items-center gap-2">
                                    <h3 class="font-bold text-white text-base leading-tight">${sanitizeHTML(checklist.title)}</h3>
                                    ${checklist.favorite ? '<i data-lucide="star" class="w-4 h-4 text-yellow-500 fill-yellow-500"></i>' : ''}
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="toggleFavorite('${checklist.id}')" class="text-slate-400 hover:text-yellow-500">
                                <i data-lucide="${checklist.favorite ? 'star' : 'star'}" class="w-4 h-4 ${checklist.favorite ? 'fill-yellow-500 text-yellow-500' : ''}"></i>
                            </button>
                            <button onclick="editChecklist('${checklist.id}')" class="text-slate-400 hover:text-brand-green">
                                <i data-lucide="edit" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    ${checklist.description ? `<p class="text-sm text-slate-600 mb-4">${sanitizeHTML(checklist.description)}</p>` : ''}

                    <div class="mb-4">
                        <div class="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Progresso</span>
                            <span>${progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-500">${completedTasks}/${totalTasks} tarefas</span>
                    <div class="flex gap-2">
                        ${!checklist.completed ? `
                            <button onclick="completeChecklist('${checklist.id}')"
                                    class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200">
                                Concluir
                            </button>
                        ` : `
                            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                Concluído
                            </span>
                        `}
                        <button onclick="deleteChecklist('${checklist.id}')"
                                class="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200">
                            Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function filterChecklists(filterType = null) {
    // Atualizar botões ativos
    const buttons = ['all', 'active', 'completed', 'favorite'];
    buttons.forEach(btn => {
        const button = document.getElementById(`filter-${btn}`);
        if (button) {
            if (btn === (filterType || 'all')) {
                button.classList.remove('bg-slate-100', 'text-slate-700');
                button.classList.add('bg-brand-green', 'text-white');
            } else {
                button.classList.remove('bg-brand-green', 'text-white');
                button.classList.add('bg-slate-100', 'text-slate-700');
            }
        }
    });

    renderChecklists();
}

function filterByCategory(categoryId) {
    document.getElementById('filter-category').value = categoryId;
    router('my-checklists');
    filterChecklists('all');
}

function toggleFavorite(checklistId) {
    const index = db.checklists.findIndex(c => c.id === checklistId);
    if (index !== -1) {
        db.checklists[index].favorite = !db.checklists[index].favorite;
        save();
        renderChecklists();
    }
}

function editChecklist(checklistId) {
    const checklist = db.checklists.find(c => c.id === checklistId);
    if (checklist) {
        openChecklistModal(checklist);
    }
}

function completeChecklist(checklistId) {
    const index = db.checklists.findIndex(c => c.id === checklistId);
    if (index !== -1) {
        if (confirm('Marcar este checklist como concluído?')) {
            db.checklists[index].completed = true;
            db.checklists[index].completedAt = new Date().toISOString();
            // Marcar todas as tarefas como concluídas
            if (db.checklists[index].tasks) {
                db.checklists[index].tasks.forEach(task => {
                    task.completed = true;
                });
            }
            save();
            renderChecklists();
            updateDashboardStats();
            showNotification('Checklist concluído!', 'success');
        }
    }
}

function deleteChecklist(checklistId) {
    if (confirm('Tem certeza que deseja excluir este checklist?')) {
        db.checklists = db.checklists.filter(c => c.id !== checklistId);
        save();
        renderChecklists();
        updateDashboardStats();
        showNotification('Checklist excluído!', 'success');
    }
}

function openQuickChecklist() {
    document.getElementById('quickChecklistModal').classList.remove('hidden');
}

function addQuickTask() {
    const container = document.getElementById('quick-tasks');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'w-full border p-2 rounded-lg text-sm';
    input.placeholder = `Tarefa ${container.children.length + 1}`;
    container.appendChild(input);
}

function submitQuickChecklist(e) {
    e.preventDefault();

    const title = document.getElementById('quick-title').value.trim();
    const taskInputs = document.querySelectorAll('#quick-tasks input');
    const tasks = Array.from(taskInputs)
        .map(input => input.value.trim())
        .filter(task => task);

    if (!title || tasks.length === 0) {
        alert('Por favor, insira um título e pelo menos uma tarefa.');
        return;
    }

    const checklist = {
        id: getID(),
        title,
        category: 'personal',
        tasks: tasks.map(text => ({
            text,
            completed: false,
            createdAt: new Date().toISOString()
        })),
        completed: false,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    db.checklists.push(checklist);
    save();
    closeModal('quickChecklistModal');

    updateDashboardStats();
    renderRecentChecklists();

    if (document.getElementById('view-my-checklists').classList.contains('hide') === false) {
        renderChecklists();
    }

    showNotification('Checklist rápido criado!', 'success');
}

// Expor globalmente
window.openChecklistModal = openChecklistModal;
window.addTask = addTask;
window.removeTask = removeTask;
window.submitChecklist = submitChecklist;
window.renderChecklists = renderChecklists;
window.renderRecentChecklists = renderRecentChecklists;
window.filterChecklists = filterChecklists;
window.filterByCategory = filterByCategory;
window.toggleFavorite = toggleFavorite;
window.editChecklist = editChecklist;
window.completeChecklist = completeChecklist;
window.deleteChecklist = deleteChecklist;
window.openQuickChecklist = openQuickChecklist;
window.addQuickTask = addQuickTask;
window.submitQuickChecklist = submitQuickChecklist;
