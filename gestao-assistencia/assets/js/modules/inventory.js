// ==========================================
// MÓDULO ESTOQUE E PRODUTOS - GESTÃO ASSISTÊNCIA
// ==========================================

function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    if (!modal) return;

    document.getElementById('product-id').value = product?.id || '';
    document.getElementById('product-name').value = product?.name || '';
    document.getElementById('product-price').value = product ? (product.price || 0).toFixed(2).replace('.', ',') : '';
    document.getElementById('product-cost').value = product ? (product.cost || 0).toFixed(2).replace('.', ',') : '';
    document.getElementById('product-stock').value = product?.stock || 0;
    document.getElementById('product-min-stock').value = product?.minStock || 5;
    document.getElementById('product-category').value = product?.category || 'Peças';

    const titleEl = modal.querySelector('h3');
    if (titleEl) titleEl.textContent = product ? 'Editar Produto' : 'Novo Produto';

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function submitProduct(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value.replace(',', '.')) || 0;
    const cost = parseFloat(document.getElementById('product-cost').value.replace(',', '.')) || 0;
    const stock = parseInt(document.getElementById('product-stock').value) || 0;
    const minStock = parseInt(document.getElementById('product-min-stock').value) || 5;
    const category = document.getElementById('product-category').value;

    if (!name) {
        showNotification('O nome do produto é obrigatório!', 'error');
        return;
    }

    const product = {
        id: id || getProductID(),
        name,
        price,
        cost,
        stock,
        minStock,
        category,
        updatedAt: new Date().toISOString()
    };

    if (id) {
        const idx = db.products.findIndex(p => p.id === id);
        if (idx !== -1) {
            // Se o estoque mudou, registrar uma movimentação de ajuste
            const oldStock = db.products[idx].stock;
            if (oldStock !== stock) {
                const diff = stock - oldStock;
                addMovement(id, diff > 0 ? 'in' : 'out', Math.abs(diff), 'Ajuste Manual');
            }
            db.products[idx] = product;
        }
    } else {
        db.products.unshift(product);
        addMovement(product.id, 'in', stock, 'Estoque Inicial');
    }

    save();
    closeModal('productModal');
    renderInventory();
    renderDashboard();
    if (typeof populateProductSelectors === 'function') populateProductSelectors();
    showNotification(id ? 'Produto atualizado!' : 'Produto cadastrado!', 'success');
}

