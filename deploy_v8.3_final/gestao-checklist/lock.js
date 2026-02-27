/**
 * Lock.js - Guardião de Segurança (Gestão Checklist)
 * Verifica se a licença está presente no localStorage.
 * Se não estiver, redireciona para a seção de login.
 * Padrão ML Factory - V11.5
 */
(function () {
    const LICENSE_KEY = 'plena_license';
    const EMAIL_KEY = 'ml_license_email';

    function isLicensed() {
        return localStorage.getItem(LICENSE_KEY) && localStorage.getItem(EMAIL_KEY);
    }

    // Expor função globalmente para verificação
    window.__checkLicense = isLicensed;

    document.addEventListener('DOMContentLoaded', function () {
        if (!isLicensed()) {
            // Esconde tudo exceto login
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');
            const overlay = document.getElementById('overlay');

            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            if (overlay) overlay.style.display = 'none';

            // Mostra tela de ativação
            const loginView = document.getElementById('view-login');
            if (loginView) {
                loginView.classList.remove('hide');
                loginView.style.display = 'flex';
            }
        }
    });
})();
