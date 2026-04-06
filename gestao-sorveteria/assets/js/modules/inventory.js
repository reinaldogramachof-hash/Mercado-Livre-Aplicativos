// ============================================================
// inventory.js — Controle de Estoque
// Gestão Sorveteria & Açaí Pro
// ============================================================

let currentInventoryTab = 'ingredients';

function renderInventory() {
    // Lê filtros
    const search = (document.getElementById('inventory-search')?.value || '').toLowerCase();
    const category = document.getElementById('inventory-category')?.value || 'all';
    const status = document.getElementById('inventory-status')?.value || 'all';
    const sort = document.getElementById('inventory-sort')?.value || 'name';

    // Fonte de dados: db.inventory para ingredientes, db.products para finished/packaging
    let items = [];
    if (currentInventoryTab === 'ingredients') {
        items = (db.inventory || []).map(item => ({ ...item, _source: 'inventory' }));
    } else if (currentInventoryTab === 'finished') {
        items = db.products.filter(p => ['sorvete','acai','casquinha'].includes(p.category)).map(p => ({
            id: p.id, code: p.code, name: p.name, category: p.category,
            stock: p.stock, minStock: p.minStock, unit: p.unit,
            expiryDate: p.expiryDate || null, _source: 'product'
        }));
    } else {
        items = db.products.filter(p => ['cobertura','complemento','embalagem'].includes(p.category)).map(p => ({
            id: p.id, code: p.code, name: p.name, category: p.category,
            stock: p.stock, minStock: p.minStock, unit: p.unit,
            expiryDate: p.expiryDate || null, _source: 'product'
        }));
    }

    // Filtros
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search) || (i.code||'').toLowerCase().includes(search));
    if (category !== 'all') items = items.filter(i => i.category === category);
    if (status === 'in-stock') items = items.filter(i => i.stock >= i.minStock);
    else if (status === 'low-stock') items = items.filter(i => i.stock > 0 && i.stock < i.minStock);
    else if (status === 'out-of-stock') items = items.filter(i => i.stock <= 0);

    // Sort
    if (sort === 'name') items.sort((a,b) => a.name.localeCompare(b.name));
    else if (sort === 'stock') items.sort((a,b) => a.stock - b.stock);
    else if (sort === 'stock-desc') items.sort((a,b) => b.stock - a.stock);
    else if (sort === 'expiry') items.sort((a,b) => new Date(a.expiryDate||'9999') - new Date(b.expiryDate||'9999'));

    // Render table
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-gray-400">
            <i data-lucide="package" class="w-10 h-10 mx-auto mb-2 text-gray-300"></i>
            <p>Nenhum item encontrado.</p></td></tr>`;
        if (window.lucide) lucide.createIcons();
        updateInventoryCounters();
        return;
    }

    tbody.innerHTML = items.map(item => {
        const stockStatus = item.stock <= 0 ? 'out' : item.stock < item.minStock ? 'low' : 'ok';
        const badge = stockStatus === 'out'
            ? '<span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Em Falta</span>'
            : stockStatus === 'low'
            ? '<span class="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Baixo</span>'
            : '<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">OK</span>';
        return `<tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-xs text-gray-500 font-mono">${item.code || '-'}</td>
            <td class="px-6 py-4 font-medium text-gray-800">${item.name}</td>
            <td class="px-6 py-4 text-sm text-gray-600 capitalize">${item.category || '-'}</td>
            <td class="px-6 py-4">${badge} <span class="ml-1 text-sm font-bold">${item.stock}</span></td>
            <td class="px-6 py-4 text-sm text-gray-600">${item.minStock}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${item.unit || '-'}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${item.expiryDate ? fmtDate(item.expiryDate) : '-'}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="openStockEntryModal('${item.id}','${item._source}')" class="p-1 text-teal-600 hover:bg-teal-50 rounded" title="Entrada de estoque">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteInventoryItem('${item.id}','${item._source}')" class="p-1 text-red-400 hover:bg-red-50 rounded" title="Remover">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    updateInventoryCounters();
    renderExpiryAlerts();
    if (window.lucide) lucide.createIcons();
}

function updateInventoryCounters() {
    const allProducts = db.products || [];
    const allInventory = db.inventory || [];
    const allItems = [...allInventory, ...allProducts];

    const outCount = allItems.filter(i => i.stock <= 0).length;
    const lowCount = allItems.filter(i => i.stock > 0 && i.stock < i.minStock).length;

    const elIngr = document.getElementById('inventory-ingredients');
    const elFin = document.getElementById('inventory-finished');
    const elOut = document.getElementById('out-of-stock');
    const elLow = document.getElementById('low-stock');

    if (elIngr) elIngr.textContent = allInventory.length;
    if (elFin) elFin.textContent = allProducts.filter(p => ['sorvete','acai'].includes(p.category)).length;
    if (elOut) elOut.textContent = outCount;
    if (elLow) elLow.textContent = lowCount;
}

