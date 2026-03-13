// ==========================================
// MÓDULO PRINCIPAL DE INICIALIZAÇÃO E BOOTLOADER
// ==========================================

// Inicialização e Event Listeners Universais
function init() {
    console.log("Sistema Mestre Iniciado - Padrão Ouro Modular");
    if(typeof lucide !== 'undefined') lucide.createIcons();

    const today = new Date().toISOString().split('T')[0];
    const orderDateInput = document.getElementById('order-date');
    if (orderDateInput) orderDateInput.value = today;

    const receiptDateInput = document.getElementById('receipt-date');
    if(receiptDateInput) receiptDateInput.value = today;

    // Carregar configurações da Empresa Padrão (Fallback)
    const settings = db.settings || {};
    const companyName = settings.companyName || 'Minha Assistência Técnica';
    document.querySelectorAll('.company-name-display').forEach(el => el.textContent = companyName);
    const theme = settings.theme || 'light';
    if(theme === 'dark') document.documentElement.classList.add('dark');

    // Inicializar visualizações primárias
    renderDashboard();
    renderOrders();
    renderClients();
    renderInventory();
    renderTransactions();
    if (typeof renderPDVGrid === 'function') renderPDVGrid();
    if (typeof updateCashierUI === 'function') updateCashierUI();
    
    startClock();

    // Auto-save e Backup Silencioso A cada 5 minutos
    setInterval(() => {
        save();
        if(db.settings.autoBackup) {
            console.log('Autosave concluído silenciosamente.');
        }
    }, 5 * 60 * 1000);

    // Setup Event Listeners globais (Buscas e Filtros)
    setupEventListeners();
}

function setupEventListeners() {
    const el = document.getElementById.bind(document);

    // Ordens
    if(el('order-search')) el('order-search').addEventListener('input', renderOrders);
    if(el('order-status-filter')) el('order-status-filter').addEventListener('change', renderOrders);
    if(el('order-date-filter')) el('order-date-filter').addEventListener('change', renderOrders);
    
    // Configurações do Produto O.S
    if(el('part-select')) el('part-select').addEventListener('change', function() { updatePartPrice(this); });
    if(el('part-qty')) el('part-qty').addEventListener('input', calcPartTotal);
    if(el('part-price')) el('part-price').addEventListener('input', calcPartTotal);
    
    // Clientes
    if(el('client-search')) el('client-search').addEventListener('input', renderClients);
    
    // Estoque
    if(el('inventory-search')) el('inventory-search').addEventListener('input', renderInventory);
    
    // PDV / Frente de Caixa
    if(el('pdv-search')) el('pdv-search').addEventListener('input', renderPDVGrid);
    if(el('pdv-amount-received')) el('pdv-amount-received').addEventListener('input', calculateChange);
    
    // Transações
    if(el('transaction-search')) el('transaction-search').addEventListener('input', renderTransactions);
    if(el('transaction-month')) el('transaction-month').addEventListener('change', renderTransactions);
    
    // Modal clicks outside (fechar clicando no fundo escuro)
    window.addEventListener('click', function(e) {
        if(e.target.classList.contains('fixed') && !e.target.classList.contains('modal-content')) {
             if(e.target.id && e.target.id.endsWith('-modal')) {
                  e.target.classList.add('hidden');
             }
        }
    });
}

// Inicializa a SPA quando The Document Content for Loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega o Banco de Dados primeiro
    loadDB();
    
    // 2. Inicializa Variáveis Globais de Componentes
    if(typeof currentOSParts !== 'undefined') currentOSParts = [];
    if(typeof currentOSId !== 'undefined') currentOSId = null;
    if(typeof cart !== 'undefined') cart = [];
    if(typeof pdvPayments !== 'undefined') pdvPayments = [{ method: 'money', amount: 0 }];

    // 3. Verifica licença de Airlock e Inicia
    if(typeof checkAirlock === 'function') {
        checkAirlock().then(isValid => {
            if(isValid) {
                init();
                router('dashboard'); // Start View
            }
        });
    } else {
        init();
        router('dashboard');
    }
});
