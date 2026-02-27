/**
 * Lock.js - Guardião de Segurança (Gestão Obras)
 * Padrão ML Factory - V11.5
 */
(function () {
    const LICENSE_KEY = 'plena_license';
    const EMAIL_KEY = 'ml_license_email';

    function isLicensed() {
        return localStorage.getItem(LICENSE_KEY) && localStorage.getItem(EMAIL_KEY);
    }

    window.__checkLicense = isLicensed;

    document.addEventListener('DOMContentLoaded', function () {
        if (!isLicensed()) {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');
            const overlay = document.getElementById('overlay');

            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            if (overlay) overlay.style.display = 'none';

            const loginView = document.getElementById('view-login');
            if (loginView) {
                loginView.classList.remove('hide');
                loginView.style.display = 'flex';
            }
        }
    });
})();