function showInventoryTab(tab) {
    currentInventoryTab = tab;
    document.querySelectorAll('.inventory-tab').forEach(btn => {
        const isActive = btn.dataset.tab === tab;
        btn.className = `inventory-tab py-2 px-1 border-b-2 font-medium text-sm ${isActive
            ? 'border-teal-500 text-teal-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`;
    });
    renderInventory();
}

function clearInventoryFilters() {
    const fields = ['inventory-search','inventory-category','inventory-status','inventory-sort'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = el.tagName === 'SELECT' ? el.options[0].value : '';
    });
    renderInventory();
}

function exportInventoryCSV() {
    const items = [...(db.inventory || []), ...db.products];
    const header = 'Código,Nome,Categoria,Estoque,Mínimo,Unidade';
    const rows = items.map(i => `${i.code||''},${i.name},${i.category||''},${i.stock},${i.minStock||0},${i.unit||''}`);
    const csv = [header, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `estoque_sorveteria_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showNotification('CSV exportado!', 'success');
}

function openInventoryItemModal() {
    const modal = document.getElementById('inventoryItemModal');
    if (modal) modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeInventoryItemModal() {
    const modal = document.getElementById('inventoryItemModal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('inventory-item-form');
    if (form) form.reset();
}

function saveInventoryItem(e) {
    if (e) e.preventDefault();
    const name     = document.getElementById('inv-name')?.value?.trim() || '';
    const category = document.getElementById('inv-category')?.value || 'outro';
    const unit     = document.getElementById('inv-unit')?.value || 'kg';
    const stock    = parseFloat(document.getElementById('inv-stock')?.value || 0);
    const minStock = parseFloat(document.getElementById('inv-min-stock')?.value || 0);
    const cost     = parseFloat(document.getElementById('inv-cost')?.value || 0);
    const expiry   = document.getElementById('inv-expiry')?.value || '';

    if (!name || stock < 0 || minStock < 0) {
        showNotification('Preencha nome, quantidade e estoque mínimo.', 'error');
        return;
    }

    const item = {
        id: getID(),
        code: 'ING' + Date.now().toString().slice(-4),
        name, category, unit, stock, minStock,
        cost, expiryDate: expiry || null,
        createdAt: new Date().toISOString()
    };

    if (!db.inventory) db.inventory = [];
    db.inventory.push(item);
    save();
    closeInventoryItemModal();
    showInventoryTab('ingredients');
    showNotification(`"${name}" adicionado ao estoque!`, 'success');
}

function renderExpiryAlerts() {
    const container = document.getElementById('expiry-alerts');
    if (!container) return;

    const today = new Date();
    const in7days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allItems = [...(db.inventory || []), ...(db.products || [])];
    const expiring = allItems
        .filter(i => i.expiryDate && new Date(i.expiryDate) <= in7days)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (expiring.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500">Nenhum item vencendo nos próximos 7 dias.</p>';
        return;
    }

    container.innerHTML = expiring.map(i => {
        const daysLeft = Math.ceil((new Date(i.expiryDate) - today) / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft < 0;
        const color = isExpired ? 'red' : daysLeft <= 2 ? 'orange' : 'yellow';
        return `<div class="flex items-center justify-between p-3 bg-white rounded-lg border border-${color}-200">
            <div>
                <p class="text-sm font-medium text-gray-800">${i.name}</p>
                <p class="text-xs text-${color}-600">
                    ${isExpired ? `Vencido há ${Math.abs(daysLeft)} dia(s)` : daysLeft === 0 ? 'Vence hoje!' : `Vence em ${daysLeft} dia(s) — ${fmtDate(i.expiryDate)}`}
                </p>
            </div>
            <span class="text-xs font-bold text-${color}-700 bg-${color}-100 px-2 py-1 rounded-full">
                ${i.stock} ${i.unit || ''}
            </span>
        </div>`;
    }).join('');
}

function openStockEntryModal(itemId, source) {
    // Remove modal anterior se existir
    const old = document.getElementById('stock-entry-inline-modal');
    if (old) old.remove();

    const item = source === 'product'
        ? db.products.find(x => x.id === itemId)
        : (db.inventory || []).find(x => x.id === itemId);
    if (!item) return;

    const modal = document.createElement('div');
    modal.id = 'stock-entry-inline-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40" onclick="document.getElementById('stock-entry-inline-modal')?.remove()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
            <h3 class="font-bold text-gray-800 mb-1">Entrada de Estoque</h3>
            <p class="text-sm text-gray-500 mb-4">${item.name} — atual: ${item.stock} ${item.unit || ''}</p>
            <label class="text-xs font-bold text-gray-500 uppercase">Quantidade a adicionar</label>
            <input type="number" id="stock-entry-qty" min="0.01" step="0.01"
                class="w-full border rounded-lg px-3 py-2 mt-1 mb-4 text-sm outline-none focus:border-teal-400"
                placeholder="Ex: 10">
            <div class="flex gap-2">
                <button onclick="confirmStockEntry('${itemId}','${source}')"
                    class="flex-1 bg-teal-500 text-white rounded-lg py-2 font-bold text-sm hover:bg-teal-600">Confirmar</button>
                <button onclick="document.getElementById('stock-entry-inline-modal')?.remove()"
                    class="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 font-bold text-sm hover:bg-gray-50">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('stock-entry-qty')?.focus(), 100);
}

function confirmStockEntry(itemId, source) {
    const qty = parseFloat(document.getElementById('stock-entry-qty')?.value || 0);
    if (isNaN(qty) || qty <= 0) { showNotification('Informe uma quantidade válida.', 'error'); return; }
    if (source === 'product') {
        const p = db.products.find(x => x.id === itemId);
        if (p) { p.stock += qty; save(); renderInventory(); showNotification(`+${qty} adicionado ao estoque de ${p.name}`, 'success'); }
    } else {
        const i = (db.inventory || []).find(x => x.id === itemId);
        if (i) { i.stock += qty; save(); renderInventory(); showNotification(`+${qty} adicionado`, 'success'); }
    }
    document.getElementById('stock-entry-inline-modal')?.remove();
}

function openStockTakeModal() {
    // Remover modal anterior se existir
    const old = document.getElementById('stocktake-modal');
    if (old) old.remove();

    // Agregar itens de inventory + products
    const allItems = [
        ...(db.inventory || []).map(i => ({...i, _src: 'inventory'})),
        ...db.products.map(p => ({...p, _src: 'product'}))
    ].filter(i => i.stock !== undefined);

    if (allItems.length === 0) {
        showNotification('Nenhum item para contar.', 'info');
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'stocktake-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/50" onclick="document.getElementById('stocktake-modal')?.remove()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col z-10">
            <div class="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 class="font-bold text-gray-800">Inventário Físico</h3>
                <button onclick="document.getElementById('stocktake-modal')?.remove()" class="text-gray-400 hover:text-gray-600 p-1">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <p class="text-sm text-gray-500 px-5 pt-3 pb-2">Informe as quantidades contadas. Deixe em branco para não alterar.</p>
            <div class="overflow-y-auto flex-1 px-5 py-3 space-y-2">
                ${allItems.map(item => `
                    <div class="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-800">${sanitizeHTML(item.name)}</p>
                            <p class="text-xs text-gray-400">Atual: ${item.stock} ${item.unit || ''}</p>
                        </div>
                        <input type="number" min="0" step="0.01" placeholder="Contado"
                            data-id="${item.id}" data-src="${item._src}"
                            class="stocktake-input w-28 border rounded-lg px-2 py-1.5 text-sm text-center outline-none focus:border-teal-400">
                    </div>
                `).join('')}
            </div>
            <div class="p-5 border-t border-gray-100 flex gap-3">
                <button onclick="document.getElementById('stocktake-modal')?.remove()"
                    class="flex-1 border border-gray-300 rounded-xl py-2 font-bold text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onclick="confirmStockTake()"
                    class="flex-1 bg-teal-500 text-white rounded-xl py-2 font-bold text-sm hover:bg-teal-600">Aplicar Ajustes</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
}

function confirmStockTake() {
    let changes = 0;
    document.querySelectorAll('.stocktake-input').forEach(input => {
        if (input.value === '') return;
        const qty = parseFloat(input.value);
        if (isNaN(qty) || qty < 0) return;
        const id = input.dataset.id;
        const src = input.dataset.src;

        if (src === 'inventory') {
            const item = (db.inventory || []).find(x => x.id === id);
            if (item) { item.stock = qty; changes++; }
        } else {
            const product = db.products.find(x => x.id === id);
            if (product) { product.stock = qty; changes++; }
        }
    });

    if (changes > 0) {
        save();
        document.getElementById('stocktake-modal')?.remove();
        renderInventory();
        showNotification(`✅ ${changes} item(ns) ajustado(s)!`, 'success');
    } else {
        showNotification('Nenhuma alteração foi feita.', 'warning');
    }
}

function deleteInventoryItem(itemId, source) {
    if (!confirm('Remover este item do estoque?')) return;
    if (source === 'inventory') {
        db.inventory = (db.inventory || []).filter(x => x.id !== itemId);
        save(); renderInventory(); showNotification('Item removido.', 'success');
    } else {
        showNotification('Produtos são gerenciados na aba Produtos.', 'info');
    }
}
