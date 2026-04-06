// ============================================================
// production.js — Controle de Produção
// Gestão Sorveteria & Açaí Pro
// ============================================================

function renderProduction() {
    const search = (document.getElementById('production-search')?.value || '').toLowerCase();
    const type = document.getElementById('production-type')?.value || 'all';
    const status = document.getElementById('production-status')?.value || 'all';
    const date = document.getElementById('production-date')?.value || '';

    let items = db.production || [];
    if (search) items = items.filter(i => i.product?.toLowerCase().includes(search) || (i.code||'').toLowerCase().includes(search));
    if (type !== 'all') items = items.filter(i => i.type === type);
    if (status !== 'all') items = items.filter(i => i.status === status);
    if (date) items = items.filter(i => i.date?.slice(0,10) === date);

    const tbody = document.getElementById('production-table-body');
    const emptyMsg = document.getElementById('production-empty-msg');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('hidden');
    } else {
        if (emptyMsg) emptyMsg.classList.add('hidden');
        tbody.innerHTML = items.map(item => {
            const statusBadge = {
                'produzindo': '<span class="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Produzindo</span>',
                'pronto': '<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Pronto</span>',
                'pendente': '<span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">Pendente</span>'
            }[item.status] || `<span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">${item.status}</span>`;
            return `<tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-xs font-mono text-gray-500">${item.code || item.id?.slice(0,6).toUpperCase()}</td>
                <td class="px-6 py-4 font-medium text-gray-800">${item.product || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-600 capitalize">${item.type || '-'}</td>
                <td class="px-6 py-4 text-sm font-bold">${item.quantity || 0} ${item.unit || 'L'}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${item.date ? fmtDate(item.date) : '-'}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        ${item.status !== 'pronto' ? `<button onclick="updateProductionStatus('${item.id}','pronto')" class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Pronto</button>` : ''}
                        <button onclick="deleteProduction('${item.id}')" class="p-1 text-red-400 hover:bg-red-50 rounded"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // Contadores
    const today = new Date().toISOString().slice(0,10);
    const todayItems = (db.production||[]).filter(i => i.date?.slice(0,10) === today);
    const todayQty = todayItems.reduce((s,i) => s + (parseFloat(i.quantity)||0), 0);
    const inProgress = (db.production||[]).filter(i => i.status === 'produzindo').length;
    const ready = (db.production||[]).filter(i => i.status === 'pronto').length;
    const ingredients = (db.production||[]).reduce((s,i) => s + (parseFloat(i.ingredientsUsed)||0), 0);

    const elToday = document.getElementById('production-today-summary');
    const elProgress = document.getElementById('production-in-progress');
    const elReady = document.getElementById('production-ready');
    const elIngr = document.getElementById('ingredients-used');
    if (elToday) elToday.textContent = `${todayQty} L`;
    if (elProgress) elProgress.textContent = inProgress;
    if (elReady) elReady.textContent = ready;
    if (elIngr) elIngr.textContent = `${ingredients.toFixed(1)} kg`;

    renderProductionSchedule();
    if (window.lucide) lucide.createIcons();
}

function renderProductionSchedule() {
    const schedule = document.getElementById('production-schedule');
    if (!schedule) return;
    const pending = (db.production||[]).filter(i => i.status !== 'pronto').slice(0,5);
    if (pending.length === 0) {
        schedule.innerHTML = '<p class="text-gray-400 text-sm">Nenhuma produção agendada.</p>';
        return;
    }
    schedule.innerHTML = pending.map(i => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <i data-lucide="ice-cream-2" class="w-4 h-4 text-teal-600"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-800">${i.product || 'Produção'}</p>
                    <p class="text-xs text-gray-500">${i.quantity || 0} ${i.unit || 'L'} — ${fmtDate(i.date||new Date())}</p>
                </div>
            </div>
            <span class="text-xs font-bold capitalize ${i.status === 'produzindo' ? 'text-yellow-600' : 'text-gray-500'}">${i.status}</span>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function openProductionModal() {
    const modal = document.getElementById('productionModal');
    if (modal) modal.classList.remove('hidden');

    // Popular select de produtos
    const prodSelect = document.getElementById('prod-product-link');
    if (prodSelect) {
        prodSelect.innerHTML = '<option value="">Nenhum produto específico</option>' +
            db.products.map(p => `<option value="${p.id}">${sanitizeHTML(p.name)}${p.flavor ? ' — ' + p.flavor : ''}</option>`).join('');
    }
}

function addIngredientRow() {
    const container = document.getElementById('prod-ingredients-list');
    if (!container) return;
    const rowId = getID();
    container.insertAdjacentHTML('beforeend', `
        <div id="ingredient-${rowId}" class="grid grid-cols-3 gap-2">
            <input type="text" placeholder="Ingrediente" class="border p-2 rounded text-sm">
            <input type="number" placeholder="Quantidade" step="0.1" class="border p-2 rounded text-sm">
            <select class="border p-2 rounded text-sm">
                <option value="kg">kg</option>
                <option value="litro">L</option>
                <option value="unidade">un</option>
            </select>
        </div>
    `);
}

function clearProductionFilters() {
    ['production-search','production-type','production-status','production-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = el.tagName === 'SELECT' ? el.options[0].value : '';
    });
    renderProduction();
}

function exportProductionCSV() {
    const header = 'Código,Produto,Tipo,Quantidade,Unidade,Status,Data';
    const rows = (db.production||[]).map(i => `${i.code||i.id},${i.product},${i.type||''},${i.quantity||0},${i.unit||'L'},${i.status},${i.date?.slice(0,10)||''}`);
    const csv = [header, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `producao_sorveteria_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showNotification('CSV exportado!', 'success');
}

function saveProduction(e) {
    if (e) e.preventDefault();

    const product  = document.getElementById('prod-product')?.value?.trim() || '';
    const type     = document.getElementById('prod-type')?.value || 'sorvete';
    const quantity = parseFloat(document.getElementById('prod-quantity')?.value || 0);
    const unit     = document.getElementById('prod-unit')?.value || 'litro';
    const date     = document.getElementById('prod-date')?.value || new Date().toISOString().slice(0, 10);
    const notes    = document.getElementById('prod-notes')?.value?.trim() || '';

    if (!product || quantity <= 0) {
        showNotification('Preencha o produto e a quantidade.', 'error');
        return;
    }

    // Coletar ingredientes como array estruturado
    const ingredients = [];
    let ingredientsUsed = 0; // mantém compatibilidade de exibição
    const ingredientRows = document.querySelectorAll('#prod-ingredients-list > div');
    ingredientRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const name = inputs[0]?.value?.trim() || '';
        const qty = parseFloat(inputs[1]?.value || 0);
        const unitIngr = row.querySelector('select')?.value || 'kg';

        if (name && qty > 0) {
            ingredients.push({ name, qty, unit: unitIngr });
            if (unitIngr === 'kg' || unitIngr === 'litro') ingredientsUsed += qty;
        }
    });

    // Vincular a um produto do catálogo (se disponível)
    const productId = document.getElementById('prod-product-link')?.value || '';

    const item = {
        id: getID(),
        code: 'PRD' + Date.now().toString().slice(-4),
        productId: productId || undefined,
        product, type, quantity, unit, date, notes,
        ingredients,
        ingredientsUsed,
        status: 'produzindo',
        createdAt: new Date().toISOString()
    };

    db.production.push(item);
    save();

    // Fechar modal e limpar formulário
    const modal = document.getElementById('productionModal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('production-form');
    if (form) form.reset();
    const ingredList = document.getElementById('prod-ingredients-list');
    if (ingredList) ingredList.innerHTML = '';

    renderProduction();
    showNotification(`Produção de "${product}" iniciada!`, 'success');
}

function updateProductionStatus(id, status) {
    const item = db.production.find(i => i.id === id);
    if (!item) return;

    item.status = status;

    // Se marcar como 'pronto', baixar ingredientes e incrementar estoque
    if (status === 'pronto') {
        // Baixar ingredientes do estoque
        (item.ingredients || []).forEach(ing => {
            const invIdx = (db.inventory || []).findIndex(inv =>
                inv.name.toLowerCase() === ing.name.toLowerCase()
            );
            if (invIdx > -1) {
                const deduct = ing.unit === 'kg' || ing.unit === 'litro' ? ing.qty : ing.qty / 1000;
                db.inventory[invIdx].stock = Math.max(0, db.inventory[invIdx].stock - deduct);

                // Alerta se cair abaixo do mínimo
                if (db.inventory[invIdx].stock < db.inventory[invIdx].minStock) {
                    showNotification(`⚠️ Estoque baixo: ${db.inventory[invIdx].name}`, 'warning');
                }
            }
        });

        // Incrementar estoque do produto finalizado
        if (item.productId) {
            const pIdx = db.products.findIndex(p => p.id === item.productId);
            if (pIdx > -1) {
                db.products[pIdx].stock += item.quantity;
            }
        }
    }

    save();
    renderProduction();
    showNotification(`Status atualizado: ${status}!`, 'success');
}

function deleteProduction(id) {
    if (!confirm('Remover este registro de produção?')) return;
    db.production = db.production.filter(i => i.id !== id);
    save(); renderProduction(); showNotification('Registro removido.', 'success');
}
