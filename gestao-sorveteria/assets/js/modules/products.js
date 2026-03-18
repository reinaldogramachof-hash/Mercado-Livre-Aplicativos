// ============================================================
// products.js — Catálogo de Produtos
// Gestão Sorveteria & Açaí Pro
// ============================================================

function renderProductsCatalog(category = 'all') {
    const container = document.getElementById('products-catalog');
    const emptyMsg = document.getElementById('no-products-msg');

    if (!container) return; // Segurança

    container.innerHTML = '';

    let filtered = db.products;
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }

    if (filtered.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');

    container.innerHTML = filtered.map(product => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative">
            <div class="h-32 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                <i data-lucide="ice-cream" class="w-12 h-12 text-gray-300 group-hover:scale-110 transition-transform duration-300"></i>
                <div class="absolute top-2 right-2">
                    <span class="px-2 py-1 rounded-md text-xs font-bold ${product.stock <= product.minStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                        ${product.stock} ${product.unit || 'un'}
                    </span>
                </div>
            </div>
            <div class="p-4">
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">${product.category}</div>
                <h3 class="font-bold text-gray-800 mb-2 truncate">${product.name}</h3>
                <div class="flex justify-between items-end">
                    <div class="text-lg font-bold text-teal-600">${fmtMoney(product.price)}</div>
                    <button onclick="deleteProduct('${product.id}')" class="text-gray-400 hover:text-red-600 p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();

    // Atualizar botões de filtro visualmente
    document.querySelectorAll('#view-products button[onclick^="filterProductCatalog"]').forEach(btn => {
        if (btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.remove('bg-gray-100', 'text-gray-700');
            btn.classList.add('bg-teal-500', 'text-white');
        } else {
            btn.classList.add('bg-gray-100', 'text-gray-700');
            btn.classList.remove('bg-teal-500', 'text-white');
        }
    });
}

function filterProductCatalog(category) {
    renderProductsCatalog(category);
}

function openProductModal() {
    document.getElementById('p-id').value = '';
    document.getElementById('p-code').value = '';
    document.getElementById('p-name').value = '';
    document.getElementById('p-category').value = '';
    document.getElementById('p-flavor').value = '';
    document.getElementById('p-cost').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-temperature').value = '';
    document.getElementById('p-stock').value = '';
    document.getElementById('p-min-stock').value = '';
    document.getElementById('p-unit').value = 'unidade';
    document.getElementById('p-ingredients').value = '';
    document.getElementById('p-description').value = '';
    document.getElementById('productModal').classList.remove('hidden');
}

function saveProduct(e) {
    e.preventDefault();
    const product = {
        id: document.getElementById('p-id').value || getID(),
        code: document.getElementById('p-code').value,
        name: document.getElementById('p-name').value,
        category: document.getElementById('p-category').value,
        flavor: document.getElementById('p-flavor').value,
        cost: parseFloat(document.getElementById('p-cost').value) || 0,
        price: parseFloat(document.getElementById('p-price').value) || 0,
        temperature: document.getElementById('p-temperature').value,
        stock: parseFloat(document.getElementById('p-stock').value) || 0,
        minStock: parseFloat(document.getElementById('p-min-stock').value) || 0,
        unit: document.getElementById('p-unit').value,
        ingredients: document.getElementById('p-ingredients').value,
        description: document.getElementById('p-description').value
    };

    // Check if update or new
    const existingIndex = db.products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
        db.products[existingIndex] = product;
    } else {
        db.products.push(product);
    }

    save();
    closeModal('productModal');
    renderProductsCatalog();
    showNotification('Produto salvo com sucesso!', 'success');
}

function deleteProduct(id) {
    if (confirm('Excluir produto?')) {
        db.products = db.products.filter(p => p.id !== id);
        save();
        renderProductsCatalog();
    }
}
