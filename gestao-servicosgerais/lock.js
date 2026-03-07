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

    window.__checkLicense = isLicensed;

    document.addEventListener('DOMContentLoaded', function () {
        const loginView = document.getElementById('view-login');
        if (!isLicensed()) {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');
            const overlay = document.getElementById('overlay');
            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
            if (loginView) {
                loginView.classList.remove('hide');
                loginView.style.display = 'flex';
            }
        } else if (!isReceiptConfirmed()) {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');
            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            if (loginView) {
                loginView.classList.add('hide');
                loginView.style.display = 'none';
            }
            const receiptModal = document.getElementById('welcome-receipt-modal');
            if (receiptModal) receiptModal.classList.remove('hidden');
        } else {
            if (loginView) {
                loginView.classList.add('hide');
                loginView.style.display = 'none';
            }
            const receiptModal = document.getElementById('welcome-receipt-modal');
            if (receiptModal) receiptModal.classList.add('hidden');
        }
    });
})();