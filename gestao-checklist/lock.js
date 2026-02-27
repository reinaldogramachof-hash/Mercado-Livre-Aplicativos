/**
 * Lock.js - Guardião de Segurança (Gestão Checklist)
 * Verifica se a licença está presente no localStorage.
 * Se não estiver, redireciona para a seção de login.
 * Padrão ML Factory - V11.5
 */
(function () {
    const LICENSE_KEY = 'plena_license';
    const EMAIL_KEY = 'ml_license_email';
    const RECEIPT_KEY = 'ml_receipt_confirmed';

    function isLicensed() {
        if (localStorage.getItem('ml_master_mode') === 'true') return true;
        return localStorage.getItem(LICENSE_KEY) && localStorage.getItem(EMAIL_KEY);
    }

    function isReceiptConfirmed() {
        if (localStorage.getItem('ml_master_mode') === 'true') return true;
        return !!localStorage.getItem(RECEIPT_KEY);
    }

    // Expor função globalmente para verificação
    window.__checkLicense = isLicensed;

    document.addEventListener('DOMContentLoaded', function () {
        const loginView = document.getElementById('view-login');

        if (!isLicensed()) {
            // Esconde tudo exceto login
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');
            const overlay = document.getElementById('overlay');

            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            if (overlay) overlay.style.display = 'none';

            // Mostra tela de ativação
            if (loginView) {
                loginView.classList.remove('hide');
                loginView.style.display = 'flex';
            }
        } else if (!isReceiptConfirmed()) {
            // Tem licença mas não tem recibo
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');

            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';

            // Oculta login também
            if (loginView) {
                loginView.classList.add('hide');
                loginView.style.display = 'none';
            }

            const receiptModal = document.getElementById('welcome-receipt-modal');
            if (receiptModal) receiptModal.classList.remove('hidden');
        } else {
            // Tem licença e tem recibo
            if (loginView) {
                loginView.classList.add('hide');
                loginView.style.display = 'none';
            }
            const receiptModal = document.getElementById('welcome-receipt-modal');
            if (receiptModal) receiptModal.classList.add('hidden');
        }
    });
})();
