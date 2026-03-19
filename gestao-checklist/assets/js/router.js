
// ==========================================
// MÓDULO ROUTES: Gerenciamento da SPA
// ==========================================

function router(view) {
    // Esconder todas as views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hide'));

    // Remover classe active de todos os nav items
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-white/10', 'text-white');
        el.classList.add('text-slate-400');
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
        navElement.classList.add('bg-white/10', 'text-white');
        navElement.classList.remove('text-slate-400');
    }

    // Atualizar título da página
    const titles = {
        dashboard: 'Dashboard',
        'my-checklists': 'Meus Checklists',
        templates: 'Templates',
        categories: 'Categorias',
        reports: 'Relatórios',
        settings: 'Configurações',
        instructions: 'Manual de Uso',
        about: 'Informações Legais'
    };

    document.getElementById('page-title').innerText = titles[view] || 'GESTÃO CHECKLIST';

    // Fechar sidebar ao navegar (qualquer dispositivo)
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Renderizar dados específicos da view
    if (view === 'my-checklists') {
        if (typeof renderChecklists === 'function') renderChecklists();
    } else if (view === 'templates') {
        if (typeof renderTemplates === 'function') renderTemplates();
    } else if (view === 'categories') {
        if (typeof renderCategories === 'function') renderCategories();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');

    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Expor globalmente para os botões do HTML
window.router = router;
window.toggleSidebar = toggleSidebar;
window.scrollToSection = scrollToSection;
