// ============================================================
// reports.js — Vendas, Clientes, Fornecedores, Relatórios,
//              Configurações, Backup, Manual/Checklist
// Gestão Sorveteria & Açaí Pro
// ============================================================

// --- TERMOS ---
function updateTermsVisuals() {
    const hasAccepted = db.settings.termsAccepted;
    const termsBox = document.getElementById('terms-box');
    const btn = document.getElementById('btn-confirm-terms');
    const badge = document.getElementById('terms-accepted-badge');
    const icon = document.getElementById('terms-icon');
    const title = document.getElementById('terms-title');
    const desc = document.getElementById('terms-desc');

    if (hasAccepted && termsBox) {
        termsBox.classList.remove('bg-gray-50', 'border-gray-200');
        termsBox.classList.add('bg-green-50', 'border-green-200');

        if (btn) btn.classList.add('hidden');
        if (badge) {
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        }

        const dateElement = document.getElementById('terms-date');
        if (dateElement && db.settings.termsAcceptedAt) {
            const dateObj = new Date(db.settings.termsAcceptedAt);
            dateElement.textContent = 'Confirmado em: ' + dateObj.toLocaleString('pt-BR');
        }

        if (icon) {
            icon.setAttribute('class', 'w-16 h-16 text-green-500 mb-3 transition-colors duration-500');
            icon.setAttribute('data-lucide', 'shield-check');
            if (window.lucide) lucide.createIcons();
        }
        if (title) {
            title.textContent = 'Termos Aceitos e Válidos';
            title.classList.add('text-green-800');
        }
        if (desc) {
            desc.textContent = 'Obrigado por sua transparência e confiança. Seu uso está regularizado.';
            desc.classList.add('text-green-700');
        }
    }
}

