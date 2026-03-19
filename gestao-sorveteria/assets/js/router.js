// ============================================================
// router.js — Gerenciamento de Navegação SPA
// Gestão Sorveteria & Açaí Pro
// ============================================================

function router(view) {
    // Esconder todas as views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hide'));

    // Remover active de todos os nav items
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active-nav', 'bg-white/10', 'text-white');
        el.classList.add('text-gray-300');
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
        navElement.classList.add('active-nav');
        navElement.classList.remove('text-gray-300');
    }

    // Atualizar título da página
    const titles = {
        dashboard: 'Dashboard',
        cashier: 'Frente de Caixa',
        production: 'Produção',
        inventory: 'Estoque',
        products: 'Produtos',
        sales: 'Vendas',
        clients: 'Clientes',
        suppliers: 'Fornecedores',
        reports: 'Relatórios',
        temperature: 'Temperatura',
        settings: 'Configurações',
        instructions: 'Manual',
        about: 'Saiba Mais'
    };

    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        titleEl.innerText = titles[view] || 'Gestão Sorveteria';
    }

    // Fechar sidebar no mobile
    if (window.innerWidth < 1024) {
        if (typeof toggleSidebar === 'function') toggleSidebar();
    }

    // Renderizar dados específicos da view
    if (view === 'dashboard') {
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof renderFreezerLog === 'function') renderFreezerLog();
    } else if (view === 'cashier') {
        if (typeof renderCashierProducts === 'function') renderCashierProducts();
    } else if (view === 'production') {
        if (typeof renderProduction === 'function') renderProduction();
    } else if (view === 'inventory') {
        if (typeof showInventoryTab === 'function') showInventoryTab('ingredients');
    } else if (view === 'products') {
        if (typeof renderProductsCatalog === 'function') renderProductsCatalog();
    } else if (view === 'sales') {
        if (typeof renderSales === 'function') renderSales();
    } else if (view === 'clients') {
        if (typeof renderClients === 'function') renderClients();
    } else if (view === 'suppliers') {
        if (typeof renderSuppliers === 'function') renderSuppliers();
    } else if (view === 'reports') {
        if (typeof renderReports === 'function') renderReports();
    } else if (view === 'settings') {
        if (typeof renderSettings === 'function') renderSettings();
    } else if (view === 'temperature') {
        if (typeof renderTemperature === 'function') renderTemperature();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (!sidebar || !overlay) return;

    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');

    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}
