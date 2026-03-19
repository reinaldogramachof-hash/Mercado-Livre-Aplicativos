
// ==========================================
// MÓDULO PRINCIPAL DE INICIALIZAÇÃO E BOOTLOADER
// ==========================================

// Dados da Licença (state somente leitura)
const LICENSE_DATA = Object.freeze({
    active: false,
    businessName: "",
    ownerName: "",
    ownerDoc: ""
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}"
               class="w-5 h-5 mr-2"></i>
            <span>${sanitizeHTML(message)}</span>
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

function init() {
    lucide.createIcons();

    // Configurar datas padrão
    const today = new Date().toISOString().split('T')[0];
    const clDeadline = document.getElementById('cl-deadline');
    const repStart = document.getElementById('rep-start');
    const repEnd = document.getElementById('rep-end');
    if (clDeadline) clDeadline.value = today;
    if (repStart) repStart.value = today;
    if (repEnd) repEnd.value = today;

    // Preencher selects de categoria
    populateCategorySelects();

    // Renderizar dados iniciais
    updateDashboardStats();
    renderRecentChecklists();
    renderCategories();
    renderTemplates();

    // Verificar licença
    if (typeof LICENSE_DATA !== 'undefined' && LICENSE_DATA.active) {
        if (typeof setupLicenseFeatures === 'function') setupLicenseFeatures();
    }

    // Configurar periodicidade para salvar (30s)
    setInterval(save, 30000);
}

function unlockApp() {
    const loginView = document.getElementById('view-login');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('main');

    if (loginView) loginView.style.display = 'none';
    if (sidebar) sidebar.style.display = '';
    if (mainContent) mainContent.style.display = '';

    init();
    router('dashboard');
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar se lock.js liberou acesso (checkAirlock)
    if (typeof checkAirlock === 'function') {
        checkAirlock().then(isValid => {
            if (isValid) {
                init();
                router('dashboard');
            }
        });
    } else {
        // Inicialização direta (sem lock.js ativo)
        init();
        router('dashboard');
    }

    // 2. Atualizar progresso do tutorial
    if (typeof updateTutorialProgress === 'function') {
        updateTutorialProgress();
    }
});

// PWA — Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado!', reg))
            .catch(err => console.log('Falha ao registrar SW', err));
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
    }
});

async function installPWA() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Usuário escolheu: ${outcome}`);
    deferredPrompt = null;
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) installBtn.classList.add('hidden');
}

// Expor globalmente
window.showNotification = showNotification;
window.init = init;
window.unlockApp = unlockApp;
window.installPWA = installPWA;
