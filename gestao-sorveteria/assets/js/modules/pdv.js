// ============================================================
// pdv.js — Frente de Caixa / PDV
// Gestão Sorveteria & Açaí Pro
// ============================================================

let cart = [];
let currentPdvCategory = 'all';
let pdvPaymentMethod = 'dinheiro';

function renderCashierProducts() {
    const search = (document.getElementById('product-search')?.value || '').toLowerCase();
    let products = db.products || [];
    if (currentPdvCategory !== 'all') products = products.filter(p => p.category === currentPdvCategory);
    if (search) products = products.filter(p => p.name.toLowerCase().includes(search) || (p.flavor||'').toLowerCase().includes(search));

    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-400 py-8">
            <i data-lucide="ice-cream" class="w-10 h-10 mx-auto mb-2 text-gray-300"></i>
            <p>Nenhum produto encontrado.</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all"
             onclick="addToCart('${p.id}')">
            <div class="text-center mb-2">
                <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-1">
                    <i data-lucide="ice-cream-2" class="w-5 h-5 text-teal-600"></i>
                </div>
                <p class="text-xs font-bold text-gray-800 leading-tight">${p.name}</p>
                <p class="text-xs text-gray-500">${p.flavor || ''}</p>
            </div>
            <div class="text-center">
                <span class="text-sm font-bold text-teal-600">${fmtMoney(p.price)}</span>
            </div>
            ${p.stock <= 0 ? '<div class="mt-1 text-center text-xs text-red-500 font-bold">SEM ESTOQUE</div>' : ''}
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function filterProductsByCategory(cat) {
    currentPdvCategory = cat;
    document.querySelectorAll('.category-tab').forEach(btn => {
        const isActive = btn.getAttribute('onclick')?.includes(`'${cat}'`);
        btn.className = `category-tab px-4 py-2 rounded-lg text-sm font-medium ${isActive
            ? 'bg-teal-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
    });
    renderCashierProducts();
}

function filterProducts() {
    renderCashierProducts();
}

function addToCart(productId, qty = 1) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) { showNotification('Produto sem estoque.', 'error'); return; }

    const existing = cart.find(i => i.id === productId);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ id: productId, name: product.name, price: product.price, qty });
    }
    updateCartDisplay();
    showNotification(`${product.name} adicionado!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    updateCartDisplay();
}

function changeCartQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== productId);
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartEl = document.getElementById('sale-cart');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (!cartEl) return;

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    if (cart.length === 0) {
        cartEl.innerHTML = `<div class="text-center text-gray-400 py-8">
            <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-4"></i>
            <p>Nenhum produto no carrinho</p>
            <p class="text-sm mt-2">Selecione produtos à esquerda</p>
        </div>`;
    } else {
        cartEl.innerHTML = cart.map(item => `
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-800">${item.name}</p>
                    <p class="text-xs text-gray-500">${fmtMoney(item.price)} cada</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="changeCartQty('${item.id}',-1)" class="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300">-</button>
                    <span class="text-sm font-bold w-4 text-center">${item.qty}</span>
                    <button onclick="changeCartQty('${item.id}',1)" class="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold hover:bg-teal-600">+</button>
                    <button onclick="removeFromCart('${item.id}')" class="w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200">
                        <i data-lucide="x" class="w-3 h-3 mx-auto"></i>
                    </button>
                </div>
                <div class="ml-3 text-sm font-bold text-teal-600 w-16 text-right">${fmtMoney(item.price * item.qty)}</div>
            </div>
        `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = fmtMoney(total);
    if (totalEl) totalEl.textContent = fmtMoney(total);
    if (window.lucide) lucide.createIcons();
}

// Alias para compatibilidade com código existente no index.html
function updateCart() {
    updateCartDisplay();
}

function clearSale() {
    cart = [];
    updateCartDisplay();
}

function addCustomIceCream() {
    const size = document.getElementById('icecream-size')?.value || 'medio';
    const type = document.getElementById('icecream-type')?.value || 'casquinha';
    const priceMap = { pequeno: 5.00, medio: 8.00, grande: 11.00, familia: 16.00 };
    const price = priceMap[size] || 8.00;
    const name = `Sorvete Personalizado (${size} - ${type})`;

    cart.push({ id: 'custom_' + getID(), name, price, qty: 1 });
    updateCartDisplay();
    showNotification(`${name} adicionado!`, 'success');
}

function applyDiscount() {
    const discountEl = document.getElementById('discount-input');
    const totalEl = document.getElementById('cart-total');
    if (!discountEl || !totalEl) return;
    const discount = parseFloat(discountEl.value) || 0;
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const total = Math.max(0, subtotal - discount);
    if (totalEl) totalEl.textContent = fmtMoney(total);
    showNotification(`Desconto de ${fmtMoney(discount)} aplicado.`, 'info');
}

function setPaymentMethod(method) {
    pdvPaymentMethod = method;
    document.querySelectorAll('.payment-method').forEach(btn => {
        const isActive = btn.dataset.method === method;
        btn.className = `payment-method p-2 rounded border text-sm ${isActive
            ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold'
            : 'hover:bg-gray-50 border-gray-200'}`;
    });
}

function completeSale() {
    if (cart.length === 0) {
        showNotification('Carrinho vazio!', 'error');
        return;
    }
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    window.currentSaleTotal = total;

    const pdvTotalEl = document.getElementById('pdv-checkout-total');
    if (pdvTotalEl) pdvTotalEl.textContent = fmtMoney(total);

    const pdvModal = document.getElementById('pdvCheckoutModal');
    if (pdvModal) {
        pdvModal.classList.remove('hidden');
    } else {
        // Fallback: finalizar direto
        finalizeSale(pdvPaymentMethod);
    }
}

function finalizeSale(paymentMethod = 'dinheiro') {
    if (cart.length === 0) { showNotification('Carrinho vazio!', 'error'); return; }

    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const sale = {
        id: getID(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        items: [...cart],
        total,
        paymentMethod,
        status: 'completed'
    };

    // Baixa no estoque
    cart.forEach(item => {
        const product = db.products.find(p => p.id === item.id);
        if (product) product.stock = Math.max(0, product.stock - item.qty);
    });

    db.sales.push(sale);
    save();
    clearSale();
    showNotification(`Venda de ${fmtMoney(total)} finalizada! Pagamento: ${paymentMethod}`, 'success');
}

function setPDVPayment(method) {
    pdvPaymentMethod = method;
    document.querySelectorAll('.pdv-pay-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'border-teal-500');
        btn.classList.add('border-gray-200');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('bg-blue-50', 'border-teal-500');
        event.currentTarget.classList.remove('border-gray-200');
    }

    const moneySection = document.getElementById('pdv-money-section');
    const changeSection = document.getElementById('pdv-change-section');
    if (method === 'dinheiro') {
        if (moneySection) moneySection.classList.remove('hidden');
        if (changeSection) changeSection.classList.remove('hidden');
    } else {
        if (moneySection) moneySection.classList.add('hidden');
        if (changeSection) changeSection.classList.add('hidden');
    }
}

function calculatePDVChange() {
    const totalEl = document.getElementById('pdv-checkout-total');
    const receivedEl = document.getElementById('pdv-received');
    const changeEl = document.getElementById('pdv-change');
    if (!totalEl || !receivedEl || !changeEl) return;

    const total = parseFloat(totalEl.textContent.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
    const received = parseFloat(receivedEl.value) || 0;
    const change = received - total;

    if (change >= 0) {
        changeEl.textContent = fmtMoney(change);
        changeEl.classList.remove('text-red-600');
        changeEl.classList.add('text-green-600');
    } else {
        changeEl.textContent = 'Faltam ' + fmtMoney(Math.abs(change));
        changeEl.classList.remove('text-green-600');
        changeEl.classList.add('text-red-600');
    }
}

function finalizePDVSale() {
    processSaleCompletion();
}

function processSaleCompletion() {
    if (typeof cart === 'undefined' || cart.length === 0) {
        closeModal('pdvCheckoutModal');
        showNotification('Carrinho vazio!', 'error');
        return;
    }

    const sale = {
        id: getID(),
        items: [...cart],
        total: window.currentSaleTotal || cart.reduce((acc, item) => acc + (item.price * (item.qty || item.quantity || 1)), 0),
        paymentMethod: pdvPaymentMethod,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
    };

    db.sales.push(sale);

    // Atualizar estoque
    sale.items.forEach(item => {
        const product = db.products.find(p => p.id === (item.id || item.productId));
        if (product) {
            product.stock -= (item.qty || item.quantity || 1);
        }
    });

    save();
    cart = [];
    updateCartDisplay();

    closeModal('pdvCheckoutModal');
    showNotification('Venda realizada com sucesso!', 'success');

    if (!document.getElementById('view-sales')?.classList.contains('hide')) {
        if (typeof renderSales === 'function') renderSales();
    }
}

function printReceipt() {
    if (cart.length === 0) { showNotification('Carrinho vazio!', 'error'); return; }
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    const lines = cart.map(i => `${i.name} x${i.qty} = ${fmtMoney(i.price * i.qty)}`).join('\n');
    const content = `CUPOM DE VENDA\n=============\n${lines}\n=============\nTOTAL: ${fmtMoney(total)}\nData: ${new Date().toLocaleString('pt-BR')}`;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) {
        win.document.write(`<pre style="font-family:monospace;padding:20px">${content}</pre>`);
        win.print();
    }
}

function printSaleReceipt(saleId) {
    const sale = db.sales.find(s => s.id === saleId);
    if (sale) {
        showNotification('Enviando para impressora...', 'info');
    }
}

// ── Venda Rápida (Modal do Header) ──────────────────────────
function openQuickSaleModal() {
    // Cria modal de venda rápida se não existir
    let modal = document.getElementById('quick-sale-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'quick-sale-modal';
        modal.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4';
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" onclick="closeQuickSaleModal()"></div>
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col z-10">
                <div class="flex items-center justify-between p-4 border-b border-gray-100">
                    <div class="flex items-center gap-2">
                        <i data-lucide="zap" class="w-5 h-5 text-teal-500"></i>
                        <h3 class="font-bold text-gray-800">Venda Rápida</h3>
                    </div>
                    <button onclick="closeQuickSaleModal()" class="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="p-4 overflow-y-auto flex-1">
                    <p class="text-sm text-gray-500 mb-3">Toque no produto para adicionar ao carrinho:</p>
                    <div id="quick-sale-grid" class="grid grid-cols-2 gap-2"></div>
                </div>
                <div class="p-4 border-t border-gray-100 flex gap-2">
                    <button onclick="closeQuickSaleModal(); router('cashier');"
                        class="flex-1 py-2.5 bg-teal-500 text-white rounded-xl font-bold text-sm hover:bg-teal-600 transition-colors">
                        Ver Caixa Completo
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Preencher grid com produtos disponíveis
    const grid = document.getElementById('quick-sale-grid');
    const products = (db.products || []).filter(p => p.stock > 0).slice(0, 8);
    grid.innerHTML = products.length === 0
        ? '<p class="col-span-2 text-center text-gray-400 py-4 text-sm">Nenhum produto em estoque.</p>'
        : products.map(p => `
            <button onclick="addToCart('${p.id}'); showNotification('${p.name} adicionado!', 'success');"
                class="p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-xl text-left transition-all active:scale-95">
                <p class="text-xs font-bold text-gray-800 leading-tight">${p.name}</p>
                <p class="text-xs text-teal-600 font-bold mt-1">${fmtMoney(p.price)}</p>
            </button>
        `).join('');

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeQuickSaleModal() {
    const modal = document.getElementById('quick-sale-modal');
    if (modal) modal.classList.add('hidden');
}