// --- VENDAS ---
function renderSales() {
    const tbody = document.getElementById('sales-table-body');
    const emptyMsg = document.getElementById('sales-empty-msg');
    const filterDateEl = document.getElementById('sales-date-filter');
    const filterDate = filterDateEl ? filterDateEl.value : '';

    if (!tbody) return;
    tbody.innerHTML = '';
    let filteredSales = db.sales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (filterDate) {
        filteredSales = filteredSales.filter(s => s.date === filterDate);
    }

    if (filteredSales.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    tbody.innerHTML = filteredSales.map(sale => `
        <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
            <td class="px-6 py-4 font-mono text-xs text-gray-500">#${sale.id.slice(-6).toUpperCase()}</td>
            <td class="px-6 py-4 text-gray-700">${fmtDateTime(sale.timestamp)}</td>
            <td class="px-6 py-4 text-gray-700">${sale.items.length} itens</td>
            <td class="px-6 py-4 font-bold text-gray-800">${fmtMoney(sale.total)}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 uppercase">
                    ${sale.paymentMethod || 'Dinheiro'}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="printSaleReceipt('${sale.id}')" class="text-gray-400 hover:text-teal-600 transition-colors" title="Reimprimir Cupom">
                    <i data-lucide="printer" class="w-5 h-5"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

// --- CLIENTES ---
function renderClients() {
    const tbody = document.getElementById('clients-table-body');
    const emptyMsg = document.getElementById('clients-empty-msg');
    const searchEl = document.getElementById('client-search');
    const term = searchEl ? searchEl.value.toLowerCase() : '';

    if (!tbody) return;
    tbody.innerHTML = '';
    const filtered = db.clients.filter(c => c.name.toLowerCase().includes(term));

    if (filtered.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    tbody.innerHTML = filtered.map(client => `
        <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
            <td class="px-6 py-4 font-bold text-gray-800">${client.name}</td>
            <td class="px-6 py-4 text-gray-600">${client.phone || '-'}</td>
            <td class="px-6 py-4 text-gray-600">${client.email || '-'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">
                    ${client.points || 0} pts
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="deleteClient('${client.id}')" class="text-gray-400 hover:text-red-600 transition-colors">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function openClientModal() {
    document.getElementById('client-id').value = '';
    document.getElementById('client-name').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-email').value = '';
    document.getElementById('clientModal').classList.remove('hidden');
}

function saveClient(e) {
    e.preventDefault();
    const client = {
        id: getID(),
        name: document.getElementById('client-name').value,
        phone: document.getElementById('client-phone').value,
        email: document.getElementById('client-email').value,
        points: 0,
        history: []
    };
    db.clients.push(client);
    save();
    closeModal('clientModal');
    renderClients();
    showNotification('Cliente cadastrado com sucesso!', 'success');
}

function deleteClient(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        db.clients = db.clients.filter(c => c.id !== id);
        save();
        renderClients();
    }
}

// --- FORNECEDORES ---
function renderSuppliers() {
    const tbody = document.getElementById('suppliers-table-body');
    const emptyMsg = document.getElementById('suppliers-empty-msg');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (db.suppliers.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    tbody.innerHTML = db.suppliers.map(sup => `
        <tr class="hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
            <td class="px-6 py-4 font-bold text-gray-800">${sup.name}</td>
            <td class="px-6 py-4 text-gray-600">${sup.contact || '-'}</td>
            <td class="px-6 py-4 text-gray-600">${sup.phone || '-'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 uppercase">
                    ${sup.category || 'Geral'}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="deleteSupplier('${sup.id}')" class="text-gray-400 hover:text-red-600 transition-colors">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function openSupplierModal() {
    document.getElementById('supplier-id').value = '';
    document.getElementById('supplier-name').value = '';
    document.getElementById('supplier-contact').value = '';
    document.getElementById('supplier-phone').value = '';
    document.getElementById('supplier-category').value = '';
    document.getElementById('supplierModal').classList.remove('hidden');
}

function saveSupplier(e) {
    e.preventDefault();
    const supplier = {
        id: getID(),
        name: document.getElementById('supplier-name').value,
        contact: document.getElementById('supplier-contact').value,
        phone: document.getElementById('supplier-phone').value,
        category: document.getElementById('supplier-category').value
    };
    db.suppliers.push(supplier);
    save();
    closeModal('supplierModal');
    renderSuppliers();
    showNotification('Fornecedor salvo!', 'success');
}

function deleteSupplier(id) {
    if (confirm('Excluir fornecedor?')) {
        db.suppliers = db.suppliers.filter(s => s.id !== id);
        save();
        renderSuppliers();
    }
}

// --- RELATÓRIOS ---
function renderReports() {
    const periodEl = document.getElementById('report-period');
    const period = periodEl ? periodEl.value : 'all';
    let filteredSales = db.sales;
    let filteredProduction = db.production;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (period === 'today') {
        filteredSales = filteredSales.filter(s => s.date === todayStr);
        filteredProduction = filteredProduction.filter(p => p.date === todayStr);
    } else if (period === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        filteredSales = filteredSales.filter(s => new Date(s.date) >= lastWeek);
    } else if (period === 'month') {
        const currentMonth = todayStr.slice(0, 7);
        filteredSales = filteredSales.filter(s => s.date.startsWith(currentMonth));
    } else if (period === 'year') {
        const currentYear = todayStr.slice(0, 4);
        filteredSales = filteredSales.filter(s => s.date.startsWith(currentYear));
    }

    const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const avgTicket = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

    const repInc = document.getElementById('rep-inc');
    const repExp = document.getElementById('rep-exp');
    const repBal = document.getElementById('rep-bal');
    if (repInc) repInc.textContent = fmtMoney(totalSales);
    if (repExp) repExp.textContent = `${filteredSales.length} venda(s)`;
    if (repBal) repBal.textContent = fmtMoney(avgTicket);
}

// --- CONFIGURAÇÕES ---
function renderSettings() {
    const nameEl = document.getElementById('settings-name');
    const addrEl = document.getElementById('settings-address');
    const phoneEl = document.getElementById('settings-phone');
    if (nameEl) nameEl.value = db.settings.companyName || '';
    if (addrEl) addrEl.value = db.settings.address || '';
    if (phoneEl) phoneEl.value = db.settings.phone || '';
}

function saveCompanySettings() {
    const nameEl = document.getElementById('settings-name');
    const addrEl = document.getElementById('settings-address');
    const phoneEl = document.getElementById('settings-phone');
    if (nameEl) db.settings.companyName = nameEl.value;
    if (addrEl) db.settings.address = addrEl.value;
    if (phoneEl) db.settings.phone = phoneEl.value;
    save();
    showNotification('Configurações salvas!', 'success');
}

// --- BACKUP E RESTAURAÇÃO ---
function downloadBackup() {
    const backupData = {
        ...db,
        exportedAt: new Date().toISOString(),
        version: 'ml_sorveteria_v4'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileName = `ml_sorveteria_backup_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();

    showNotification('Backup baixado com sucesso!', 'success');
}

function restoreBackup(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const backup = JSON.parse(e.target.result);
            if (!backup.products || !backup.sales) {
                throw new Error('Arquivo de backup inválido');
            }
            if (confirm('Restaurar backup substituirá todos os dados atuais. Tem certeza?')) {
                db = backup;
                save();
                location.reload();
            }
        } catch (error) {
            alert('Erro ao restaurar backup: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function factoryReset() {
    if (confirm('ATENÇÃO: Isso apagará TODOS os dados, produtos e vendas. Tem certeza absoluta?')) {
        if (confirm('Última chance: Essa ação não pode ser desfeita. Confirmar reset?')) {
            localStorage.removeItem(DB_KEY);
            location.reload();
        }
    }
}

// --- MANUAL / TUTORIAL / CHECKLIST ---
function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function markSectionComplete(id) {
    const completed = JSON.parse(localStorage.getItem('sorveteria-manual-progress') || '[]');
    if (!completed.includes(id)) {
        completed.push(id);
        localStorage.setItem('sorveteria-manual-progress', JSON.stringify(completed));
        updateTutorialProgress();
        showNotification('Seção concluída!', 'success');
    }
}

function updateTutorialProgress() {
    const sections = ['instalacao', 'primeiro-cadastro', 'producao', 'vendas', 'backup', 'duvidas', 'checklist'];
    const completed = JSON.parse(localStorage.getItem('sorveteria-manual-progress') || '[]');
    const progress = (completed.length / sections.length) * 100;

    const progressBar = document.getElementById('tutorial-progress');
    const completedSteps = document.getElementById('completed-steps');

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (completedSteps) completedSteps.textContent = `${completed.length}/${sections.length} etapas`;
}

function updateChecklist() {
    const checkboxes = document.querySelectorAll('#checklist input[type="checkbox"]');
    const total = checkboxes.length;
    const checked = document.querySelectorAll('#checklist input[type="checkbox"]:checked').length;
    const percent = Math.round((checked / total) * 100);

    const percentEl = document.getElementById('checklist-percent');
    const progressEl = document.getElementById('checklist-progress');
    const completedEl = document.getElementById('checklist-completed');
    const totalEl = document.getElementById('checklist-total');

    if (percentEl) percentEl.textContent = `${percent}%`;
    if (progressEl) progressEl.style.width = `${percent}%`;
    if (completedEl) completedEl.textContent = checked;
    if (totalEl) totalEl.textContent = total;

    checkboxes.forEach(cb => {
        const item = cb.closest('.checklist-item');
        if (!item) return;
        if (cb.checked) {
            item.classList.add('bg-blue-50', 'border-teal-500');
            item.classList.remove('border-gray-200');
        } else {
            item.classList.remove('bg-blue-50', 'border-teal-500');
            item.classList.add('border-gray-200');
        }
    });

    const state = {};
    checkboxes.forEach(cb => state[cb.id] = cb.checked);
    localStorage.setItem('sorveteria-checklist-state', JSON.stringify(state));
}

function resetChecklist() {
    if (confirm('Deseja reiniciar seu checklist diário?')) {
        localStorage.removeItem('sorveteria-checklist-state');
        document.querySelectorAll('#checklist input[type="checkbox"]').forEach(cb => cb.checked = false);
        updateChecklist();
        showNotification('Checklist reiniciado', 'info');
    }
}

function loadChecklistState() {
    const state = JSON.parse(localStorage.getItem('sorveteria-checklist-state') || '{}');
    Object.keys(state).forEach(id => {
        const cb = document.getElementById(id);
        if (cb) cb.checked = state[id];
    });
    updateChecklist();
}

function showExample(type) {
    showNotification(`Dica: Veja a seção ${type} no menu lateral`, 'info');
}
