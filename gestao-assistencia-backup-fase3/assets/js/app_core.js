// 🔒 DADOS DA LICENÇA
const LICENSE_DATA = {
    active: false,
    ownerName: "",
    ownerDoc: ""
};

// ESTADO GLOBAL
const DB_KEY = 'gestao_assistencia_v1';
const defaultDB = {
    orders: [],
    clients: [],
    products: [],
    movements: [],
    transactions: [],
    pdvSales: [],
    settings: {
        companyName: 'Minha Assistência Técnica',
        companyDoc: '',
        companyPhone: '',
        companyAddress: '',
        currency: 'R$',
        theme: 'light',
        autoBackup: true,
        termsAccepted: false,
        termsAcceptedAt: null,
        technicians: []
    }
};
let db = JSON.parse(localStorage.getItem(DB_KEY)) || defaultDB;

// ESTADO TRANSIENTE DO PDV
let pdvCart = [];

// UTILITÁRIOS
const sanitizeHTML = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const save = () => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    updateDataStatus();
};

const fmtMoney = (v) => {
    return v.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const fmtDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR');
};

const fmtDateInput = (d) => {
    return new Date(d).toISOString().split('T')[0];
};

const getID = () => {
    return 'OS' + Date.now().toString(36).toUpperCase().substr(-6);
};

const getClientID = () => {
    return 'CL' + Date.now().toString(36).toUpperCase().substr(-6);
};

const getProductID = () => {
    return 'PR' + Date.now().toString(36).toUpperCase().substr(-6);
};

const getMovementID = () => {
    return 'MV' + Date.now().toString(36).toUpperCase().substr(-6);
};

const statusColors = {
    received: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Recebido' },
    analyzing: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Em Análise' },
    waiting_parts: { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'Aguardando Peça' },
    ready: { bg: 'bg-green-100', text: 'text-green-600', label: 'Pronto' },
    delivered: { bg: 'bg-purple-100', text: 'text-purple-600', label: 'Entregue' }
};

// VARIÁVEIS GLOBAIS PARA O SISTEMA DE ESTOQUE
let currentOrderParts = []; // Array para armazenar partes selecionadas na O.S.
let currentViewOrder = null; // Ordem sendo visualizada

// INICIALIZAÇÃO
function init() {
    lucide.createIcons();

    // Configurar datas padrão
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date();
    firstDay.setDate(1);
    const firstDayStr = firstDay.toISOString().split('T')[0];

    // Configurar inputs de data
    const dateInputs = [
        { id: 'trans-date', value: today },
        { id: 'filter-start', value: firstDayStr },
        { id: 'filter-end', value: today },
        { id: 'cash-start', value: firstDayStr },
        { id: 'cash-end', value: today },
        { id: 'movement-start', value: firstDayStr },
        { id: 'movement-end', value: today }
    ];

    dateInputs.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });

    // Carregar configurações da empresa
    loadCompanySettings();

    // Renderizar dados iniciais
    renderDashboard();
    updateDataStatus();

    // Configurar periodicidade para salvar
    setInterval(save, 30000);

    // Configurar event listeners para cálculos
    setupEventListeners();

    // Verificar instalação PWA
    checkInstallState();
}

function setupEventListeners() {
    // Atualizar total da O.S. quando valores mudarem
    ['order-labor', 'order-discount'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateOrderSummary);
        }
    });

    // Atualizar valor total da movimentação
    const movementQty = document.getElementById('movement-quantity');
    const movementValue = document.getElementById('movement-unit-value');
    if (movementQty && movementValue) {
        movementQty.addEventListener('input', updateMovementTotal);
        movementValue.addEventListener('input', updateMovementTotal);
    }

    // Atualizar quando produto selecionado na movimentação
    const movementProduct = document.getElementById('movement-product');
    if (movementProduct) {
        movementProduct.addEventListener('change', function () {
            updateMovementProductInfo(this.value);
        });
    }

    // Atualizar quando produto selecionado para adicionar à O.S.
    const selectProduct = document.getElementById('select-product');
    if (selectProduct) {
        selectProduct.addEventListener('change', function () {
            updateSelectedProductInfo(this.value);
        });
    }

    // Atualizar quantidade de peça na O.S.
    const partQty = document.getElementById('part-quantity');
    if (partQty) {
        partQty.addEventListener('input', updatePartTotal);
    }
}

function checkInstallState() {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        // Já está instalado
    }
}

function loadCompanySettings() {
    const settings = db.settings;
    document.getElementById('company-name').value = settings.companyName || '';
    document.getElementById('company-doc').value = settings.companyDoc || '';
    document.getElementById('company-phone').value = settings.companyPhone || '';
    document.getElementById('company-address').value = settings.companyAddress || '';
}

function saveCompanySettings() {
    db.settings.companyName = document.getElementById('company-name').value;
    db.settings.companyDoc = document.getElementById('company-doc').value;
    db.settings.companyPhone = document.getElementById('company-phone').value;
    db.settings.companyAddress = document.getElementById('company-address').value;
    save();
    showNotification('Configurações salvas com sucesso!', 'success');
}

// ROTEAMENTO E NAVEGAÇÃO
function router(view) {
    // Esconder todas as views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hide'));

    // Remover classe active de todos os nav items
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active-nav', 'text-white');
        el.classList.add('text-white/60');
    });

    // Mostrar view selecionada
    const viewElement = document.getElementById(`view-${view}`);
    if (viewElement) {
        viewElement.classList.remove('hide');
        viewElement.classList.add('fade-in');
    }

    // Ativar nav item selecionado
    const navElement = document.getElementById(`nav-${view}`);
    if (navElement) {
        navElement.classList.add('active-nav', 'text-white');
        navElement.classList.remove('text-white/60');
    }

    // Atualizar título da página
    const titles = {
        dashboard: 'Dashboard',
        orders: 'Ordens de Serviço',
        clients: 'Clientes',
        pdv: 'PDV - Vendas',
        inventory: 'Estoque',
        transactions: 'Fluxo de Caixa',
        reports: 'Relatórios',
        settings: 'Configurações',
        instructions: 'Manual de Uso',
        about: 'Informações Legais'
    };

    document.getElementById('page-title').innerText = titles[view] || 'Gestão Assistencia';

    // Fechar sidebar no mobile
    if (window.innerWidth < 1024) {
        toggleSidebar();
    }

    // Renderizar dados específicos da view
    if (view === 'dashboard') {
        renderDashboard();
    } else if (view === 'orders') {
        renderOrders();
    } else if (view === 'clients') {
        renderClients();
    } else if (view === 'inventory') {
        renderInventory();
        renderMovements();
        populateCategoryFilter();
        populateProductSelectors();
    } else if (view === 'pdv') {
        renderPDVGrid();
        renderPDVHistory();
    } else if (view === 'transactions') {
        renderTransactions();
    } else if (view === 'settings') {
        loadCompanySettings();
        renderTechniciansSettings();
    }
}

// --- GESTÃO DE TÉCNICOS ---
function addTechnician() {
    const input = document.getElementById('new-tech-name');
    const name = input.value.trim();
    if (!name) return;

    if (!db.settings.technicians) db.settings.technicians = [];
    db.settings.technicians.push(name);
    save();
    input.value = '';
    renderTechniciansSettings();
    showNotification('Colaborador adicionado!', 'success');
}

function removeTechnician(index) {
    if (confirm('Deseja remover este colaborador?')) {
        db.settings.technicians.splice(index, 1);
        save();
        renderTechniciansSettings();
        showNotification('Colaborador removido', 'success');
    }
}

