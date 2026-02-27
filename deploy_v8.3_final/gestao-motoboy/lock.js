/**
 * Lock.js - Guardião de Segurança (Gestão Motoboy - Trial Version)
 * Padrão ML Factory - V12.0 (Product-Led Growth)
 */
(function () {
    const LICENSE_KEY = 'plena_license';
    const EMAIL_KEY = 'ml_license_email';
    const INSTALL_KEY = 'app_install_date';
    const TRIAL_DURATION_HOURS = 72;
    const TRIAL_DURATION_MS = TRIAL_DURATION_HOURS * 60 * 60 * 1000;

    // 1. Inicializa Data de Instalação se não existir
    if (!localStorage.getItem(INSTALL_KEY)) {
        localStorage.setItem(INSTALL_KEY, Date.now().toString());
    }

    function isLicensed() {
        return localStorage.getItem(LICENSE_KEY) && localStorage.getItem(EMAIL_KEY);
    }

    function getTrialStatus() {
        const installDate = parseInt(localStorage.getItem(INSTALL_KEY) || '0');
        const now = Date.now();
        const timeDiff = now - installDate;
        const timeRemaining = TRIAL_DURATION_MS - timeDiff;

        return {
            expired: timeRemaining <= 0,
            remainingMs: timeRemaining,
            remainingHours: Math.ceil(timeRemaining / (1000 * 60 * 60))
        };
    }

    function createTrialBanner(hoursLeft) {
        const banner = document.createElement('div');
        banner.id = 'trial-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(249, 115, 22, 0.95); /* Orange for Motoboy */
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            pointer-events: none;
        `;
        banner.innerHTML = `
            <span>⏱️ Teste Grátis: Restam ${hoursLeft}h</span>
        `;
        document.body.appendChild(banner);
    }

    function updateLockScreen(expired) {
        const title = document.querySelector('#view-login h3');
        const desc = document.querySelector('#view-login p.text-slate-500');

        if (expired) {
            if (title) title.innerText = "Período de Teste Expirado";
            if (desc) desc.innerText = "Seus dados estão salvos. Ative para continuar.";
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (isLicensed()) {
            return; // Licenciado
        }

        const trial = getTrialStatus();

        if (trial.expired) {
            // Bloqueio Total
            console.log('Trial Expirado');
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('main');
            const overlay = document.getElementById('overlay');
            const header = document.querySelector('header');

            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) mainContent.style.display = 'none';
            if (header) header.style.display = 'none';
            if (overlay) overlay.style.display = 'none';

            const loginView = document.getElementById('view-login');
            if (loginView) {
                loginView.classList.remove('hide');
                loginView.style.display = 'flex';
                updateLockScreen(true);
            }
        } else {
            // Trial Ativo
            console.log(`Trial Ativo: ${trial.remainingHours}h restantes`);
            createTrialBanner(trial.remainingHours);

            const loginView = document.getElementById('view-login');
            if (loginView) {
                loginView.classList.add('hide');
            }
        }
    });

    window.__checkStatus = () => {
        return isLicensed() ? 'licensed' : (getTrialStatus().expired ? 'expired' : 'trial');
    };

})();
