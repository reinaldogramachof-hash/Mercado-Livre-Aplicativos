// ==========================================
// MÓDULO PDV (FRENTE DE CAIXA) - GESTÃO SORVETERIA
// ==========================================

let pdvCart = [];
let lastSaleId = null;

function renderCashierProducts(event) {
    const searchInput = document.getElementById('product-search');
    const term = (searchInput?.value || '').toLowerCase();
    const grid = document.getElementById('products-grid');
    const emptyMsg = document.getElementById('pdv-empty-products');

    if (!grid) return;

    // Filtra produtos ativos
    let filtered = db.products || [];
    if (window.currentPdvCategory && window.currentPdvCategory !== 'all') {
        filtered = filtered.filter(p => p.category === window.currentPdvCategory);
    }
    
    filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        (product.id && product.id.toLowerCase().includes(term)) ||
        (product.flavor && product.flavor.toLowerCase().includes(term))
    );

    // Suporte a Leitor de Código de Barras (Enter)
    if (event && event.key === 'Enter' && term.trim() !== '') {
        const exactMatch = filtered.find(p => p.id.toLowerCase() === term.trim().toLowerCase() || p.code === term.trim().toLowerCase());
        const itemToAdd = exactMatch || (filtered.length === 1 ? filtered[0] : null);

        if (itemToAdd) {
            addToCart(itemToAdd.id);
            searchInput.value = '';
            renderCashierProducts();
            return;
        }
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-400 py-8" id="pdv-empty-products">
            <i data-lucide="ice-cream" class="w-10 h-10 mx-auto mb-2 text-gray-300"></i>
            <p>Nenhum produto encontrado.</p></div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all flex flex-col items-center justify-between"
             onclick="addToCart('${p.id}')">
            <div class="text-center mb-2">
                <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-1">
                    <i data-lucide="ice-cream-2" class="w-5 h-5 text-teal-600"></i>
                </div>
                <p class="text-xs font-bold text-gray-800 leading-tight">${p.name}</p>
                <p class="text-[10px] text-gray-500">${p.flavor || ''}</p>
            </div>
            <div class="text-center w-full">
                <span class="text-sm font-bold text-teal-600">${fmtMoney(p.price || 0)}</span>
                ${p.tipo === 'padrao' && p.stock <= 0 ? '<div class="mt-1 text-center text-[10px] bg-red-100 text-red-700 rounded px-1 font-bold">SEM ESTOQUE</div>' : ''}
            </div>
        </div>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterProductsByCategory(cat) {
    window.currentPdvCategory = cat;
    document.querySelectorAll('.category-tab').forEach(btn => {
        const isActive = btn.getAttribute('onclick')?.includes(`'${cat}'`);
        btn.className = `category-tab px-4 py-2 rounded-lg text-sm font-medium ${isActive
            ? 'bg-teal-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
    });
    renderCashierProducts();
}

function filterProducts(event) {
    renderCashierProducts(event);
}

function addToCart(productId) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return;

    const tipo = product.tipo || 'padrao';

    if (tipo === 'massa') { openMassaModal(product); return; }
    if (tipo === 'acai')  { openAcaiModal(product);  return; }

    if (product.stock <= 0) {
        showNotification('Produto sem estoque disponível!', 'error');
        return;
    }

    const existingIndex = pdvCart.findIndex(item => item.productId === productId && (!item.details || item.details === ''));
    if (existingIndex !== -1) {
        updateCartQty(existingIndex, 1);
    } else {
        pdvCart.push({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            qty: 1,
            total: Number(product.price),
            tipo: 'padrao',
            details: ''
        });
        renderCart();
    }
}

// ── Fluxos Especiais (Massa/Açaí) ──

let currentMassaProduct = null;
function openMassaModal(p) {
    currentMassaProduct = p;
    document.getElementById('massa-modal-title').textContent = p.name;
    document.getElementById('massa-modal-price-label').textContent = `${fmtMoney(p.pricePerHundredGrams || 0)}/100g`;
    document.getElementById('massa-weight-input').value = '';
    document.getElementById('massa-calculated-price').textContent = 'R$ 0,00';
    document.getElementById('massa-modal').classList.remove('hidden');
}

function updateMassaPrice() {
    if (!currentMassaProduct) return;
    const g = parseFloat(document.getElementById('massa-weight-input').value) || 0;
    const price = (g / 100) * (currentMassaProduct.pricePerHundredGrams || 0);
    document.getElementById('massa-calculated-price').textContent = fmtMoney(price);
}

function closeMassaModal() {
    document.getElementById('massa-modal').classList.add('hidden');
    currentMassaProduct = null;
}

function confirmMassaItem() {
    if (!currentMassaProduct) return;
    const g = parseFloat(document.getElementById('massa-weight-input').value) || 0;
    if (g <= 0) { showNotification('Informe um peso válido', 'error'); return; }
    const price = (g / 100) * (currentMassaProduct.pricePerHundredGrams || 0);
    
    pdvCart.push({
        productId: currentMassaProduct.id,
        name: currentMassaProduct.name,
        price: Number(price),
        qty: 1,
        total: Number(price),
        tipo: 'massa',
        details: `${g}g`
    });
    
    closeMassaModal();
    renderCart();
    showNotification(`${currentMassaProduct.name} adicionado!`, 'success');
}

let currentAcaiProduct = null;
function openAcaiModal(p) {
    currentAcaiProduct = p;
    document.getElementById('acai-modal-title').textContent = p.name;
    
    const sizes = p.sizes || [];
    const sizesContainer = document.getElementById('acai-sizes-container');
    sizesContainer.innerHTML = sizes.map((s, idx) => `
        <label class="flex items-center gap-2 p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" name="acai-size" value="${idx}" class="text-teal-500 focus:ring-teal-500" ${idx === 0 ? 'checked' : ''} onchange="updateAcaiTotals()">
            <span class="text-sm font-medium text-gray-700 flex-1">${s.label}</span>
            <span class="text-sm font-bold text-teal-600">${fmtMoney(s.price)}</span>
        </label>
    `).join('');

    const adicionais = db.adicionais || [];
    const adContainer = document.getElementById('acai-adicionais-container');
    adContainer.innerHTML = adicionais.map((a, idx) => `
        <label class="flex items-center gap-2 p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" name="acai-adicional" value="${idx}" class="text-teal-500 rounded focus:ring-teal-500" onchange="updateAcaiTotals()">
            <span class="text-sm font-medium text-gray-700 flex-1 truncate">${a.name}</span>
            <span class="text-xs font-bold ${a.price > 0 ? 'text-gray-500' : 'text-green-500'}">${a.price > 0 ? '+'+fmtMoney(a.price) : 'Grátis'}</span>
        </label>
    `).join('');

    updateAcaiTotals();
    document.getElementById('acai-modal').classList.remove('hidden');
}

function updateAcaiTotals() {
    if (!currentAcaiProduct) return;
    const sizes = currentAcaiProduct.sizes || [];
    const selectedSizeIdx = document.querySelector('input[name="acai-size"]:checked')?.value;
    const size = selectedSizeIdx !== undefined ? sizes[selectedSizeIdx] : null;
    
    let total = size ? size.price : 0;
    
    const adCbs = document.querySelectorAll('input[name="acai-adicional"]:checked');
    const adicionais = db.adicionais || [];
    const selectedAds = Array.from(adCbs).map(cb => adicionais[cb.value]);
    
    selectedAds.forEach(a => total += a.price);
    
    document.getElementById('acai-total-price').textContent = fmtMoney(total);
    document.getElementById('acai-summary-text').textContent = `${size ? size.label : ''} + ${selectedAds.length} adicional(is)`;
}

function closeAcaiModal() {
    document.getElementById('acai-modal').classList.add('hidden');
    currentAcaiProduct = null;
}

function confirmAcaiItem() {
    if (!currentAcaiProduct) return;
    const sizes = currentAcaiProduct.sizes || [];
    const selectedSizeIdx = document.querySelector('input[name="acai-size"]:checked')?.value;
    if (selectedSizeIdx === undefined || !sizes[selectedSizeIdx]) { showNotification('Selecione um tamanho', 'error'); return; }
    
    const size = sizes[selectedSizeIdx];
    let price = size.price;
    
    const adCbs = document.querySelectorAll('input[name="acai-adicional"]:checked');
    const adicionais = db.adicionais || [];
    const selectedAds = Array.from(adCbs).map(cb => adicionais[cb.value]);
    selectedAds.forEach(a => price += a.price);
    
    const details = selectedAds.length > 0 
        ? `${size.label} + ${selectedAds.map(a => a.name).join(', ')}`
        : size.label;

    pdvCart.push({
        productId: currentAcaiProduct.id,
        name: currentAcaiProduct.name,
        price: Number(price),
        qty: 1,
        total: Number(price),
        tipo: 'acai',
        details: details
    });

    closeAcaiModal();
    renderCart();
    showNotification(`${currentAcaiProduct.name} adicionado!`, 'success');
}

// ── Funções de Carrinho ──

function updateCartQty(index, delta) {
    const item = pdvCart[index];
    if (!item) return;

    if (item.tipo !== 'padrao') {
        // Massa e açaí são itens únicos de quantidade 1 no carrinho. Se for -1, remove.
        if (delta < 0) removeFromCart(index);
        return;
    }

    const product = db.products.find(p => p.id === item.productId);
    const newQty = item.qty + delta;

    if (newQty <= 0) {
        removeFromCart(index);
        return;
    }

    if (product && newQty > product.stock) {
        showNotification(`Estoque insuficiente! Disponível: ${product.stock}`, 'warning');
        return;
    }

    item.qty = newQty;
    item.total = item.qty * item.price;
    renderCart();
}

function renderCart() {
    const container = document.getElementById('pdv-cart-items');
    
    if (!container) return; // Segurança

    if (pdvCart.length === 0) {
        container.innerHTML = `
        <div class="text-center text-gray-400 py-8" id="pdv-cart-empty">
            <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-4"></i>
            <p>Nenhum produto no carrinho</p>
            <p class="text-[10px] mt-2">Clique nos produtos para vender</p>
        </div>`;
        renderCartTotals();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = pdvCart.map((item, index) => `
        <div class="bg-gray-50 rounded-lg p-2 flex flex-col gap-2 group mb-2 border border-gray-100">
            <div class="flex items-center justify-between gap-1">
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">${sanitizeHTML(item.name)}</p>
                    ${item.details ? `<p class="text-[10px] mt-0.5 text-gray-500 leading-tight">${sanitizeHTML(item.details)}</p>` : ''}
                    <p class="text-[10px] text-teal-600 font-bold mt-1">${fmtMoney(item.price)}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="text-gray-300 hover:text-red-500 transition-colors bg-white rounded-md p-1 shadow-sm border border-gray-100">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
            <div class="flex items-center justify-between mt-1 pt-2 border-t border-gray-200">
                <div class="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden">
                    <button onclick="updateCartQty(${index}, -1)" class="px-2 py-0.5 hover:bg-gray-100 text-gray-500 text-sm font-bold">-</button>
                    <span class="px-2 py-0.5 text-xs font-bold text-gray-700 border-x border-gray-100 min-w-[20px] text-center">${item.qty}</span>
                    <button onclick="updateCartQty(${index}, 1)" class="px-2 py-0.5 hover:bg-gray-100 text-gray-500 text-sm font-bold ${item.tipo !== 'padrao' ? 'opacity-50' : ''}" ${item.tipo !== 'padrao' ? 'disabled' : ''}>+</button>
                </div>
                <div class="font-bold text-xs text-brand-primary">${fmtMoney(item.total)}</div>
            </div>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
    renderCartTotals();
}

function removeFromCart(index) {
    pdvCart.splice(index, 1);
    renderCart();
}

function clearCart() {
    if (pdvCart.length > 0) {
        if (confirm('Esvaziar o carrinho?')) {
            pdvCart = [];
            const discInput = document.getElementById('pdv-discount');
            if (discInput) discInput.value = '';
            renderCart();
        }
    }
}

// Compatibilidade
function clearSale() { clearCart(); }

function renderCartTotals() {
    const subtotal = pdvCart.reduce((sum, item) => sum + item.total, 0);
    const discountVal = parseFloat(document.getElementById('pdv-discount')?.value) || 0;
    const total = Math.max(0, subtotal - discountVal);

    const subEl = document.getElementById('pdv-subtotal');
    const totEl = document.getElementById('pdv-total');

    if (subEl) subEl.textContent = fmtMoney(subtotal);
    if (totEl) totEl.textContent = fmtMoney(total);

    calculateChange();
}

function toggleChangeInput() {
    const paymentMethodEl = document.querySelector('input[name="pdv-payment"]:checked');
    if (!paymentMethodEl) return;
    const paymentMethod = paymentMethodEl.value;

    const changeSection = document.getElementById('pdv-change-section');
    if (changeSection) {
        if (paymentMethod === 'dinheiro') changeSection.classList.remove('hidden');
        else changeSection.classList.add('hidden');
    }
    calculateChange();
}

function calculateChange() {
    const paymentMethodEl = document.querySelector('input[name="pdv-payment"]:checked');
    if (!paymentMethodEl) return;
    const paymentMethod = paymentMethodEl.value;

    const subtotal = pdvCart.reduce((sum, item) => sum + item.total, 0);
    const discountVal = parseFloat(document.getElementById('pdv-discount')?.value) || 0;
    const total = Math.max(0, subtotal - discountVal);
    
    const changeValEl = document.getElementById('pdv-change-val');
    if (!changeValEl) return;

    if (paymentMethod === 'dinheiro') {
        const receivedInput = document.getElementById('pdv-amount-received');
        const received = parseFloat(receivedInput?.value) || 0;
        
        if (received > total + 0.01) {
            const change = received - total;
            changeValEl.textContent = fmtMoney(change);
            changeValEl.classList.remove('text-red-500');
            changeValEl.classList.add('text-teal-400');
        } else if (received > 0 && received < total - 0.01) {
            const pending = total - received;
            changeValEl.textContent = 'Falta ' + fmtMoney(pending);
            changeValEl.classList.remove('text-teal-400');
            changeValEl.classList.add('text-red-500');
        } else {
            changeValEl.textContent = 'R$ 0,00';
            changeValEl.classList.remove('text-red-500');
            changeValEl.classList.add('text-teal-400');
        }
    }
}

function finalizeSale() {
    if (pdvCart.length === 0) {
        showNotification('Carrinho vazio!', 'error');
        return;
    }

    const subtotal = pdvCart.reduce((sum, item) => sum + item.total, 0);
    const discountVal = parseFloat(document.getElementById('pdv-discount')?.value) || 0;
    const total = Math.max(0, subtotal - discountVal);

    const paymentMethodEl = document.querySelector('input[name="pdv-payment"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'dinheiro';

    let received = 0;
    if (paymentMethod === 'dinheiro') {
        const receivedInput = document.getElementById('pdv-amount-received');
        received = parseFloat(receivedInput?.value) || 0;
        
        if (received < total - 0.01) {
            showNotification('O valor recebido é menor que o total da venda!', 'error');
            return;
        }
    } else {
        received = total;
    }

    const saleId = 'V' + Date.now().toString(36).toUpperCase().substr(-5);
    const saleDate = new Date().toISOString();
    const change = Math.max(0, received - total);

    const sale = {
        id: saleId,
        date: saleDate.split('T')[0],
        timestamp: saleDate,
        items: [...pdvCart],
        subtotal: subtotal,
        discount: discountVal,
        total: total,
        paymentMethod: paymentMethod, // Mantemos o nome antigo para manter compatilidade com relatorios se houver
        status: 'completed',
        received: received,
        changeValue: change
    };

    // Baixa no Estoque (ignora produtos tipo massa/açaí sem controle unitário exato)
    pdvCart.forEach(item => {
        if (item.tipo === 'padrao') {
            const pIdx = db.products.findIndex(p => p.id === item.productId);
            if (pIdx > -1) {
                db.products[pIdx].stock = Math.max(0, db.products[pIdx].stock - item.qty);
            }
        }
    });

    db.sales.unshift(sale); // Salva em db.sales
    save();
    
    // Limpar o Caixa
    pdvCart = [];
    if (document.getElementById('pdv-discount')) document.getElementById('pdv-discount').value = '';
    if (document.getElementById('pdv-amount-received')) document.getElementById('pdv-amount-received').value = '';
    
    renderCart();
    renderCashierProducts();
    
    showNotification('Venda finalizada com sucesso!', 'success');
    
    // Mostra modal
    lastSaleId = saleId;
    const successModal = document.getElementById('pdvSuccessModal');
    if (successModal) {
        successModal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function printLastSale() {
    if (lastSaleId) {
        printSaleReceipt(lastSaleId);
        const successModal = document.getElementById('pdvSuccessModal');
        if (successModal) successModal.classList.add('hidden');
    }
}

function printSaleReceipt(id) {
    const sale = db.sales.find(s => s.id === id);
    if (!sale) return;

    const cfg = db.config || {};
    const win = window.open('', '_blank');
    if (!win) {
        showNotification('Bloqueador de pop-ups ativo.', 'warning');
        return;
    }

    const storeName = cfg.name || 'Sorveteria & Açaí Pro';
    const address   = cfg.address ? `END: ${cfg.address}<br>` : '';
    const phone     = cfg.phone   ? `FONE: ${cfg.phone}<br>` : '';

    win.document.write(`
        <html>
        <head>
            <title>Recibo PDV #${sale.id}</title>
            <style>
                @page { size: auto; margin: 0mm; }
                body { 
                    font-family: 'Courier New', Courier, monospace; 
                    width: 72mm; 
                    margin: 0 auto; 
                    padding: 5mm;
                    font-size: 11px;
                    line-height: 1.2;
                    color: #000;
                }
                .center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 5mm 0; }
                table { width: 100%; border-collapse: collapse; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
                .item-row td { padding: 1mm 0; }
                .total-row td { padding-top: 2mm; }
                .receipt-header { margin-bottom: 3mm; }
                .receipt-footer { margin-top: 5mm; font-size: 10px; }
            </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
            <div class="center receipt-header">
                <strong style="font-size: 14px;">${storeName.toUpperCase()}</strong><br>
                ${phone}
                ${address}
            </div>

            <div class="divider"></div>

            <div class="center bold">CUPOM NÃO FISCAL</div>
            <div class="center">
                VENDA: #${sale.id}<br>
                DATA: ${new Date(sale.timestamp).toLocaleString('pt-BR')}
            </div>

            <div class="divider"></div>

            <table>
                <thead>
                    <tr class="bold">
                        <th align="left">ITEM</th>
                        <th align="right">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(i => `
                        <tr class="item-row">
                            <td>
                                ${i.qty}x ${sanitizeHTML(i.name)}
                                ${i.details ? `<br><span style="font-size: 9px; color: #555;">${i.details}</span>` : ''}
                            </td>
                            <td class="right" style="vertical-align: top;">${fmtMoney(i.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="divider"></div>

            <table class="total-row">
                <tr>
                    <td>Subtotal:</td>
                    <td class="right">${fmtMoney(sale.subtotal)}</td>
                </tr>
                ${sale.discount > 0 ? `
                <tr>
                    <td>Desconto:</td>
                    <td class="right">-${fmtMoney(sale.discount)}</td>
                </tr>` : ''}
                <tr class="bold" style="font-size: 13px;">
                    <td>TOTAL:</td>
                    <td class="right">${fmtMoney(sale.total)}</td>
                </tr>
            </table>

            <div class="divider"></div>

            <div class="center text-sm">
                <strong>FORMA DE PAGAMENTO</strong><br>
                ${(sale.paymentMethod || 'Dinheiro').toUpperCase()}
                ${sale.changeValue > 0 ? `<br>TROCO: ${fmtMoney(sale.changeValue)}` : ''}
            </div>

            <div class="divider"></div>

            <div class="center receipt-footer">
                OBRIGADO PELA PREFERÊNCIA!<br>
            </div>
            
            <div style="height: 10mm;"></div>
        </body>
        </html>
    `);
    win.document.close();
}

// ── Venda Rápida (Modal do Header) ──────────────────────────
function openQuickSaleModal() {
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

    const grid = document.getElementById('quick-sale-grid');
    const products = (db.products || []).filter(p => p.stock > 0 || p.tipo !== 'padrao').slice(0, 8);
    grid.innerHTML = products.length === 0
        ? '<p class="col-span-2 text-center text-gray-400 py-4 text-sm">Nenhum produto cadastrado.</p>'
        : products.map(p => `
            <button onclick="addToCart('${p.id}'); closeQuickSaleModal(); router('cashier');"
                class="p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-xl text-left transition-all active:scale-95">
                <p class="text-xs font-bold text-gray-800 leading-tight">${p.name}</p>
                <p class="text-xs text-teal-600 font-bold mt-1">${fmtMoney(p.price || 0)}</p>
            </button>
        `).join('');

    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeQuickSaleModal() {
    const modal = document.getElementById('quick-sale-modal');
    if (modal) modal.classList.add('hidden');
}

function newSale() {
    clearSale();
    router('cashier');
}