function renderTechniciansSettings() {
    const list = document.getElementById('technicians-list');
    if (!list) return;

    const techs = db.settings.technicians || [];
    if (techs.length === 0) {
        list.innerHTML = '<p class="text-xs text-gray-400 italic">Nenhum técnico cadastrado.</p>';
        return;
    }

    list.innerHTML = techs.map((t, i) => `
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group">
            <span class="text-sm font-medium text-gray-700">${sanitizeHTML(t)}</span>
            <button onclick="removeTechnician(${i})" class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

function populateTechnicianSelect(selectedValue = '') {
    const select = document.getElementById('order-technician');
    if (!select) return;

    const techs = db.settings.technicians || [];
    select.innerHTML = '<option value="">Selecione um técnico</option>' +
        techs.map(t => `<option value="${sanitizeHTML(t)}" ${t === selectedValue ? 'selected' : ''}>${sanitizeHTML(t)}</option>`).join('');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');

    // Bloquear scroll do body quando sidebar aberta
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

// DASHBOARD
function renderDashboard() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthOrders = db.orders.filter(o => o.date && o.date.startsWith(currentMonth));
    const monthPDVSales = (db.pdvSales || []).filter(s => s.date && s.date.startsWith(currentMonth));

    // Calcular estatísticas
    const active = db.orders.filter(o => ['received', 'analyzing', 'waiting_parts'].includes(o.status)).length;
    const ready = db.orders.filter(o => o.status === 'ready').length;
    const pdvCount = monthPDVSales.length;

    const osRevenue = monthOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total || 0), 0);

    const pdvRevenue = monthPDVSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalRevenue = osRevenue + pdvRevenue;

    // Atualizar cards
    document.getElementById('dash-active').innerText = active;
    document.getElementById('dash-ready').innerText = ready;
    const pdvSalesEl = document.getElementById('dash-pdv-sales');
    if (pdvSalesEl) pdvSalesEl.innerText = pdvCount;
    document.getElementById('dash-revenue').innerText = fmtMoney(totalRevenue);

    // Atualizar gráfico
    renderChart();

    // Atualizar ordens recentes
    renderRecentOrders();

    // Atualizar alertas de estoque baixo
    renderLowStockAlerts();
}

function renderChart() {
    const chartArea = document.getElementById('chart-area');
    const statusCount = {
        received: 0,
        analyzing: 0,
        waiting_parts: 0,
        ready: 0,
        delivered: 0
    };

    db.orders.forEach(o => {
        if (statusCount[o.status] !== undefined) {
            statusCount[o.status]++;
        }
    });

    const maxValue = Math.max(...Object.values(statusCount), 1);

    const chartData = [
        { label: 'Recebido', value: statusCount.received, color: '#9CA3AF' },
        { label: 'Análise', value: statusCount.analyzing, color: '#3B82F6' },
        { label: 'Peça', value: statusCount.waiting_parts, color: '#F59E0B' },
        { label: 'Pronto', value: statusCount.ready, color: '#10B981' },
        { label: 'Entregue', value: statusCount.delivered, color: '#8B5CF6' }
    ];

    let chartHTML = '';
    chartData.forEach(item => {
        const height = (item.value / maxValue) * 100;
        chartHTML += `
            <div class="bar-group">
                <div class="bar-wrapper">
                    <div class="bar" 
                         style="height:${height}%; background-color:${item.color}"
                         data-value="${item.value} ${item.label}"></div>
                </div>
                <div class="x-label">${item.label.substring(0, 3)}</div>
            </div>
        `;
    });

    chartArea.innerHTML = chartHTML || '<p class="text-gray-400 text-sm">Sem dados para exibir</p>';
}

function renderRecentOrders() {
    const container = document.getElementById('recent-orders');
    const recent = db.orders
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center">Nenhuma ordem de serviço recente</p>';
        return;
    }

    container.innerHTML = recent.map(order => {
        const status = statusColors[order.status] || statusColors.received;
        return `
            <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full ${status.bg} flex items-center justify-center mr-3">
                        <i data-lucide="clipboard" class="w-4 h-4 ${status.text}"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-800">${order.client}</p>
                        <p class="text-xs text-gray-500">${order.device} • ${fmtDate(order.date)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-bold ${status.text}">${status.label}</span>
                    ${order.total > 0 ? `<p class="text-sm font-bold text-gray-800 mt-1">${fmtMoney(order.total)}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function renderLowStockAlerts() {
    const container = document.getElementById('low-stock-alerts');
    const lowStockProducts = db.products.filter(p => {
        return p.stock > 0 && p.stock <= p.minStock;
    }).slice(0, 5);

    if (lowStockProducts.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center">Estoque em dia</p>';
        return;
    }

    container.innerHTML = lowStockProducts.map(product => {
        const stockClass = product.stock === 0 ? 'stock-critical' :
            product.stock <= product.minStock * 0.5 ? 'stock-critical' : 'stock-low';

        return `
            <div class="flex items-center justify-between p-3 ${stockClass} rounded-lg">
                <div>
                    <p class="text-sm font-medium text-gray-800">${product.name}</p>
                    <p class="text-xs text-gray-600">${product.category}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold ${product.stock === 0 ? 'text-red-600' : 'text-yellow-600'}">
                        ${product.stock} un.
                    </p>
                    <p class="text-xs text-gray-500">Mín: ${product.minStock}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ORDENS DE SERVIÇO COM INTEGRAÇÃO DE ESTOQUE
function openOrderModal(order = null) {
    const modal = document.getElementById('orderModal');
    const title = modal.querySelector('#order-modal-title');

    // Resetar partes da ordem
    currentOrderParts = [];

    if (order) {
        // Modo edição
        title.textContent = 'Editar Ordem de Serviço';
        document.getElementById('order-id').value = order.id;
        document.getElementById('order-client').value = order.client || '';
        document.getElementById('order-phone').value = order.phone || '';
        document.getElementById('order-device').value = order.device || '';
        document.getElementById('order-brand').value = order.brand || '';
        document.getElementById('order-serial').value = order.serial || '';
        document.getElementById('order-password').value = order.password || '';
        document.getElementById('order-problem').value = order.problem || '';
        document.getElementById('order-diagnosis').value = order.diagnosis || '';
        document.getElementById('order-labor').value = order.labor || 0;
        document.getElementById('order-discount').value = order.discount || 0;

        // Carregar partes se existirem
        if (order.parts && Array.isArray(order.parts)) {
            currentOrderParts = [...order.parts];
            renderOrderPartsList();
        }

        populateTechnicianSelect(order.technician);
        updateOrderSummary();
    } else {
        // Modo criação
        title.textContent = 'Nova Ordem de Serviço';
        modal.querySelector('form').reset();
        document.getElementById('order-id').value = '';
        document.getElementById('order-labor').value = 0;
        document.getElementById('order-discount').value = 0;
        document.getElementById('order-parts-list').innerHTML = '';
        populateTechnicianSelect();
        updateOrderSummary();
    }

    modal.classList.remove('hidden');
}

function addPartFromInventory() {
    // Popular seletor de produtos
    const select = document.getElementById('select-product');
    select.innerHTML = '<option value="">Selecione um produto</option>';

    db.products.forEach(product => {
        if (product.stock > 0) {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.stock} disponíveis)`;
            select.appendChild(option);
        }
    });

    document.getElementById('addPartModal').classList.remove('hidden');
}

function updateSelectedProductInfo(productId) {
    const product = db.products.find(p => p.id === productId);
    const infoDiv = document.getElementById('product-info');
    const totalDiv = document.getElementById('part-total');

    if (product) {
        infoDiv.classList.remove('hidden');
        document.getElementById('available-stock').textContent = product.stock;
        document.getElementById('product-price-display').textContent = fmtMoney(product.price);

        // Calcular total inicial
        const quantity = parseInt(document.getElementById('part-quantity').value) || 1;
        const total = quantity * product.price;
        document.getElementById('part-total-value').textContent = fmtMoney(total);
        totalDiv.classList.remove('hidden');
    } else {
        infoDiv.classList.add('hidden');
        totalDiv.classList.add('hidden');
    }
}

function updatePartTotal() {
    const productId = document.getElementById('select-product').value;
    const quantity = parseInt(document.getElementById('part-quantity').value) || 1;
    const product = db.products.find(p => p.id === productId);

    if (product) {
        const total = quantity * product.price;
        document.getElementById('part-total-value').textContent = fmtMoney(total);
    }
}

function addSelectedPart() {
    const productId = document.getElementById('select-product').value;
    const quantity = parseInt(document.getElementById('part-quantity').value) || 1;
    const notes = document.getElementById('part-notes').value;

    const product = db.products.find(p => p.id === productId);

    if (!product) {
        showNotification('Selecione um produto válido', 'error');
        return;
    }

    if (quantity > product.stock) {
        showNotification(`Estoque insuficiente. Disponível: ${product.stock} unidades`, 'error');
        return;
    }

    // Adicionar à lista de partes
    const part = {
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.price,
        total: quantity * product.price,
        notes: notes
    };

    currentOrderParts.push(part);
    renderOrderPartsList();
    updateOrderSummary();

    // Fechar modal e limpar
    closeModal('addPartModal');
    document.getElementById('part-quantity').value = 1;
    document.getElementById('part-notes').value = '';
    document.getElementById('select-product').value = '';

    showNotification('Peça adicionada à ordem de serviço', 'success');
}

function renderOrderPartsList() {
    const container = document.getElementById('order-parts-list');

    if (currentOrderParts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-gray-400">
                <i data-lucide="package" class="w-8 h-8 mx-auto mb-2"></i>
                <p class="text-sm">Nenhuma peça adicionada</p>
            </div>
        `;
        return;
    }

    container.innerHTML = currentOrderParts.map((part, index) => `
        <div class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
            <div class="flex-1">
                <p class="font-medium text-gray-800">${part.productName}</p>
                <p class="text-xs text-gray-500">
                    ${part.quantity} x ${fmtMoney(part.unitPrice)} = ${fmtMoney(part.total)}
                    ${part.notes ? ` • ${part.notes}` : ''}
                </p>
            </div>
            <button onclick="removeOrderPart(${index})" 
                    class="ml-2 text-red-500 hover:text-red-700">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');

    lucide.createIcons();
}

function removeOrderPart(index) {
    currentOrderParts.splice(index, 1);
    renderOrderPartsList();
    updateOrderSummary();
}

function updateOrderSummary() {
    // Calcular total das peças
    const partsTotal = currentOrderParts.reduce((sum, part) => sum + part.total, 0);

    // Obter valores de mão de obra e desconto
    const labor = parseFloat(document.getElementById('order-labor').value) || 0;
    const discount = parseFloat(document.getElementById('order-discount').value) || 0;

    // Calcular total geral
    const total = partsTotal + labor - discount;

    // Atualizar displays
    document.getElementById('order-parts-total').textContent = fmtMoney(partsTotal);
    document.getElementById('summary-parts').textContent = fmtMoney(partsTotal);
    document.getElementById('summary-labor').textContent = fmtMoney(labor);
    document.getElementById('summary-discount').textContent = fmtMoney(discount);
    document.getElementById('order-total').textContent = fmtMoney(total);
}

function submitOrder(e) {
    e.preventDefault();

    const id = document.getElementById('order-id').value;
    const labor = parseFloat(document.getElementById('order-labor').value) || 0;
    const discount = parseFloat(document.getElementById('order-discount').value) || 0;
    const partsTotal = currentOrderParts.reduce((sum, part) => sum + part.total, 0);
    const total = partsTotal + labor - discount;

    const order = {
        id: id || getID(),
        client: document.getElementById('order-client').value.trim(),
        phone: document.getElementById('order-phone').value.trim(),
        device: document.getElementById('order-device').value.trim(),
        brand: document.getElementById('order-brand').value.trim(),
        serial: document.getElementById('order-serial').value.trim(),
        password: document.getElementById('order-password').value.trim(),
        problem: document.getElementById('order-problem').value.trim(),
        diagnosis: document.getElementById('order-diagnosis').value.trim(),
        parts: currentOrderParts,
        labor,
        discount,
        total,
        date: id ? db.orders.find(o => o.id === id).date : new Date().toISOString().split('T')[0],
        status: id ? db.orders.find(o => o.id === id).status : 'received',
        updatedAt: new Date().toISOString(),
        technician: document.getElementById('order-technician').value
    };

    if (!order.client || !order.device || !order.problem) {
        showNotification('Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    if (id) {
        // Editar ordem existente
        const index = db.orders.findIndex(o => o.id === id);
        if (index !== -1) {
            db.orders[index] = order;
        }
    } else {
        // Adicionar nova ordem
        db.orders.unshift(order);
    }

    // Salvar/atualizar cliente
    saveClientFromOrder(order);

    save();
    closeModal('orderModal');
    renderDashboard();
    renderOrders();

    showNotification('Ordem de serviço salva com sucesso!', 'success');
}

function saveClientFromOrder(order) {
    const existingClient = db.clients.find(c =>
        c.name.toLowerCase() === order.client.toLowerCase() ||
        (c.phone && c.phone === order.phone)
    );

    if (!existingClient && order.client) {
        db.clients.push({
            id: getClientID(),
            name: order.client,
            phone: order.phone,
            email: '',
            address: '',
            notes: '',
            orders: 1,
            lastOrder: order.date,
            totalSpent: order.total,
            createdAt: new Date().toISOString()
        });
    } else if (existingClient) {
        existingClient.orders += 1;
        existingClient.lastOrder = order.date;
        existingClient.totalSpent = (existingClient.totalSpent || 0) + order.total;
    }
}

// VIEW ORDER FUNCTIONS
function openOrderView(id) {
    const order = db.orders.find(o => o.id === id);
    if (!order) return;

    currentViewOrder = order;

    // Preencher dados da visualização
    document.getElementById('view-os-number').textContent = order.id;
    document.getElementById('view-os-id').textContent = order.id;
    document.getElementById('view-os-date').textContent = `Data: ${fmtDate(order.date)}`;

    // Layout das tags de status
    let statusHtml = `Status: ${statusColors[order.status]?.label || 'Recebido'}`;
    if (order.paid) {
        statusHtml += ` <span class="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded ml-2 font-bold" title="Lançado no Fluxo de Caixa">💰 PAGO</span>`;
    }
    if (order.partsDeducted) {
        statusHtml += ` <span class="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded ml-1 font-bold" title="Peças debitadas do Estoque">📦 BAIXA ESTOQUE</span>`;
    }
    document.getElementById('view-os-status').innerHTML = statusHtml;
    document.getElementById('view-client').textContent = order.client;
    document.getElementById('view-phone').textContent = order.phone || 'Não informado';
    document.getElementById('view-device').textContent = order.device + (order.brand ? ` - ${order.brand}` : '');
    document.getElementById('view-serial').textContent = order.serial || 'N/D';
    document.getElementById('view-problem').textContent = order.problem || 'Não informado';
    document.getElementById('view-diagnosis').textContent = order.diagnosis || 'Em análise';
    document.getElementById('view-labor').textContent = fmtMoney(order.labor || 0);
    document.getElementById('view-discount').textContent = fmtMoney(order.discount || 0);
    document.getElementById('view-total').textContent = fmtMoney(order.total || 0);

    // Exibir técnico responsável
    const techStatus = document.getElementById('view-os-status');
    if (order.technician) {
        techStatus.innerHTML += `<div class="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center justify-end">
            <i data-lucide="wrench" class="w-3 h-3 mr-1"></i> Técnico: ${order.technician}
        </div>`;
        lucide.createIcons();
    }

    // Mostrar/ocultar botão de usar peças
    const usePartsBtn = document.getElementById('btn-use-parts');
    if (usePartsBtn) {
        usePartsBtn.style.display = order.status === 'delivered' ? 'none' : 'flex';
    }

    // Atualizar seção de peças se existirem
    const partsContainer = document.getElementById('view-parts-container');
    const partsList = document.getElementById('view-parts-list');
    const partsTotalElem = document.getElementById('view-parts-total');
    const partsSummary = document.getElementById('view-parts-summary');

    if (order.parts && order.parts.length > 0) {
        partsContainer.classList.remove('hidden');

        // Calcular total das peças
        const partsTotal = order.parts.reduce((sum, part) => sum + part.total, 0);

        // Renderizar lista de peças
        partsList.innerHTML = order.parts.map(part => `
            <tr>
                <td class="py-2">${part.productName}${part.notes ? `<br><span class="text-xs text-gray-500">${part.notes}</span>` : ''}</td>
                <td class="py-2 text-center">${part.quantity}</td>
                <td class="py-2 text-right">${fmtMoney(part.total)}</td>
            </tr>
        `).join('');

        partsTotalElem.textContent = fmtMoney(partsTotal);
        partsSummary.textContent = fmtMoney(partsTotal);
    } else {
        partsContainer.classList.add('hidden');
        partsSummary.textContent = 'R$ 0,00';
    }

    document.getElementById('view-status-select').value = order.status;
    document.getElementById('orderViewModal').classList.remove('hidden');

    // Injetar cabeçalho corporativo
    updatePrintHeaders();
}

function usePartsFromOrder() {
    if (!currentViewOrder || !currentViewOrder.parts || currentViewOrder.parts.length === 0) {
        showNotification('Esta ordem não tem peças para usar do estoque', 'warning');
        return;
    }

    if (currentViewOrder.partsDeducted) {
        showNotification('As peças desta O.S. já foram debitadas do estoque anteriormente!', 'error');
        return;
    }

    if (confirm('Deseja debitar as peças usadas desta O.S. do estoque?\n\nEsta ação atualizará o estoque automaticamente.')) {
        let hasError = false;

        currentViewOrder.parts.forEach(part => {
            // Encontrar o produto no estoque
            const product = db.products.find(p => p.id === part.productId);
            if (product) {
                // Verificar se há estoque suficiente
                if (product.stock >= part.quantity) {
                    // Criar movimentação de saída
                    const movement = {
                        id: getMovementID(),
                        productId: product.id,
                        productName: product.name,
                        type: 'out',
                        quantity: part.quantity,
                        unitValue: product.cost, // Usar custo para movimentação interna
                        totalValue: part.quantity * product.cost,
                        reason: 'os_use',
                        notes: `Uso na O.S. ${currentViewOrder.id} - ${currentViewOrder.client}`,
                        date: new Date().toISOString().split('T')[0],
                        orderId: currentViewOrder.id
                    };

                    db.movements.push(movement);

                    // Atualizar estoque do produto
                    product.stock -= part.quantity;
                } else {
                    hasError = true;
                    showNotification(`Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Necessário: ${part.quantity}`, 'error');
                }
            }
        });

        if (!hasError) {
            currentViewOrder.partsDeducted = true;
            // Salva a alteração na OS atual no banco principal
            const idx = db.orders.findIndex(o => o.id === currentViewOrder.id);
            if (idx !== -1) {
                db.orders[idx] = currentViewOrder;
            }
            save();
            renderInventory();
            renderMovements();

            showNotification('Peças debitadas do estoque com sucesso!', 'success');
        }
    }
}

// SISTEMA DE ESTOQUE
function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const title = modal.querySelector('#product-modal-title');
    const form = modal.querySelector('form');

    if (product) {
        // Modo edição
        title.textContent = 'Editar Produto';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-code').value = product.code || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-stock').value = product.stock || 0;
        document.getElementById('product-min-stock').value = product.minStock || 3;
        document.getElementById('product-cost').value = product.cost || 0;
        document.getElementById('product-price').value = product.price || 0;
        document.getElementById('product-supplier').value = product.supplier || '';
        document.getElementById('product-notes').value = product.notes || '';
    } else {
        // Modo criação
        title.textContent = 'Novo Produto';
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-stock').value = 0;
        document.getElementById('product-min-stock').value = 3;
        document.getElementById('product-cost').value = 0;
        document.getElementById('product-price').value = 0;

        // Gerar código automático se não estiver editando
        document.getElementById('product-code').value = 'PR' + Date.now().toString(36).toUpperCase().substr(-6);
    }

    modal.classList.remove('hidden');
}

function submitProduct(e) {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value.trim();

    if (!name || !category) {
        showNotification('Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    const product = {
        id: id || getProductID(),
        code: document.getElementById('product-code').value.trim() || `PR${Date.now().toString(36).toUpperCase().substr(-6)}`,
        name,
        category,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        minStock: parseInt(document.getElementById('product-min-stock').value) || 3,
        cost: parseFloat(document.getElementById('product-cost').value) || 0,
        price: parseFloat(document.getElementById('product-price').value) || 0,
        supplier: document.getElementById('product-supplier').value.trim(),
        notes: document.getElementById('product-notes').value.trim(),
        createdAt: id ? db.products.find(p => p.id === id)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (id) {
        // Editar produto existente
        const index = db.products.findIndex(p => p.id === id);
        if (index !== -1) {
            db.products[index] = product;
        }
    } else {
        // Adicionar novo produto
        db.products.unshift(product);
    }

    save();
    closeModal('productModal');
    renderInventory();
    renderDashboard();

    // Atualizar selects que usam produtos
    populateProductSelectors();

    showNotification('Produto salvo com sucesso!', 'success');
}

function openMovementModal() {
    // Popular seletor de produtos
    const select = document.getElementById('movement-product');
    select.innerHTML = '<option value="">Selecione um produto</option>';

    db.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.stock} em estoque)`;
        select.appendChild(option);
    });

    // Resetar formulário
    document.getElementById('movementModal').querySelector('form').reset();
    document.querySelector('input[name="movement-type"][value="in"]').checked = true;
    document.getElementById('current-stock-info').classList.add('hidden');
    document.getElementById('movement-total').classList.add('hidden');

    const modal = document.getElementById('movementModal');
    modal.classList.remove('hidden');
}

function updateMovementProductInfo(productId) {
    const product = db.products.find(p => p.id === productId);
    const infoDiv = document.getElementById('current-stock-info');

    if (product) {
        infoDiv.classList.remove('hidden');
        document.getElementById('current-stock').textContent = product.stock;

        // Definir valor unitário padrão baseado no tipo de movimentação
        const movementType = document.querySelector('input[name="movement-type"]:checked').value;
        const unitValueInput = document.getElementById('movement-unit-value');

        if (movementType === 'in') {
            unitValueInput.value = product.cost;
        } else if (movementType === 'out') {
            unitValueInput.value = product.price;
        }

        updateMovementTotal();
    } else {
        infoDiv.classList.add('hidden');
    }
}

function updateMovementTotal() {
    const quantity = parseInt(document.getElementById('movement-quantity').value) || 0;
    const unitValue = parseFloat(document.getElementById('movement-unit-value').value) || 0;
    const total = quantity * unitValue;

    const totalDiv = document.getElementById('movement-total');
    if (total > 0) {
        document.getElementById('movement-total-value').textContent = fmtMoney(total);
        totalDiv.classList.remove('hidden');
    } else {
        totalDiv.classList.add('hidden');
    }
}

function submitMovement(e) {
    e.preventDefault();

    const productId = document.getElementById('movement-product').value;
    const type = document.querySelector('input[name="movement-type"]:checked').value;
    const quantity = parseInt(document.getElementById('movement-quantity').value);
    const unitValue = parseFloat(document.getElementById('movement-unit-value').value) || 0;
    const reason = document.getElementById('movement-reason').value;
    const notes = document.getElementById('movement-notes').value.trim();

    if (!productId || !quantity || quantity <= 0) {
        showNotification('Preencha todos os campos obrigatórios!', 'error');
        return;
    }

    const product = db.products.find(p => p.id === productId);
    if (!product) {
        showNotification('Produto não encontrado!', 'error');
        return;
    }

    // Verificar estoque para saídas
    if (type === 'out' && product.stock < quantity) {
        showNotification(`Estoque insuficiente! Disponível: ${product.stock}`, 'error');
        return;
    }

    // Criar movimentação
    const movement = {
        id: getMovementID(),
        productId: product.id,
        productName: product.name,
        type,
        quantity,
        unitValue,
        totalValue: quantity * unitValue,
        reason,
        notes,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    // Atualizar estoque do produto
    if (type === 'in') {
        product.stock += quantity;
    } else if (type === 'out') {
        product.stock -= quantity;
    } else if (type === 'adjust') {
        // Para ajuste, o usuário deve digitar a quantidade final desejada
        // Neste caso, a quantidade é a nova quantidade do estoque
        product.stock = quantity;
    }

    // Registrar a movimentação
    db.movements.unshift(movement);

    // Se for uma entrada (compra), registrar como transação de saída
    if (type === 'in' && unitValue > 0) {
        const transaction = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            type: 'expense',
            amount: movement.totalValue,
            desc: `Compra de ${product.name} - ${quantity} unidades`,
            category: 'parts',
            date: movement.date
        };
        db.transactions.push(transaction);
    }

    save();
    closeModal('movementModal');
    renderInventory();
    renderMovements();
    renderDashboard();
    renderTransactions();

    showNotification('Movimentação registrada com sucesso!', 'success');
}

function renderInventory() {
    const term = document.getElementById('search-inventory')?.value.toLowerCase() || '';
    const category = document.getElementById('filter-category')?.value || 'all';
    const stockFilter = document.getElementById('filter-stock')?.value || 'all';

    // Filtrar produtos
    let filtered = db.products.filter(p => {
        const matchesTerm = p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term);
        const matchesCategory = category === 'all' || p.category === category;

        let matchesStock = true;
        if (stockFilter === 'low') {
            matchesStock = p.stock > 0 && p.stock <= p.minStock;
        } else if (stockFilter === 'critical') {
            matchesStock = p.stock <= p.minStock * 0.5 || p.stock === 0;
        } else if (stockFilter === 'out') {
            matchesStock = p.stock === 0;
        }

        return matchesTerm && matchesCategory && matchesStock;
    });

    // Ordenar por nome
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    // Atualizar tabela
    const tbody = document.getElementById('inventory-table-body');
    const emptyMsg = document.getElementById('empty-inventory-msg');

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyMsg?.classList.remove('hidden');
        updateInventoryStats(filtered);
        return;
    }

    emptyMsg?.classList.add('hidden');

    tbody.innerHTML = filtered.map(p => {
        // Determinar classe CSS baseada no nível de estoque
        let stockClass = '';
        let stockText = '';

        if (p.stock === 0) {
            stockClass = 'stock-critical';
            stockText = 'ESGOTADO';
        } else if (p.stock <= p.minStock * 0.5) {
            stockClass = 'stock-critical';
            stockText = 'CRÍTICO';
        } else if (p.stock <= p.minStock) {
            stockClass = 'stock-low';
            stockText = 'BAIXO';
        } else {
            stockClass = 'stock-ok';
            stockText = 'OK';
        }

        return `
            <tr class="hover:bg-gray-50 group border-b border-gray-100 ${stockClass}">
                <td class="px-6 py-4 font-mono text-sm text-gray-500">${p.code}</td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${p.name}</div>
                    ${p.supplier ? `<div class="text-xs text-gray-400">${p.supplier}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        ${p.category}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-yellow-600' : 'text-green-600'}">
                        ${p.stock}
                    </span>
                    <div class="text-xs text-gray-500 ${stockClass.replace('stock-', 'text-')}">
                        ${stockText}
                    </div>
                </td>
                <td class="px-6 py-4 text-center text-gray-500">${p.minStock}</td>
                <td class="px-6 py-4 text-right font-mono text-sm">${fmtMoney(p.cost)}</td>
                <td class="px-6 py-4 text-right font-mono text-sm font-bold text-green-600">${fmtMoney(p.price)}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" 
                                class="text-gray-400 hover:text-blue-500 transition-colors"
                                title="Editar">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteProduct('${p.id}')" 
                                class="text-gray-400 hover:text-red-500 transition-colors"
                                title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
    updateInventoryStats(filtered);
}

function updateInventoryStats(filtered) {
    // Cards de total/categorias usam db.products inteiro (não filtrado)
    const total = db.products.length;
    const categories = [...new Set(db.products.map(p => p.category))];
    const totalValue = db.products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const lowStock = db.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length +
        db.products.filter(p => p.stock === 0).length;

    document.getElementById('inv-total').textContent = total;
    document.getElementById('inv-value').textContent = fmtMoney(totalValue);
    document.getElementById('inv-low').textContent = lowStock;
    document.getElementById('inv-categories').textContent = categories.length;
}

function renderMovements() {
    const start = document.getElementById('movement-start')?.value || '';
    const end = document.getElementById('movement-end')?.value || '';
    const type = document.getElementById('movement-type')?.value || 'all';

    // Filtrar movimentações
    let filtered = db.movements.filter(m => {
        const matchesType = type === 'all' || m.type === type;
        const matchesDate = (!start || m.date >= start) && (!end || m.date <= end);
        return matchesType && matchesDate;
    });

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Atualizar tabela
    const tbody = document.getElementById('movements-table-body');

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-400">
                    <i data-lucide="move" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                    <p>Nenhuma movimentação encontrada.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(m => {
        const typeConfig = {
            in: { icon: 'arrow-down-left', color: 'text-green-600', label: 'Entrada' },
            out: { icon: 'arrow-up-right', color: 'text-red-600', label: 'Saída' },
            adjust: { icon: 'refresh-cw', color: 'text-yellow-600', label: 'Ajuste' }
        }[m.type] || { icon: 'move', color: 'text-gray-600', label: 'Movimentação' };

        const reasonLabels = {
            purchase: 'Compra',
            sale: 'Venda',
            os_use: 'Uso em O.S.',
            loss: 'Perda/Avaria',
            adjustment: 'Ajuste',
            other: 'Outro'
        };

        return `
            <tr class="hover:bg-gray-50 group border-b border-gray-100">
                <td class="px-6 py-4 text-gray-500 whitespace-nowrap">${fmtDate(m.date)}</td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${m.productName}</div>
                    ${m.notes ? `<div class="text-xs text-gray-400">${m.notes}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center ${typeConfig.color}">
                        <i data-lucide="${typeConfig.icon}" class="w-4 h-4 mr-1"></i>
                        <span class="text-sm font-medium">${typeConfig.label}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center font-bold ${m.type === 'in' ? 'text-green-600' : m.type === 'out' ? 'text-red-600' : 'text-yellow-600'}">
                    ${m.type === 'in' ? '+' : m.type === 'out' ? '-' : '±'} ${m.quantity}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">${reasonLabels[m.reason] || m.reason}</td>
                <td class="px-6 py-4 text-right font-mono text-sm ${m.type === 'in' ? 'text-red-600' : 'text-green-600'}">
                    ${m.type === 'in' ? '-' : '+'} ${fmtMoney(m.totalValue)}
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function populateCategoryFilter() {
    const categories = [...new Set(db.products.map(p => p.category))].sort();
    const filter = document.getElementById('filter-category');

    if (filter) {
        // Salvar valor atual
        const currentValue = filter.value;

        // Reconstruir opções
        filter.innerHTML = '<option value="all">Todas Categorias</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filter.appendChild(option);
        });

        // Restaurar valor selecionado se ainda existir
        if (categories.includes(currentValue)) {
            filter.value = currentValue;
        }
    }
}

function populateProductSelectors() {
    // Popular seletor do modal de movimentação
    const movementSelect = document.getElementById('movement-product');
    if (movementSelect) {
        movementSelect.innerHTML = '<option value="">Selecione um produto</option>';
        db.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.stock} em estoque)`;
            movementSelect.appendChild(option);
        });
    }

    // Popular seletor do modal de adicionar peça à O.S.
    const partSelect = document.getElementById('select-product');
    if (partSelect) {
        partSelect.innerHTML = '<option value="">Selecione um produto</option>';
        db.products.forEach(product => {
            if (product.stock > 0) {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${product.stock} disponíveis)`;
                partSelect.appendChild(option);
            }
        });
    }
}

function deleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto?\n\nEsta ação não pode ser desfeita.')) {
        // Verificar se o produto está sendo usado em alguma O.S.
        const usedInOrders = db.orders.some(order =>
            order.parts && order.parts.some(part => part.productId === id)
        );

        if (usedInOrders) {
            showNotification('Este produto está sendo usado em ordens de serviço e não pode ser excluído.', 'error');
            return;
        }

        db.products = db.products.filter(p => p.id !== id);
        save();
        renderInventory();
        renderDashboard();
        populateProductSelectors();
        showNotification('Produto excluído com sucesso!', 'success');
    }
}

// ==========================================
// CLIENTES
// ==========================================

function openClientModal(client) {
    document.getElementById('client-id').value = client?.id || '';
    document.getElementById('client-name').value = client?.name || '';
    document.getElementById('client-phone').value = client?.phone || '';
    document.getElementById('client-email').value = client?.email || '';
    document.getElementById('client-address').value = client?.address || '';
    document.getElementById('client-notes').value = client?.notes || '';
    document.querySelector('#clientModal h3').textContent = client ? 'Editar Cliente' : 'Novo Cliente';
    document.getElementById('clientModal').classList.remove('hidden');
    lucide.createIcons();
}

function submitClient(event) {
    event.preventDefault();
    const id = document.getElementById('client-id').value;
    const client = {
        id: id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: document.getElementById('client-name').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        address: document.getElementById('client-address').value.trim(),
        notes: document.getElementById('client-notes').value.trim(),
        createdAt: id ? (db.clients.find(c => c.id === id)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    if (id) {
        const idx = db.clients.findIndex(c => c.id === id);
        if (idx !== -1) db.clients[idx] = client;
    } else {
        db.clients.unshift(client);
    }
    save();
    closeModal('clientModal');
    renderClients();
    showNotification(id ? 'Cliente atualizado!' : 'Cliente cadastrado!', 'success');
}

function renderClients() {
    const term = (document.getElementById('search-client')?.value || '').toLowerCase();
    const tbody = document.getElementById('clients-table-body');
    const emptyMsg = document.getElementById('empty-clients-msg');

    let filtered = db.clients.filter(c =>
        c.name.toLowerCase().includes(term) ||
        (c.phone || '').toLowerCase().includes(term) ||
        (c.email || '').toLowerCase().includes(term)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyMsg?.classList.remove('hidden');
        lucide.createIcons();
        return;
    }
    emptyMsg?.classList.add('hidden');

    tbody.innerHTML = filtered.map(client => {
        const clientOrders = db.orders.filter(o => o.clientId === client.id || o.client === client.name);
        const lastOrder = clientOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        return `
            <tr class="hover:bg-gray-50 group border-b border-gray-100">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${client.name}</div>
                    ${client.address ? `<div class="text-xs text-gray-400">${client.address}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    ${client.phone ? `<div class="text-sm text-gray-700">${client.phone}</div>` : ''}
                    ${client.email ? `<div class="text-xs text-gray-400">${client.email}</div>` : ''}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">${clientOrders.length}</span>
                </td>
                <td class="px-6 py-4 text-gray-500 text-sm">${lastOrder ? fmtDate(lastOrder.date) : '-'}</td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openClientModal(${JSON.stringify(client).replace(/"/g, '&quot;')})"
                                class="text-gray-400 hover:text-blue-500 transition-colors" title="Editar">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteClient('${client.id}')"
                                class="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
}

function deleteClient(id) {
    if (confirm('Excluir este cliente? Esta ação não pode ser desfeita.')) {
        db.clients = db.clients.filter(c => c.id !== id);
        save();
        renderClients();
        showNotification('Cliente excluído.', 'success');
    }
}

// ==========================================
// PDV - PONTO DE VENDA
// ==========================================

function renderPDVGrid(event) {
    const inputEl = document.getElementById('pdv-search');
    const searchTerm = inputEl.value.toLowerCase().trim();
    const grid = document.getElementById('pdv-product-grid');
    const emptyMsg = document.getElementById('pdv-empty-products');

    // Only show products with stock
    const availableProducts = db.products.filter(p => p.stock > 0);

    // Inserção rápida via Enter (Leitor de Código de Barras)
    if (event && event.key === 'Enter') {
        const exactMatch = availableProducts.find(p => p.code.toLowerCase() === searchTerm);
        if (exactMatch) {
            addToCart(exactMatch.id);
            inputEl.value = ''; // Limpa a busca para o próximo bip
            showNotification('Item adicionado!', 'success');
            renderPDVGrid(); // Re-renderiza a grid limpa
            return;
        } else if (searchTerm !== '') {
            showNotification('Código de barras não encontrado em estoque.', 'warning');
        }
    }

    const filtered = availableProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.code.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        return;
    }

    emptyMsg.classList.add('hidden');
    grid.innerHTML = filtered.map(product => `
        <div class="bg-white border text-left border-gray-100 rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full" onclick="addToCart('${product.id}')">
            <div class="flex-1">
                <span class="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md mb-2 inline-block">${product.code}</span>
                <h4 class="text-sm font-bold text-gray-800 line-clamp-2 leading-tight mb-1">${product.name}</h4>
                <p class="text-xs text-gray-500 mb-2">${product.category}</p>
            </div>
            <div class="flex items-end justify-between mt-2 pt-2 border-t border-gray-50">
                <div>
                    <p class="text-[10px] text-gray-400 font-medium">Estoque</p>
                    <p class="text-xs font-bold ${product.stock <= product.minStock ? 'text-red-500' : 'text-green-600'}">${product.stock} un.</p>
                </div>
                <p class="text-sm font-bold text-brand-primary">${fmtMoney(product.price)}</p>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = db.products.find(p => p.id === productId);
    if (!product) return;

    // Verifica se ja esta no carrinho
    const existingItem = pdvCart.find(item => item.productId === productId);

    const currentQtyInCart = existingItem ? parseInt(existingItem.qty) : 0;
    const availableStock = parseInt(product.stock);

    if (currentQtyInCart + 1 > availableStock) {
        showNotification('Estoque insuficiente para adicionar mais deste item.', 'error');
        return;
    }

    if (existingItem) {
        existingItem.qty++;
        existingItem.total = existingItem.qty * Number(existingItem.price);
    } else {
        pdvCart.push({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            qty: 1,
            total: Number(product.price)
        });
    }

    renderCart();
}

function updateCartItemQty(index, change, event) {
    if (event) {
        event.stopPropagation();
    }

    const item = pdvCart[index];
    if (!item) return;

    const product = db.products.find(p => p.id === item.productId);

    const currentQty = parseInt(item.qty);
    const delta = parseInt(change);
    const newQty = currentQty + delta;
    const availableStock = product ? parseInt(product.stock) : 0;

    if (newQty <= 0) {
        removeFromCart(index);
        return;
    }

    if (product && newQty > availableStock) {
        showNotification('Estoque insuficiente.', 'error');
        return;
    }

    item.qty = newQty;
    item.total = newQty * Number(item.price);
    renderCart();
}

function removeFromCart(index) {
    pdvCart.splice(index, 1);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('pdv-cart-items');
    const emptyMsg = document.getElementById('pdv-cart-empty');

    if (pdvCart.length === 0) {
        container.innerHTML = `
            <p id="pdv-cart-empty" class="text-center text-gray-400 text-sm py-6">
                <i data-lucide="shopping-cart" class="w-8 h-8 mx-auto mb-2 text-gray-300 block"></i>
                Nenhum item adicionado
            </p>
        `;
    } else {
        container.innerHTML = pdvCart.map((item, index) => `
            <div class="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                <div class="flex-1 min-w-0 pr-2">
                    <h4 class="text-xs font-bold text-gray-800 truncate">${item.name}</h4>
                    <p class="text-[10px] text-gray-500">${fmtMoney(item.price)}</p>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex items-center bg-white border border-gray-200 rounded-md">
                        <button type="button" onclick="updateCartItemQty(${index}, -1, event)" class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500">-</button>
                        <span class="w-6 text-center text-xs font-bold">${item.qty}</span>
                        <button type="button" onclick="updateCartItemQty(${index}, 1, event)" class="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-green-500">+</button>
                    </div>
                    <button type="button" onclick="removeFromCart(${index})" class="text-gray-400 hover:text-red-500 p-1">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                    </button>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    renderCartTotals();
}

function clearCart() {
    if (pdvCart.length > 0) {
        if (confirm('Tem certeza que deseja esvaziar o carrinho?')) {
            pdvCart = [];
            document.getElementById('pdv-discount').value = 0;
            renderCart();
        }
    }
}

function renderCartTotals() {
    const subtotal = pdvCart.reduce((sum, item) => sum + item.total, 0);
    const discountPct = parseFloat(document.getElementById('pdv-discount').value) || 0;
    const discountVal = subtotal * (discountPct / 100);
    const total = subtotal - discountVal;

    document.getElementById('pdv-subtotal').textContent = fmtMoney(subtotal);
    document.getElementById('pdv-discount-val').textContent = '- ' + fmtMoney(discountVal);
    document.getElementById('pdv-total').textContent = fmtMoney(total);

    // Re-render elements for split calculation
    const splitTotEl = document.getElementById('pdv-split-total');
    if (splitTotEl) {
        const splitDin = parseFloat(document.getElementById('pdv-split-dinheiro')?.value) || 0;
        const splitCart = parseFloat(document.getElementById('pdv-split-cartao')?.value) || 0;
        const splitPix = parseFloat(document.getElementById('pdv-split-pix')?.value) || 0;
        let received = splitDin + splitCart + splitPix;
        splitTotEl.textContent = fmtMoney(received);
        splitTotEl.className = `font-bold ${received >= total ? 'text-green-600' : 'text-orange-600'}`;
    }

    // Recalcula o troco junto se houver valor recebido
    calculateChange();
}

function toggleChangeInput() {
    const paymentMethodEl = document.querySelector('input[name="pdv-payment"]:checked');
    if (!paymentMethodEl) return;
    const paymentMethod = paymentMethodEl.value;

    const changeSection = document.getElementById('pdv-change-section');
    const splitSection = document.getElementById('pdv-split-section');
    const changeRow = document.getElementById('pdv-change-row');

    if (changeSection) changeSection.classList.add('hidden');
    if (splitSection) splitSection.classList.add('hidden');
    if (changeRow) changeRow.classList.add('hidden');

    if (paymentMethod === 'dinheiro') {
        if (changeSection) changeSection.classList.remove('hidden');
        if (changeRow) changeRow.classList.remove('hidden');

        const receivedInputBlock = document.querySelector('#pdv-change-section .flex.items-center.justify-between');
        if (receivedInputBlock) receivedInputBlock.classList.remove('hidden');

        calculateChange();
    } else if (paymentMethod === 'misto') {
        if (splitSection) splitSection.classList.remove('hidden');
        if (changeSection) changeSection.classList.remove('hidden');

        const receivedInputBlock = document.querySelector('#pdv-change-section .flex.items-center.justify-between');
        if (receivedInputBlock) receivedInputBlock.classList.add('hidden');

        if (changeRow) changeRow.classList.remove('hidden');
        calculateChange();
    } else {
        const amountInput = document.getElementById('pdv-amount-received');
        if (amountInput) amountInput.value = '';

        ['pdv-split-dinheiro', 'pdv-split-cartao', 'pdv-split-pix'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const changeVal = document.getElementById('pdv-change-val');
        if (changeVal) changeVal.textContent = 'R$ 0,00';
    }
}

function calculateChange() {
    const paymentMethodEl = document.querySelector('input[name="pdv-payment"]:checked');
    if (!paymentMethodEl) return;
    const paymentMethod = paymentMethodEl.value;

    const subtotal = pdvCart.reduce((sum, item) => sum + item.total, 0);
    const discountPct = parseFloat(document.getElementById('pdv-discount')?.value) || 0;
    const total = subtotal - (subtotal * (discountPct / 100));
    const changeValEl = document.getElementById('pdv-change-val');

    if (!changeValEl) return;

    let received = 0;

    if (paymentMethod === 'dinheiro') {
        const receivedInput = document.getElementById('pdv-amount-received');
        received = parseFloat(receivedInput?.value) || 0;
    } else if (paymentMethod === 'misto') {
        const splitDin = parseFloat(document.getElementById('pdv-split-dinheiro')?.value) || 0;
        const splitCart = parseFloat(document.getElementById('pdv-split-cartao')?.value) || 0;
        const splitPix = parseFloat(document.getElementById('pdv-split-pix')?.value) || 0;
        received = splitDin + splitCart + splitPix;

        const splitTotEl = document.getElementById('pdv-split-total');
        if (splitTotEl) {
            splitTotEl.textContent = fmtMoney(received);
            splitTotEl.className = `font-bold ${received >= total ? 'text-green-600' : 'text-orange-600'}`;
        }
    } else {
        received = total;
    }

    if (received > total) {
        const change = received - total;
        changeValEl.textContent = fmtMoney(change);
        changeValEl.classList.remove('text-red-500');
        changeValEl.classList.add('text-green-600');
    } else if (received > 0 && received < total) {
        const pending = total - received;
        changeValEl.textContent = 'Falta ' + fmtMoney(pending);
        changeValEl.classList.remove('text-green-600');
        changeValEl.classList.add('text-red-500');
    } else {
        changeValEl.textContent = 'R$ 0,00';
        changeValEl.classList.remove('text-red-500');
        changeValEl.classList.add('text-green-600');
    }
}

function isCaixaAberto() {
    const today = new Date().toISOString().split('T')[0];
    // Verifica se existe alguma transação de "Abertura de Caixa" hoje
    // Ou se baseia no histórico diário. Para um sistema simples local, 
    // podemos considerar que o primeiro acesso/venda do dia abre o caixa,
    // mas se houver um registro explícito de "Fechamento de Caixa" no dia de hoje,
    // o caixa está bloqueado para novas operações.

    const fechamentosHoje = db.transactions.filter(t =>
        t.date === today && t.category === 'closing'
    );

    return fechamentosHoje.length === 0;
}

function finalizeSale() {
    if (!isCaixaAberto()) {
        showNotification('O caixa de hoje já foi fechado! Realize a abertura ou aguarde amanhã.', 'error');
        return;
    }

    if (pdvCart.length === 0) {
        showNotification('O carrinho está vazio!', 'error');
        return;
    }

    const paymentMethod = document.querySelector('input[name="pdv-payment"]:checked').value;
    const subtotal = pdvCart.reduce((sum, item) => sum + item.total, 0);
    const discountPct = parseFloat(document.getElementById('pdv-discount').value) || 0;
    const discountVal = subtotal * (discountPct / 100);
    const total = subtotal - discountVal;

    let received = total;
    let change = 0;
    let splitDetails = null;

    if (paymentMethod === 'dinheiro') {
        const receivedInput = parseFloat(document.getElementById('pdv-amount-received').value) || 0;
        if (receivedInput > 0) {
            if (receivedInput < total) {
                showNotification('Valor recebido menor que o total da compra!', 'error');
                document.getElementById('pdv-amount-received').focus();
                return;
            }
            received = receivedInput;
            change = received - total;
        }
    } else if (paymentMethod === 'misto') {
        const splitDin = parseFloat(document.getElementById('pdv-split-dinheiro').value) || 0;
        const splitCart = parseFloat(document.getElementById('pdv-split-cartao').value) || 0;
        const splitPix = parseFloat(document.getElementById('pdv-split-pix').value) || 0;
        received = splitDin + splitCart + splitPix;

        if (received < total) {
            showNotification(`Múltiplos pagamentos não atingiram o total. Faltam ${fmtMoney(total - received)}!`, 'error');
            return;
        }

        change = received - total;
        splitDetails = {
            dinheiro: splitDin,
            cartao: splitCart,
            pix: splitPix
        };
    }

    const saleId = 'VD' + Date.now().toString(36).toUpperCase().substr(-6);
    const saleDate = new Date().toISOString();

    // 1. Salvar no pdvSales
    if (!db.pdvSales) db.pdvSales = [];

    db.pdvSales.unshift({
        id: saleId,
        date: saleDate,
        items: JSON.parse(JSON.stringify(pdvCart)), // clone
        subtotal: subtotal,
        discount: discountVal,
        total: total,
        payment: paymentMethod,
        received: received,
        changeValue: change,
        splitDetails: splitDetails
    });

    // 2. Dar baixa no estoque e registrar movimento
    pdvCart.forEach(item => {
        const productIndex = db.products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            db.products[productIndex].stock -= item.qty;
            db.products[productIndex].updatedAt = new Date().toISOString();

            // Registrar saida no movement history
            db.movements.unshift({
                id: getMovementID(),
                productId: item.productId,
                productName: item.name,
                type: 'out',
                quantity: item.qty,
                unitValue: item.price,
                totalValue: item.total,
                reason: `Venda PDV #${saleId}`,
                date: saleDate,
                createdAt: saleDate
            });
        }
    });

    // 3. Lançar no fluxo de caixa
    if (paymentMethod === 'misto' && splitDetails) {
        // Lança cada pedaço separadamente no fluxo de caixa para conferir as gavetas corretas
        if (splitDetails.dinheiro > 0) {
            let realDinheiro = splitDetails.dinheiro - change; // Abate o troco do caixa físico
            if (realDinheiro > 0) {
                db.transactions.unshift({
                    id: 'TR' + Date.now().toString(36).toUpperCase().substr(-6),
                    type: 'income', amount: realDinheiro, desc: `Venda PDV #${saleId} (Dinheiro)`,
                    category: 'sale', date: saleDate.split('T')[0], paymentMethod: 'dinheiro', createdAt: saleDate
                });
            }
        }
        if (splitDetails.cartao > 0) {
            db.transactions.unshift({
                id: 'TR' + Date.now().toString(36).toUpperCase().substr(-6),
                type: 'income', amount: splitDetails.cartao, desc: `Venda PDV #${saleId} (Cartão)`,
                category: 'sale', date: saleDate.split('T')[0], paymentMethod: 'cartao', createdAt: saleDate
            });
        }
        if (splitDetails.pix > 0) {
            db.transactions.unshift({
                id: 'TR' + Date.now().toString(36).toUpperCase().substr(-6),
                type: 'income', amount: splitDetails.pix, desc: `Venda PDV #${saleId} (Pix)`,
                category: 'sale', date: saleDate.split('T')[0], paymentMethod: 'pix', createdAt: saleDate
            });
        }
    } else {
        db.transactions.unshift({
            id: 'TR' + Date.now().toString(36).toUpperCase().substr(-6),
            type: 'income',
            amount: total,
            desc: `Venda PDV #${saleId}`,
            category: 'sale',
            date: saleDate.split('T')[0],
            paymentMethod: paymentMethod,
            createdAt: saleDate
        });
    }

    // Salvar e resetar interface
    save();
    pdvCart = [];
    document.getElementById('pdv-discount').value = 0;
    const amountInput = document.getElementById('pdv-amount-received');
    if (amountInput) amountInput.value = '';
    document.getElementById('pdv-split-dinheiro').value = '';
    document.getElementById('pdv-split-cartao').value = '';
    document.getElementById('pdv-split-pix').value = '';

    renderCart();
    renderPDVGrid(); // Refresh stock
    renderPDVHistory();
    renderDashboard(); // Atualiza painel principal async
    toggleChangeInput(); // Reseta interface de troco

    showNotification('Venda finalizada com sucesso!', 'success');

    // Refocar a busca para a próxima venda instantânea
    setTimeout(() => {
        document.getElementById('pdv-search').focus();
    }, 300);
}

function renderPDVHistory() {
    if (!db.pdvSales) db.pdvSales = [];

    const container = document.getElementById('pdv-history-body');
    const emptyMsg = document.getElementById('pdv-history-empty');
    const countBadge = document.getElementById('pdv-sales-count');

    countBadge.textContent = `${db.pdvSales.length} vendas`;

    if (db.pdvSales.length === 0) {
        container.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        return;
    }

    emptyMsg.classList.add('hidden');

    const paymentIcons = {
        'dinheiro': '💵 Dinheiro',
        'cartao': '💳 Cartão',
        'pix': '📱 Pix'
    };

    container.innerHTML = db.pdvSales.map((sale, index) => {
        const dateObj = new Date(sale.date);
        const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('pt-BR');

        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-3 font-medium text-gray-900">#${sale.id}</td>
            <td class="px-6 py-3 text-gray-500">${dateStr} ${timeStr}</td>
            <td class="px-6 py-3 text-gray-500">${sale.items.reduce((s, i) => s + i.qty, 0)} vol.</td>
            <td class="px-6 py-3 text-gray-500">${paymentIcons[sale.payment] || sale.payment}</td>
            <td class="px-6 py-3 font-bold text-gray-900 text-right">${fmtMoney(sale.total)}</td>
            <td class="px-6 py-3 text-center">
                <button onclick="printSaleReceipt('${sale.id}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded-md" title="Imprimir Recibo">
                    <i data-lucide="printer" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function exportSalesCSV() {
    if (!db.pdvSales || db.pdvSales.length === 0) {
        showNotification('Não há vendas para exportar.', 'error');
        return;
    }

    let csv = 'ID,Data,Hora,Itens,Volumes,Desconto,Total,Pagamento\n';

    db.pdvSales.forEach(s => {
        const dateObj = new Date(s.date);
        const d = dateObj.toLocaleDateString('pt-BR');
        const t = dateObj.toLocaleTimeString('pt-BR');
        const itemsStr = s.items.map(i => `${i.qty}x ${i.name}`).join(' | ');
        const vols = s.items.reduce((acc, i) => acc + i.qty, 0);

        csv += `"${s.id}","${d}","${t}","${itemsStr}","${vols}","${s.discount}","${s.total}","${s.payment}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vendas_pdv_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function printSaleReceipt(id) {
    const sale = db.pdvSales.find(s => s.id === id);
    if (!sale) return;

    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Recibo PDV #${sale.id}</title>
            <style>
                body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                h2, h3 { text-align: center; margin: 5px 0; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; }
                td, th { padding: 4px 0; font-size: 14px; }
                .right { text-align: right; }
                .bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <h2>${db.settings.companyName}</h2>
            ${db.settings.companyDoc ? `<h3>CNPJ/CPF: ${db.settings.companyDoc}</h3>` : ''}
            ${db.settings.companyPhone ? `<h3>Tel: ${db.settings.companyPhone}</h3>` : ''}
            <div class="divider"></div>
            <h3>RECIBO DE VENDA #${sale.id}</h3>
            <p>Emissão: ${new Date(sale.date).toLocaleString('pt-BR')}</p>
            <div class="divider"></div>
            <table>
                <tr>
                    <th>QTD</th>
                    <th>ITEM</th>
                    <th class="right">R$ TOTAL</th>
                </tr>
                ${sale.items.map(i => `
                    <tr>
                        <td>${i.qty}</td>
                        <td>${i.name.substring(0, 15)}</td>
                        <td class="right">${i.total.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </table>
            <div class="divider"></div>
            <table>
                <tr><td>Subtotal</td><td class="right">${sale.subtotal.toFixed(2)}</td></tr>
                <tr><td>Desconto</td><td class="right">${sale.discount.toFixed(2)}</td></tr>
                <tr><td class="bold">TOTAL</td><td class="right bold">${sale.total.toFixed(2)}</td></tr>
                <tr><td>Pgto.</td><td class="right">${sale.payment.toUpperCase()}</td></tr>
                ${sale.payment === 'misto' && sale.splitDetails ? `
                <tr><td>- Dinheiro</td><td class="right">${sale.splitDetails.dinheiro.toFixed(2)}</td></tr>
                <tr><td>- Cartão</td><td class="right">${sale.splitDetails.cartao.toFixed(2)}</td></tr>
                <tr><td>- Pix</td><td class="right">${sale.splitDetails.pix.toFixed(2)}</td></tr>
                ` : ''}
                ${sale.received > sale.total && (sale.payment === 'dinheiro' || sale.payment === 'misto') ? `
                <tr><td>Recebido</td><td class="right">${sale.received.toFixed(2)}</td></tr>
                <tr><td>Troco</td><td class="right">${sale.changeValue.toFixed(2)}</td></tr>
                ` : ''}
            </table>
            <div class="divider"></div>
            <p style="text-align: center; font-size: 12px;">Obrigado pela preferência!</p>
        </body>
        </html>
    `);
    win.document.close();
    setTimeout(() => {
        win.print();
    }, 500);
}

// ==========================================
// FLUXO DE CAIXA
// ==========================================

function openTransactionModal(trans) {
    document.getElementById('trans-id').value = trans?.id || '';
    document.getElementById('trans-amount').value = trans?.amount || '';
    document.getElementById('trans-desc').value = trans?.desc || '';
    document.getElementById('trans-category').value = trans?.category || 'service';
    document.getElementById('trans-date').value = trans?.date || new Date().toISOString().split('T')[0];
    const radios = document.querySelectorAll('input[name="trans-type"]');
    radios.forEach(r => { r.checked = r.value === (trans?.type || 'income'); });
    document.querySelector('#transactionModal h3').textContent = trans ? 'Editar Lançamento' : 'Novo Lançamento';
    document.getElementById('transactionModal').classList.remove('hidden');
    lucide.createIcons();
}

function submitTransaction(event) {
    event.preventDefault();
    const id = document.getElementById('trans-id').value;
    const type = document.querySelector('input[name="trans-type"]:checked')?.value || 'income';
    const trans = {
        id: id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        type,
        amount: parseFloat(document.getElementById('trans-amount').value) || 0,
        desc: document.getElementById('trans-desc').value.trim(),
        category: document.getElementById('trans-category').value,
        date: document.getElementById('trans-date').value || new Date().toISOString().split('T')[0]
    };
    if (id) {
        const idx = db.transactions.findIndex(t => t.id === id);
        if (idx !== -1) db.transactions[idx] = trans;
    } else {
        db.transactions.unshift(trans);
    }
    save();
    closeModal('transactionModal');
    renderTransactions();
    renderDashboard();
    showNotification(id ? 'Lançamento atualizado!' : 'Lançamento registrado!', 'success');
}

function renderTransactions() {
    const start = document.getElementById('cash-start')?.value || '';
    const end = document.getElementById('cash-end')?.value || '';
    const type = document.getElementById('cash-type')?.value || 'all';

    let filtered = db.transactions.filter(t => {
        const matchesType = type === 'all' || t.type === type;
        const matchesDate = (!start || t.date >= start) && (!end || t.date <= end);
        return matchesType && matchesDate;
    });
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const now = new Date();
    const monthStr = `${now.getFullYear()} - ${String(now.getMonth() + 1).padStart(2, '0')
        } `;
    const monthTrans = db.transactions.filter(t => t.date && t.date.startsWith(monthStr));
    const monthIncome = monthTrans.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const monthExpense = monthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const totalBalance = db.transactions.reduce((s, t) => t.type === 'income' ? s + (t.amount || 0) : s - (t.amount || 0), 0);

    const el = id => document.getElementById(id);
    if (el('cash-balance')) el('cash-balance').textContent = fmtMoney(totalBalance);
    if (el('cash-income')) el('cash-income').textContent = '+' + fmtMoney(monthIncome);
    if (el('cash-expense')) el('cash-expense').textContent = '-' + fmtMoney(monthExpense);

    const catLabels = { sale: 'Venda PDV', service: 'Serviço', parts: 'Peças', supplies: 'Materiais', rent: 'Aluguel', utilities: 'Contas', other: 'Outros' };
    const tbody = document.getElementById('trans-table-body');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">
                <i data-lucide="wallet" class="w-12 h-12 mx-auto mb-4 text-gray-300"></i>
                <p>Nenhum lançamento encontrado.</p></td></tr>`;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = filtered.map(t => `
        <tr class="hover:bg-gray-50 group border-b border-gray-100">
            <td class="px-6 py-4 text-gray-500 whitespace-nowrap">${fmtDate(t.date)}</td>
            <td class="px-6 py-4 font-medium text-gray-800">${t.desc}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    ${catLabels[t.category] || t.category}
                </span>
            </td>
            <td class="px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                ${t.type === 'income' ? '+' : '-'}${fmtMoney(t.amount)}
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="openTransactionModal(${JSON.stringify(t).replace(/"/g, '&quot;')})"
                            class="text-gray-400 hover:text-blue-500 transition-colors" title="Editar">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteTransaction('${t.id}')"
                            class="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

function deleteTransaction(id) {
    if (confirm('Excluir este lançamento?')) {
        db.transactions = db.transactions.filter(t => t.id !== id);
        save();
        renderTransactions();
        renderDashboard();
        showNotification('Lançamento excluído.', 'success');
    }
}

// ==========================================
// FECHAMENTO DE CAIXA
// ==========================================

function openClosingModal() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrans = db.transactions.filter(t => t.date === today);
    const inc = todayTrans.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const exp = todayTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const bal = inc - exp;

    const now = new Date();
    document.getElementById('closing-date').textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('closing-time').textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('closing-inc').textContent = fmtMoney(inc);
    document.getElementById('closing-exp').textContent = fmtMoney(exp);
    document.getElementById('closing-bal').textContent = fmtMoney(bal);
    document.getElementById('closing-bal').className = `font - bold text - 2xl ${bal >= 0 ? 'text-green-700' : 'text-red-700'} `;

    document.getElementById('closingModal').classList.remove('hidden');
    lucide.createIcons();
}

function shareClosingWhatsApp() {
    const inc = document.getElementById('closing-inc').textContent;
    const exp = document.getElementById('closing-exp').textContent;
    const bal = document.getElementById('closing-bal').textContent;
    const date = document.getElementById('closing-date').textContent;
    const msg = encodeURIComponent(
        `📊 * Fechamento de Caixa *\n📅 ${date} \n\n` +
        `✅ Entradas: ${inc} \n❌ Saídas: ${exp} \n💰 Saldo: ${bal} \n\n` +
        `_${db.settings.companyName || 'Assistência Técnica'} _`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function confirmClosing() {
    if (!confirm('Deseja realmente registrar o fechamento do caixa? Não será possível realizar novas vendas no PDV hoje após o fechamento.')) return;

    const today = new Date().toISOString().split('T')[0];
    const incStr = document.getElementById('closing-inc').textContent;
    const expStr = document.getElementById('closing-exp').textContent;
    const balStr = document.getElementById('closing-bal').textContent;

    db.transactions.unshift({
        id: 'FC' + Date.now().toString(36).toUpperCase().substr(-6),
        type: 'info', // Apenas informativo no extrato
        amount: 0,
        desc: `Fechamento Diário | Entradas: ${incStr} | Saídas: ${expStr} | Saldo: ${balStr}`,
        category: 'closing',
        date: today,
        createdAt: new Date().toISOString()
    });

    save();
    closeModal('closingModal');
    renderTransactions();
    showNotification('Fechamento de caixa registrado com sucesso!', 'success');
}

function printClosing() {
    const inc = document.getElementById('closing-inc').textContent;
    const exp = document.getElementById('closing-exp').textContent;
    const bal = document.getElementById('closing-bal').textContent;
    const date = document.getElementById('closing-date').textContent;
    const s = db.settings;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Fechamento de Caixa</title>
        <style>body{font-family:monospace;max-width:300px;margin:0 auto;padding:20px;font-size:13px}
        h2{text-align:center;font-size:14px;text-transform:uppercase}
        .line{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ccc}
        .total{font-weight:bold;font-size:15px;border-top:2px solid #000;padding-top:8px;margin-top:8px}</style>
        </head><body>
        <h2>${s.companyName || 'ASSISTÊNCIA TÉCNICA'}</h2>
        ${s.companyPhone ? `<p style="text-align:center;font-size:11px">${s.companyPhone}</p>` : ''}
        <p style="text-align:center;font-size:11px">${date}</p>
        <hr>
        <p style="text-align:center;font-weight:bold;margin:10px 0">FECHAMENTO DE CAIXA</p>
        <div class="line"><span>Entradas</span><span>${inc}</span></div>
        <div class="line"><span>Saídas</span><span>${exp}</span></div>
        <div class="line total"><span>Saldo Final</span><span>${bal}</span></div>
        <p style="text-align:center;margin-top:20px;font-size:11px">Licença Vitalícia</p>
        </body></html>`);
    win.document.close();
    win.print();
}

// ==========================================
// RELATÓRIOS
// ==========================================

function generateMonthlyReport() {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthOrders = db.orders.filter(o => o.date && o.date.startsWith(monthStr));
    const monthTrans = db.transactions.filter(t => t.date && t.date.startsWith(monthStr));
    const monthPDV = (db.pdvSales || []).filter(s => s.date && s.date.startsWith(monthStr));

    const totalOS = monthOrders.length;

    // Revenue from Orders + PDV
    const orderRevenue = monthOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0);
    const pdvRevenue = monthPDV.reduce((s, o) => s + (o.total || 0), 0);
    const revenue = orderRevenue + pdvRevenue;

    const income = monthTrans.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = monthTrans.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const balance = income - expense;

    const byStatus = {};
    monthOrders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });

    const topClients = {};
    monthOrders.forEach(o => { topClients[o.client] = (topClients[o.client] || 0) + (o.total || 0); });

    // Add PDV as a client for comparison
    if (pdvRevenue > 0) {
        topClients['Vendas de Balcão (PDV)'] = pdvRevenue;
    }

    const topClientsList = Object.entries(topClients).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = `
        <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-1">Relatório Mensal — ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <p class="text-sm text-gray-500">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total O.S.</p>
                <p class="text-2xl font-bold text-blue-700">${totalOS}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Faturado</p>
                <p class="text-xl font-bold text-green-700">${fmtMoney(revenue)}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Entradas</p>
                <p class="text-xl font-bold text-yellow-700">${fmtMoney(income)}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Saldo Mês</p>
                <p class="text-xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}">${fmtMoney(balance)}</p>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white p-4 rounded-xl border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-3">O.S. por Status</h4>
                ${Object.entries(statusColors).map(([key, val]) => `
                    <div class="flex justify-between items-center mb-2 p-2 rounded hover:bg-gray-50">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${val.bg} ${val.text}">${val.label}</span>
                        <span class="font-bold text-gray-700">${byStatus[key] || 0}</span>
                    </div>
                `).join('')}
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-3">Top Clientes (Faturamento)</h4>
                ${topClientsList.length > 0 ? topClientsList.map(([name, total]) => `
                    <div class="flex justify-between items-center mb-2 p-2 hover:bg-gray-50 rounded">
                        <span class="font-medium text-gray-800 truncate">${name}</span>
                        <span class="font-bold text-green-600 ml-2">${fmtMoney(total)}</span>
                    </div>
                `).join('') : '<p class="text-gray-400 text-center text-sm">Nenhum faturamento no mês</p>'}
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="printReport()"
                class="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Relatório
            </button>
            <button onclick="exportOrdersCSV()"
                class="bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex justify-center items-center gap-2">
                <i data-lucide="download" class="w-4 h-4"></i> Exportar O.S. CSV
            </button>
        </div>
    `;
    document.getElementById('report-result').classList.remove('hide');
    lucide.createIcons();
}

function generateFinancialReport() {
    const income = db.transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = db.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const balance = income - expense;

    const byCat = {};
    db.transactions.forEach(t => {
        if (!byCat[t.category]) byCat[t.category] = { income: 0, expense: 0 };
        byCat[t.category][t.type] = (byCat[t.category][t.type] || 0) + (t.amount || 0);
    });

    const catLabels = { sale: 'Venda PDV', service: 'Serviço', parts: 'Peças', supplies: 'Materiais', rent: 'Aluguel', utilities: 'Contas', other: 'Outros' };

    const byMonth = {};
    db.transactions.forEach(t => {
        const m = (t.date || '').substr(0, 7);
        if (!m) return;
        if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
        byMonth[m][t.type] = (byMonth[m][t.type] || 0) + (t.amount || 0);
    });
    const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);

    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = `
        <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-1">Relatório Financeiro Completo</h3>
            <p class="text-sm text-gray-500">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Entradas</p>
                <p class="text-2xl font-bold text-green-700">${fmtMoney(income)}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Saídas</p>
                <p class="text-2xl font-bold text-red-700">${fmtMoney(expense)}</p>
            </div>
            <div class="${balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'} p-4 rounded-xl border text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Saldo Geral</p>
                <p class="text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}">${fmtMoney(balance)}</p>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white p-4 rounded-xl border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-3">Por Categoria</h4>
                ${Object.entries(byCat).map(([cat, vals]) => `
                    <div class="flex justify-between items-center mb-2 p-2 hover:bg-gray-50 rounded">
                        <span class="text-sm font-medium text-gray-700">${catLabels[cat] || cat}</span>
                        <div class="text-right text-xs">
                            ${vals.income ? `<div class="text-green-600 font-bold">+${fmtMoney(vals.income)}</div>` : ''}
                            ${vals.expense ? `<div class="text-red-600 font-bold">-${fmtMoney(vals.expense)}</div>` : ''}
                        </div>
                    </div>
                `).join('') || '<p class="text-gray-400 text-sm text-center">Sem lançamentos</p>'}
            </div>
            <div class="bg-white p-4 rounded-xl border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-3">Últimos 6 Meses</h4>
                ${months.map(([month, vals]) => {
        const [yr, mo] = month.split('-');
        const label = new Date(yr, parseInt(mo) - 1).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        const bal = (vals.income || 0) - (vals.expense || 0);
        return `
                    <div class="flex justify-between items-center mb-2 p-2 hover:bg-gray-50 rounded">
                        <span class="text-sm font-medium text-gray-700 capitalize">${label}</span>
                        <span class="font-bold text-sm ${bal >= 0 ? 'text-green-600' : 'text-red-600'}">${fmtMoney(bal)}</span>
                    </div>`;
    }).join('') || '<p class="text-gray-400 text-sm text-center">Sem dados</p>'}
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="printReport()"
                class="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Relatório
            </button>
            <button onclick="exportTransactionsCSV()"
                class="bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex justify-center items-center gap-2">
                <i data-lucide="download" class="w-4 h-4"></i> Exportar CSV
            </button>
        </div>
    `;
    document.getElementById('report-result').classList.remove('hide');
    lucide.createIcons();
}

function printReport() {
    window.print();
}

function exportTransactionsCSV() {
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
    const catLabels = { service: 'Serviço', parts: 'Peças', supplies: 'Materiais', rent: 'Aluguel', utilities: 'Contas', other: 'Outros' };
    const rows = db.transactions.sort((a, b) => b.date.localeCompare(a.date)).map(t => [
        fmtDate(t.date),
        t.type === 'income' ? 'Entrada' : 'Saída',
        catLabels[t.category] || t.category,
        `"${t.desc}"`,
        (t.type === 'income' ? '' : '-') + (t.amount || 0).toFixed(2).replace('.', ',')
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV exportado com sucesso!', 'success');
}

// ==========================================
// BACKUP E SEGURANÇA DE DADOS
// ==========================================

function downloadBackup() {
    const data = JSON.stringify(db, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_assistencia_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup baixado com sucesso!', 'success');
}

function restoreBackup(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const restored = JSON.parse(e.target.result);
            if (!restored.orders || !restored.clients) {
                showNotification('Arquivo de backup inválido!', 'error');
                return;
            }
            if (!confirm('Restaurar backup? Os dados atuais serão substituídos.\n\nEsta ação não pode ser desfeita!')) return;
            db = Object.assign({}, defaultDB, restored);
            save();
            renderDashboard();
            renderOrders();
            renderClients();
            renderInventory();
            renderTransactions();
            showNotification('Backup restaurado com sucesso!', 'success');
        } catch {
            showNotification('Erro ao ler o arquivo de backup!', 'error');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function clearOldOrders() {
    const delivered = db.orders.filter(o => o.status === 'delivered');
    if (delivered.length === 0) {
        showNotification('Nenhuma O.S. entregue encontrada.', 'info');
        return;
    }
    if (!confirm(`Excluir ${delivered.length} ordem(ns) de serviço com status "Entregue"?\n\nEsta ação não pode ser desfeita!`)) return;
    db.orders = db.orders.filter(o => o.status !== 'delivered');
    save();
    renderOrders();
    renderDashboard();
    showNotification(`${delivered.length} O.S. entregues excluídas!`, 'success');
}

function factoryReset() {
    if (!confirm('ATENÇÃO: Isso apagará TODOS os dados do sistema!\n\nTem certeza?')) return;
    if (!confirm('ÚLTIMA CONFIRMAÇÃO: Todos os dados serão perdidos permanentemente.\n\nContinuar?')) return;
    db = JSON.parse(JSON.stringify(defaultDB));
    save();
    renderDashboard();
    renderOrders();
    renderClients();
    renderInventory();
    renderTransactions();
    showNotification('Sistema resetado para os padrões de fábrica.', 'info');
}

// ==========================================
// EXPORTAÇÃO E IMPRESSÃO DE O.S.
// ==========================================

function exportOrdersCSV() {
    const headers = ['ID', 'Cliente', 'Telefone', 'Equipamento', 'Marca', 'Status', 'Data', 'Total'];
    const rows = db.orders.map(o => [
        o.id,
        `"${o.client}"`,
        o.phone || '',
        `"${o.device}"`,
        o.brand || '',
        statusColors[o.status]?.label || o.status,
        fmtDate(o.date),
        (o.total || 0).toFixed(2).replace('.', ',')
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordens_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('CSV exportado com sucesso!', 'success');
}

function printOrderList() {
    const term = (document.getElementById('search-order')?.value || '').toLowerCase();
    const startDate = document.getElementById('filter-start')?.value || '';
    const endDate = document.getElementById('filter-end')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || 'all';
    let filtered = db.orders.filter(o => {
        const matchesTerm = !term || o.client.toLowerCase().includes(term) || o.device.toLowerCase().includes(term) || o.id.includes(term);
        const matchesDate = (!startDate || o.date >= startDate) && (!endDate || o.date <= endDate);
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesTerm && matchesDate && matchesStatus;
    });
    const s = db.settings;
    const rows = filtered.map(o => `
        <tr>
            <td>${o.id}</td>
            <td>${o.client}</td>
            <td>${o.device}${o.brand ? ' — ' + o.brand : ''}</td>
            <td>${statusColors[o.status]?.label || o.status}</td>
            <td>${fmtDate(o.date)}</td>
            <td style="text-align:right">${fmtMoney(o.total)}</td>
        </tr>
    `).join('');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Lista de O.S.</title>
        <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
        h2{text-align:center}table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
        th{background:#f0f0f0;font-weight:bold}</style></head><body>
        <h2>${s.companyName || 'ASSISTÊNCIA TÉCNICA'} — Lista de O.S.</h2>
        <p style="text-align:center;font-size:11px">Emitido em ${new Date().toLocaleString('pt-BR')}</p>
        <table><thead><tr><th>ID</th><th>Cliente</th><th>Equipamento</th><th>Status</th><th>Data</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <p style="text-align:right;margin-top:10px;font-size:11px">Total: ${filtered.length} O.S.</p>
        </body></html>`);
    win.document.close();
    win.print();
}

// ==========================================
// ORDENS DE SERVIÇO (com filtros completos)
// ==========================================

function renderOrders() {
    const term = (document.getElementById('search-order')?.value || '').toLowerCase();
    const startDate = document.getElementById('filter-start')?.value || '';
    const endDate = document.getElementById('filter-end')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || 'all';

    let filtered = db.orders.filter(o => {
        const matchesTerm = !term || o.client.toLowerCase().includes(term) ||
            o.device.toLowerCase().includes(term) || o.id.includes(term) ||
            (o.brand || '').toLowerCase().includes(term);
        const matchesDate = (!startDate || o.date >= startDate) && (!endDate || o.date <= endDate);
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesTerm && matchesDate && matchesStatus;
    });
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const el = id => document.getElementById(id);
    if (el('filter-active')) el('filter-active').textContent = db.orders.filter(o => o.status === 'analyzing').length;
    if (el('filter-waiting')) el('filter-waiting').textContent = db.orders.filter(o => o.status === 'waiting_parts').length;
    if (el('filter-ready')) el('filter-ready').textContent = db.orders.filter(o => o.status === 'ready').length;
    if (el('filter-total')) el('filter-total').textContent = db.orders.length;

    const tbody = document.getElementById('orders-table-body');
    const emptyMsg = document.getElementById('empty-msg');

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        emptyMsg?.classList.remove('hidden');
        lucide.createIcons();
        return;
    }
    emptyMsg?.classList.add('hidden');

    tbody.innerHTML = filtered.map(order => {
        const status = statusColors[order.status] || statusColors.received;
        return `
            <tr class="hover:bg-gray-50 group border-b border-gray-100">
                <td class="px-6 py-4 font-mono text-sm text-gray-500">${order.id}</td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${order.client}</div>
                    ${order.phone ? `<div class="text-xs text-gray-400">${order.phone}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">${order.device}</div>
                    ${order.brand ? `<div class="text-xs text-gray-400">${order.brand}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}">
                        ${status.label}
                    </span>
                </td>
                <td class="px-6 py-4 text-gray-500 whitespace-nowrap">${fmtDate(order.date)}</td>
                <td class="px-6 py-4 text-right font-bold ${order.total > 0 ? 'text-green-600' : 'text-gray-500'}">
                    ${fmtMoney(order.total)}
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openOrderView('${order.id}')" 
                                class="text-gray-400 hover:text-blue-500 transition-colors"
                                title="Visualizar">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="openOrderModal(${JSON.stringify(order).replace(/"/g, '&quot;')})" 
                                class="text-gray-400 hover:text-yellow-500 transition-colors"
                                title="Editar">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteOrder('${order.id}')" 
                                class="text-gray-400 hover:text-red-500 transition-colors"
                                title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function deleteOrder(id) {
    if (confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
        db.orders = db.orders.filter(o => o.id !== id);
        save();
        renderDashboard();
        renderOrders();
        showNotification('Ordem de serviço excluída com sucesso!', 'success');
    }
}

function updateOrderStatus(status) {
    if (currentViewOrder) {
        currentViewOrder.status = status;

        // --- Automação de Fechamento de O.S (Estoque e Financeiro) ---
        if (status === 'delivered') {
            // 1. Baixa Automática de Estoque (se houver peças e não tiver sido dada baixa ainda)
            if (currentViewOrder.parts && currentViewOrder.parts.length > 0 && !currentViewOrder.partsDeducted) {
                let stockError = false;

                // Checagem prévia de disponibilidade
                for (const part of currentViewOrder.parts) {
                    const product = db.products.find(p => p.id === part.productId);
                    if (!product || product.stock < part.quantity) {
                        stockError = true;
                        showNotification(`Estoque insuficiente para a peça: ${part.name || part.productId}. A baixa automática falhou.`, 'error');
                        break;
                    }
                }

                if (!stockError) {
                    currentViewOrder.parts.forEach(part => {
                        const product = db.products.find(p => p.id === part.productId);
                        if (product) {
                            product.stock -= part.quantity;
                            db.movements.unshift({
                                id: getMovementID(),
                                productId: product.id,
                                productName: product.name,
                                type: 'out',
                                quantity: part.quantity,
                                unitValue: product.cost,
                                totalValue: part.quantity * product.cost,
                                reason: 'os_use',
                                notes: `Baixa automática O.S. #${currentViewOrder.id} - ${currentViewOrder.client}`,
                                date: new Date().toISOString().split('T')[0],
                                orderId: currentViewOrder.id
                            });
                        }
                    });
                    currentViewOrder.partsDeducted = true;
                    renderInventory();
                    renderMovements();
                    showNotification('Baixa de peças aplicada automaticamente!', 'success');
                }
            }

            // 2. Lançamento Automático no Fluxo de Caixa (se total > 0 e não foi pago)
            if (currentViewOrder.total > 0 && !currentViewOrder.paid) {
                db.transactions.unshift({
                    id: 'TR' + Date.now().toString(36).toUpperCase().substr(-6),
                    type: 'income',
                    amount: currentViewOrder.total,
                    desc: `Faturamento O.S. #${currentViewOrder.id} - ${currentViewOrder.client}`,
                    category: 'service',
                    date: new Date().toISOString().split('T')[0],
                    createdAt: new Date().toISOString()
                });
                currentViewOrder.paid = true;

                if (typeof renderTransactions === 'function') renderTransactions();
                showNotification('Faturamento lançado no Caixa automaticamente!', 'success');
            }
        }
        // ----------------------------------------------------------------

        const index = db.orders.findIndex(o => o.id === currentViewOrder.id);
        if (index !== -1) {
            db.orders[index] = currentViewOrder;
            save();

            // Atualizar visualização
            document.getElementById('view-os-status').textContent = `Status: ${statusColors[status]?.label || status}`;

            // Atualizar outras views
            renderDashboard();
            renderOrders();

            showNotification('Status atualizado com sucesso!', 'success');
        }
    }
}

function editCurrentOrder() {
    if (currentViewOrder) {
        closeModal('orderViewModal');
        openOrderModal(currentViewOrder);
    }
}

function shareOrderWhatsApp() {
    // Implementação simplificada
    if (!currentViewOrder) return;

    const message = encodeURIComponent(
        `🔧 Ordem de Serviço #${currentViewOrder.id}\n` +
        `Cliente: ${currentViewOrder.client}\n` +
        `Equipamento: ${currentViewOrder.device}\n` +
        `Status: ${statusColors[currentViewOrder.status]?.label || 'Recebido'}\n` +
        `Total: ${fmtMoney(currentViewOrder.total)}`
    );

    window.open(`https://wa.me/?text=${message}`, '_blank');
}

function updatePrintHeaders() {
    const s = db.settings;
    // Usando estilos inline mais robustos para impressão (evitando quebras de flexbox em navegadores antigos/drivers)
    const headerHTML = `
        <div class="print-header-container" style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 25px; width: 100%;">
            <h2 style="font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px;">${s.companyName || 'ASSISTÊNCIA TÉCNICA'}</h2>
            <div style="font-size: 12px; color: #666; margin-top: 8px; font-weight: 500;">
                ${s.companyDoc ? `<span style="margin: 0 10px;">CNPJ/CPF: ${s.companyDoc}</span>` : ''}
                ${s.companyPhone ? `<span style="margin: 0 10px;">TEL: ${s.companyPhone}</span>` : ''}
            </div>
            ${s.companyAddress ? `<p style="font-size: 10px; color: #999; margin: 5px 0 0 0; text-transform: uppercase;">${s.companyAddress}</p>` : ''}
        </div>
    `;

    const containers = [
        document.getElementById('invoice-print'),
        document.getElementById('report-result'),
        document.querySelector('#closingModal .p-6')
    ];

    containers.forEach(container => {
        if (!container) return;
        const existingHeader = container.querySelector('.print-header-container');
        if (existingHeader) {
            existingHeader.outerHTML = headerHTML;
        } else {
            container.insertAdjacentHTML('afterbegin', headerHTML);
        }
    });
}

// FUNÇÕES DE RELATÓRIOS COM ESTOQUE
function generateInventoryReport() {
    const reportContent = document.getElementById('report-content');

    // Calcular estatísticas de estoque
    const totalProducts = db.products.length;
    const totalValue = db.products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
    const lowStockCount = db.products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
    const outOfStockCount = db.products.filter(p => p.stock === 0).length;

    // Produtos mais valiosos (por valor total em estoque)
    const mostValuable = [...db.products]
        .sort((a, b) => (b.stock * b.cost) - (a.stock * a.cost))
        .slice(0, 5);

    // Categorias com mais produtos
    const categoryCount = {};
    db.products.forEach(p => {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    reportContent.innerHTML = `
        <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">Relatório de Estoque</h3>
            <p class="text-sm text-gray-600">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Produtos</p>
                <p class="text-2xl font-bold text-blue-700">${totalProducts}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Valor Total</p>
                <p class="text-2xl font-bold text-green-700">${fmtMoney(totalValue)}</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Baixo Estoque</p>
                <p class="text-2xl font-bold text-yellow-700">${lowStockCount}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Esgotados</p>
                <p class="text-2xl font-bold text-red-700">${outOfStockCount}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="bg-white p-4 rounded-xl border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-3">Produtos Mais Valiosos</h4>
                ${mostValuable.length > 0 ? mostValuable.map(p => `
                    <div class="flex justify-between items-center mb-2 p-2 hover:bg-gray-50 rounded">
                        <div>
                            <p class="font-medium text-gray-800">${p.name}</p>
                            <p class="text-xs text-gray-500">${p.category}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-green-600">${fmtMoney(p.stock * p.cost)}</p>
                            <p class="text-xs text-gray-500">${p.stock} unidades</p>
                        </div>
                    </div>
                `).join('') : '<p class="text-gray-400 text-center">Nenhum produto cadastrado</p>'}
            </div>

            <div class="bg-white p-4 rounded-xl border border-gray-200">
                <h4 class="font-bold text-gray-800 mb-3">Categorias com Mais Produtos</h4>
                ${topCategories.length > 0 ? topCategories.map(([category, count]) => `
                    <div class="flex justify-between items-center mb-2 p-2 hover:bg-gray-50 rounded">
                        <span class="font-medium text-gray-800">${category}</span>
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">${count}</span>
                    </div>
                `).join('') : '<p class="text-gray-400 text-center">Nenhuma categoria</p>'}
            </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-gray-200 mb-6">
            <h4 class="font-bold text-gray-800 mb-3">Produtos com Estoque Baixo/Crítico</h4>
            ${lowStockCount + outOfStockCount > 0 ?
            db.products.filter(p => p.stock <= p.minStock).map(p => `
                    <div class="flex justify-between items-center mb-2 p-2 ${p.stock === 0 ? 'bg-red-50' : 'bg-yellow-50'} rounded">
                        <div>
                            <p class="font-medium text-gray-800">${p.name}</p>
                            <p class="text-xs text-gray-500">${p.category}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold ${p.stock === 0 ? 'text-red-600' : 'text-yellow-600'}">${p.stock} unidades</p>
                            <p class="text-xs text-gray-500">Mínimo: ${p.minStock}</p>
                        </div>
                    </div>
                `).join('') :
            '<p class="text-gray-400 text-center">Todos os produtos estão com estoque adequado</p>'
        }
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="printReport()"
                class="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2">
                <i data-lucide="printer" class="w-4 h-4"></i> Imprimir Relatório
            </button>
            <button onclick="exportInventoryCSV()"
                class="bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex justify-center items-center gap-2">
                <i data-lucide="download" class="w-4 h-4"></i> Exportar CSV
            </button>
        </div>
    `;

    document.getElementById('report-result').classList.remove('hide');
    lucide.createIcons();
}

function exportInventoryCSV() {
    const headers = ['Código', 'Nome', 'Categoria', 'Estoque', 'Mínimo', 'Custo', 'Venda', 'Fornecedor'];
    const rows = db.products.map(p => {
        return [
            p.code,
            `"${p.name}"`,
            p.category,
            p.stock,
            p.minStock,
            p.cost.toFixed(2).replace('.', ','),
            p.price.toFixed(2).replace('.', ','),
            p.supplier || ''
        ];
    });

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

// FUNÇÕES UTILITÁRIAS
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'}`;

    const icons = {
        success: 'check-circle',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    notification.innerHTML = `
        <div class="flex items-center">
            <i data-lucide="${icons[type]}" class="w-5 h-5 mr-2"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);
    lucide.createIcons();

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateDataStatus() {
    console.log(`Dados atualizados: ${db.orders.length} O.S., ${db.clients.length} clientes, ${db.products.length} produtos, ${db.movements.length} movimentações`);
}

// OUTRAS FUNÇÕES DO SISTEMA ORIGINAL (simplificadas)
function clearFilters() {
    // Implementação simplificada
    const firstDay = new Date();
    firstDay.setDate(1);
    const firstDayStr = firstDay.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const elements = [
        { id: 'search-order', value: '' },
        { id: 'filter-status', value: 'all' },
        { id: 'filter-start', value: firstDayStr },
        { id: 'filter-end', value: today }
    ];

    elements.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });

    renderOrders();
}

// RELÓGIO AO VIVO
function startClock() {
    function update() {
        const now = new Date();
        const date = now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const el = document.getElementById('header-datetime');
        if (el) el.textContent = `${date} • ${time}`;
    }
    update();
    setInterval(update, 1000);
}

// INICIALIZAR APLICATIVO
document.addEventListener('DOMContentLoaded', () => {
    init();
    startClock();
    // Iniciar no dashboard
    router('dashboard');
});