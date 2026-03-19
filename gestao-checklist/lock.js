/**
 * Lock.js - Guardião de Segurança (Gestão Checklist)
 * Padrão ML Factory - V12.1
 * 🔓 MODO DESENVOLVIMENTO LOCAL — Acesso liberado para testes
 */
(function () {
    const LICENSE_KEY = 'plena_license';
    const EMAIL_KEY = 'ml_license_email';
    const RECEIPT_KEY = 'ml_receipt_confirmed';
    const MASTER_KEY = 'ml_master_mode';

    // Injeta flags de acesso no localStorage para liberar o sistema
    localStorage.setItem(LICENSE_KEY, 'DEV-LOCAL');
    localStorage.setItem(EMAIL_KEY, 'dev@localhost');
    localStorage.setItem(MASTER_KEY, 'true');
    localStorage.setItem(RECEIPT_KEY, 'true');

    function isLicensed() { return true; }
    function isReceiptConfirmed() { return true; }

    window.__checkLicense = isLicensed;

    function initLock() {
        console.log('[LOCK] ✅ MODO DEV — Acesso liberado automaticamente');

        const loginView = document.getElementById('view-login');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('main');
        const overlay = document.getElementById('overlay');
        const receiptModal = document.getElementById('welcome-receipt-modal');

        if (loginView) { loginView.classList.add('hide'); loginView.style.display = 'none'; }
        if (receiptModal) receiptModal.classList.add('hidden');
        if (sidebar) sidebar.style.display = '';
        if (mainContent) mainContent.style.display = '';
        if (overlay) overlay.style.display = '';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLock);
    } else {
        initLock();
    }

    setTimeout(initLock, 100);
})();
