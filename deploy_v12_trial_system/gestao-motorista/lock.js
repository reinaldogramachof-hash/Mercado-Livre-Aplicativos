/**
 * Lock.js - Guardião de Segurança V12.1 (Trial & Expiration Support)
 * Padrão ML Factory - Product-Led Growth System
 */
(function () {
    const LICENSE_KEY = 'plena_license';
    const EMAIL_KEY = 'ml_license_email';
    const API_URL = '../api_licenca_ml.php';

    // --- LOGIC ---

    function getLocalLicense() {
        return localStorage.getItem(LICENSE_KEY);
    }

    async function checkStatus() {
        const key = getLocalLicense();

        if (!key) {
            // Sem chave: Modo Teste Automático (Baseado na instalação)
            // Lógica unificada: Sem chave = Login/Bloqueio
            redirectToLogin("Ative sua licença para continuar.");
            return;
        }

        try {
            // Verificar na API
            const res = await fetch(API_URL + '?action=verify', {
                method: 'POST',
                body: JSON.stringify({ license_key: key })
            });
            const data = await res.json();

            if (data.status === 'success') {
                if (data.license_status === 'expired') {
                    blockSystem("Seu período de teste acabou.", "Adquira a versão vitalícia para continuar usando seus dados.");
                } else if (data.license_status === 'blocked') {
                    blockSystem("Licença Bloqueada", "Entre em contato com o suporte.");
                } else {
                    // ATIVO ou TRIAL VÁLIDO
                    unlockSystem();
                    if (data.is_trial && data.expiration_date) {
                        showTrialBanner(data.expiration_date);
                    }
                }
            } else {
                // Chave inválida ou erro
                redirectToLogin("Licença inválida ou não encontrada.");
            }

        } catch (e) {
            console.error("Erro ao verificar licença:", e);
        }
    }

    // --- UI HELPERS ---

    function redirectToLogin(msg) {
        const login = document.getElementById('view-login');
        if (login) {
            login.classList.remove('hide');
            login.style.display = 'flex';
            const msgEl = login.querySelector('p.text-slate-500');
            if (msgEl) msgEl.innerText = msg;
        }
        hideApp();
    }

    function blockSystem(titleText, msgText) {
        const login = document.getElementById('view-login');
        if (login) {
            login.classList.remove('hide');
            login.style.display = 'flex';

            const h3 = login.querySelector('h3');
            const p = login.querySelector('p.text-slate-500');
            const btn = login.querySelector("button[type='submit']");

            if (h3) h3.innerText = titleText;
            if (p) {
                p.innerHTML = `${msgText}<br><br><a href="../loja/checkout.html?product=motorista" class="text-blue-600 font-bold underline">COMPRAR VERSÃO VITALÍCIA</a>`;
            }
            if (btn) btn.innerText = "Já comprei (Ativar)";
        }
        hideApp();
    }

    function hideApp() {
        const sidebar = document.getElementById('sidebar');
        const main = document.querySelector('main');
        const header = document.querySelector('header');
        if (sidebar) sidebar.style.display = 'none';
        if (main) main.style.display = 'none';
        if (header) header.style.display = 'none';
    }

    function unlockSystem() {
        const login = document.getElementById('view-login');
        if (login) {
            login.classList.add('hide');
        }
        const sidebar = document.getElementById('sidebar');
        const main = document.querySelector('main');
        const header = document.querySelector('header');
        if (sidebar) sidebar.style.display = '';
        if (main) main.style.display = '';
        if (header) header.style.display = '';
    }

    function showTrialBanner(expDate) {
        const old = document.getElementById('trial-banner');
        if (old) old.remove();

        const exp = new Date(expDate);
        const now = new Date();
        const diffMs = exp - now;
        const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));

        if (diffHrs <= 0) return;

        const banner = document.createElement('div');
        banner.id = 'trial-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            pointer-events: none;
        `;
        banner.innerHTML = `⏳ Teste Grátis: Restam ${diffHrs}h`;
        document.body.appendChild(banner);
    }

    // INIT
    document.addEventListener('DOMContentLoaded', checkStatus);
    setInterval(checkStatus, 5 * 60 * 1000);

})();
