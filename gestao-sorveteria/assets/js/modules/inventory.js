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

function openStockEntryModal(itemId, source) {
    // Simple inline prompt fallback
    const qty = parseFloat(prompt('Quantidade de entrada:'));
    if (isNaN(qty) || qty <= 0) return;
    if (source === 'product') {
        const p = db.products.find(x => x.id === itemId);
        if (p) { p.stock += qty; save(); renderInventory(); showNotification(`+${qty} adicionado ao estoque de ${p.name}`, 'success'); }
    } else {
        const i = (db.inventory || []).find(x => x.id === itemId);
        if (i) { i.stock += qty; save(); renderInventory(); showNotification(`+${qty} adicionado`, 'success'); }
    }
}

function openStockTakeModal() {
    showNotification('Inventário físico: atualize os estoques individualmente via entrada.', 'info');
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