function renderInventory() {
    const term = (document.getElementById('search-inventory')?.value || '').toLowerCase();
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    const filtered = db.products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.id && p.id.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-500">Nenhum produto encontrado.</td></tr>';
        updateInventoryStats(filtered);
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const isCritical = p.stock === 0;
        const isLow = p.stock > 0 && p.stock <= p.minStock;
        const stockClass = isCritical ? 'text-red-600 font-bold' : isLow ? 'text-yellow-600 font-bold' : 'text-green-600 font-bold';
        
        const productData = JSON.stringify(p).replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        return `
            <tr class="hover:bg-gray-50 border-b border-gray-100 group transition-colors">
                <td class="px-6 py-4 text-xs font-mono text-gray-400">${p.id}</td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${sanitizeHTML(p.name)}</div>
                    <div class="text-xs text-gray-400">${sanitizeHTML(p.category)}</div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="${stockClass}">${p.stock}</div>
                    <div class="text-[10px] text-gray-400">mín: ${p.minStock}</div>
                </td>
                <td class="px-6 py-4 text-right text-sm text-gray-600">
                    ${fmtMoney(p.price)}
                </td>
                <td class="px-6 py-4 text-right text-gray-400 text-xs">
                    ${fmtMoney(p.cost)}
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openProductModal(${productData})"
                                class="text-gray-400 hover:text-blue-500 transition-colors" title="Editar">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteProduct('${p.id}')"
                                class="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateInventoryStats(filtered);
}

function updateInventoryStats(products) {
    const totalItemsEl = document.getElementById('total-items');
    const totalValueEl = document.getElementById('total-inventory-value');
    const lowStockEl = document.getElementById('low-stock-count');

    const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
    const totalValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (totalValueEl) totalValueEl.textContent = fmtMoney(totalValue);
    if (lowStockEl) lowStockEl.textContent = lowStockCount;
}

function deleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto?\n\nEsta ação não pode ser desfeita.')) {
        // Verificar se usado em O.S. (opcional, mas seguro)
        const usedInOrders = db.orders.some(o => o.parts && o.parts.some(part => part.productId === id));
        if (usedInOrders) {
            showNotification('Este produto está vinculado a ordens de serviço e não pode ser excluído.', 'error');
            return;
        }

        db.products = db.products.filter(p => p.id !== id);
        save();
        renderInventory();
        renderDashboard();
        if (typeof populateProductSelectors === 'function') populateProductSelectors();
        showNotification('Produto excluído!', 'success');
    }
}

function promptMovement() {
    const modal = document.getElementById('movementModal');
    if (!modal) return;
    
    const select = document.getElementById('move-product');
    if (select) {
        select.innerHTML = '<option value="">Selecione o produto</option>' +
            db.products.map(p => `<option value="${p.id}">${sanitizeHTML(p.name)} (Qtd: ${p.stock})</option>`).join('');
    }
    
    modal.classList.remove('hidden');
}

function submitMovement(event) {
    if (event) event.preventDefault();
    const productId = document.getElementById('move-product').value;
    const type = document.getElementById('move-type').value;
    const qty = parseInt(document.getElementById('move-qty').value) || 0;
    const reason = document.getElementById('move-reason').value.trim();

    if (!productId || qty <= 0) {
        showNotification('Preencha os campos obrigatórios corretamente!', 'error');
        return;
    }

    const product = db.products.find(p => p.id === productId);
    if (!product) return;

    if (type === 'out' && product.stock < qty) {
        showNotification('Estoque insuficiente para esta saída!', 'error');
        return;
    }

    addMovement(productId, type, qty, reason);
    product.stock += (type === 'in' ? qty : -qty);
    
    save();
    closeModal('movementModal');
    renderInventory();
    renderDashboard();
    showNotification(`Estoque de ${product.name} atualizado!`, 'success');
}

function addMovement(productId, type, qty, reason = '') {
    db.movements.push({
        id: getMovementID(),
        productId,
        type,
        qty: parseInt(qty),
        reason: reason || (type === 'in' ? 'Entrada Manual' : 'Saída Manual'),
        date: new Date().toISOString()
    });
}

function generateInventoryReport() {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    const totalProducts = db.products.length;
    const totalValue = db.products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const lowStockCount = db.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStockCount = db.products.filter(p => p.stock === 0).length;

    const mostValuable = [...db.products]
        .sort((a, b) => (b.stock * b.cost) - (a.stock * a.cost))
        .slice(0, 5);

    reportContent.innerHTML = `
        <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Relatório de Estoque</h3>
            <p class="text-sm text-gray-600">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <p class="text-xs text-blue-600 uppercase font-bold mb-1">Total Produtos</p>
                <p class="text-2xl font-bold text-blue-900">${totalProducts}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                <p class="text-xs text-green-600 uppercase font-bold mb-1">Valor Total (Custo)</p>
                <p class="text-2xl font-bold text-green-900">${fmtMoney(totalValue)}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center">
                <p class="text-xs text-yellow-600 uppercase font-bold mb-1">Baixo Estoque</p>
                <p class="text-2xl font-bold text-yellow-900">${lowStockCount}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                <p class="text-xs text-red-600 uppercase font-bold mb-1">Esgotados</p>
                <p class="text-2xl font-bold text-red-900">${outOfStockCount}</p>
            </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-gray-200 mb-6">
            <h4 class="font-bold text-gray-800 mb-3">Top 5 - Maior Valor em Estoque</h4>
            <div class="space-y-2">
                ${mostValuable.map(p => `
                    <div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                        <span>${sanitizeHTML(p.name)}</span>
                        <span class="font-bold text-green-700">${fmtMoney(p.stock * p.cost)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const resultModal = document.getElementById('report-result');
    if (resultModal) resultModal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function exportInventoryCSV() {
    const headers = ['ID', 'Nome', 'Categoria', 'Estoque', 'Minimo', 'Custo', 'Venda'];
    const rows = db.products.map(p => [
        p.id,
        `"${p.name}"`,
        p.category,
        p.stock,
        p.minStock,
        p.cost,
        p.price
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoque_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV exportado com sucesso!', 'success');
}
