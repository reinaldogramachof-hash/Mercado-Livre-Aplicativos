// ============================================================
// app.js — Bootloader e Event Listeners Globais
// Gestão Sorveteria & Açaí Pro
// ============================================================

// --- LICENCIAMENTO ---
const LICENSE_DATA = {
    active: false,
    businessName: "",
    ownerName: "",
    ownerDoc: ""
};

// --- VALIDAÇÃO DE DOCUMENTOS (CPF/CNPJ) ---
(function () {
    const validateDoc = (val) => {
        if (!val) return true;
        const str = val.replace(/\D/g, '');

        if (str.length === 11) {
            if (/^(\d)\1+$/.test(str)) return false;
            let sum = 0, remainder;
            for (let i = 1; i <= 9; i++) sum += parseInt(str.substring(i - 1, i)) * (11 - i);
            remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            if (remainder !== parseInt(str.substring(9, 10))) return false;
            sum = 0;
            for (let i = 1; i <= 10; i++) sum += parseInt(str.substring(i - 1, i)) * (12 - i);
            remainder = (sum * 10) % 11;
            if (remainder === 10 || remainder === 11) remainder = 0;
            if (remainder !== parseInt(str.substring(10, 11))) return false;
            return true;
        }

        if (str.length === 14) {
            if (/^(\d)\1+$/.test(str)) return false;
            let size = str.length - 2;
            let numbers = str.substring(0, size);
            const digits = str.substring(size);
            let sum = 0, pos = size - 7;
            for (let i = size; i >= 1; i--) {
                sum += numbers.charAt(size - i) * pos--;
                if (pos < 2) pos = 9;
            }
            let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
            if (result != digits.charAt(0)) return false;
            size = size + 1;
            numbers = str.substring(0, size);
            sum = 0; pos = size - 7;
            for (let i = size; i >= 1; i--) {
                sum += numbers.charAt(size - i) * pos--;
                if (pos < 2) pos = 9;
            }
            result = sum % 11 < 2 ? 0 : 11 - sum % 11;
            if (result != digits.charAt(1)) return false;
            return true;
        }
        return false;
    };

    window.Security = { check: validateDoc };
})();

// --- TERMOS DE USO ---
function confirmTerms() {
    if (!confirm('Tem certeza que leu e concorda com todos os termos apresentados?')) return;
    db.settings.termsAccepted = true;
    db.settings.termsAcceptedAt = new Date().toISOString();
    save();
    if (typeof updateTermsVisuals === 'function') updateTermsVisuals();
    alert('Obrigado! Seu aceite foi registrado com sucesso.');
}

// --- UTILITÁRIO DE MODAL ---
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

// --- PWA INSTALL PROMPT ---
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.createElement('button');
    btn.className = 'fixed bottom-4 right-4 bg-brand-primary text-white px-4 py-2 rounded-lg shadow-lg z-40 flex items-center gap-2';
    btn.innerHTML = '<i data-lucide="download" class="w-4 h-4"></i>Instalar App';
    btn.onclick = () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; btn.remove(); });
    };
    document.body.appendChild(btn);
    if (window.lucide) lucide.createIcons();
});

// --- DETECÇÃO DE IFRAME ---
if (window.self !== window.top) {
    document.body.classList.add('in-iframe');
}

// --- ATIVAÇÃO DE LICENÇA V12.1 ---
window.activateLicense = async function (e) {
    if (e) e.preventDefault();

    const keyInput = document.getElementById('license-key');
    const emailInput = document.getElementById('license-email');
    const btn = document.getElementById('btn-activate');

    if (!keyInput || !emailInput) return;

    const key = keyInput.value.trim();
    const email = emailInput.value.trim();

    if (!key || !email) { alert('Por favor, preencha todos os campos.'); return; }

    // Master Keys (Testes / Admin)
    const MASTER_KEYS = [
        String.fromCharCode(77,65,83,84,69,82,49,50,51),
        String.fromCharCode(65,68,77,73,78,95,77,76),
        String.fromCharCode(84,69,83,84,69,50,48,50,54)
    ];

    if (MASTER_KEYS.includes(key.toUpperCase())) {
        localStorage.setItem('ml_license', key);
        localStorage.setItem('ml_license_email', email);
        localStorage.setItem('ml_master_mode', 'true');
        localStorage.setItem('ml_receipt_confirmed', 'true');
        if (btn) btn.innerText = 'Acesso Liberado...';
        setTimeout(() => { alert('Modo Admin/Teste ativado!'); window.location.reload(); }, 500);
        return;
    }

    // Fluxo padrão via API
    if (btn) { btn.innerText = 'Verificando...'; btn.disabled = true; }

    try {
        const output = document.getElementById('activation-error');
        if (output) output.classList.add('hidden');

        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
            localStorage.setItem('device_id', deviceId);
        }

        const response = await fetch('../api_licenca_ml.php?action=activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: key, email, device_id: deviceId })
        });

        const data = await response.json();

        if (data.status === 'success') {
            localStorage.setItem('ml_license', key);
            localStorage.setItem('ml_license_email', email);
            localStorage.removeItem('ml_master_mode');

            if (!localStorage.getItem('ml_receipt_confirmed')) {
                const loginView = document.getElementById('view-login');
                if (loginView) { loginView.classList.add('hide'); loginView.style.display = 'none'; }
                const receiptModal = document.getElementById('welcome-receipt-modal');
                if (receiptModal) receiptModal.classList.remove('hidden');
                if (window.lucide) lucide.createIcons();
            } else {
                alert('Licença Ativada com Sucesso!');
                window.location.reload();
            }
        } else {
            if (data.status === 'expired') {
                const waMsg = encodeURIComponent('Ola! Meu periodo de teste expirou e gostaria de adquirir a versao vitalicia do sistema. Pode me ajudar?');
                const waLink = 'https://wa.me/5512992191018?text=' + waMsg;
                const output = document.getElementById('activation-error');
                if (output) {
                    output.innerHTML = `<div style="text-align:center;padding:10px 0">
                        <p style="font-weight:bold;color:#dc2626;margin-bottom:6px">Período de teste encerrado!</p>
                        <p style="font-size:13px;color:#475569;margin-bottom:12px">Para liberar a versão vitalícia com todos os seus dados, entre em contato:</p>
                        <a href="${waLink}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#16a34a;color:white;font-weight:bold;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">Quero a Versão Vitalícia</a>
                    </div>`;
                    output.classList.remove('hidden');
                } else {
                    window.open(waLink, '_blank');
                }
            } else {
                const msg = data.message || 'Chave inválida ou erro no servidor.';
                const output = document.getElementById('activation-error');
                if (output) { output.textContent = msg; output.classList.remove('hidden'); }
                else alert('Erro: ' + msg);
            }
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com o servidor de validação.');
    } finally {
        if (btn) { btn.innerText = 'Ativar Licença'; btn.disabled = false; }
    }
};

// --- CONFIRMAÇÃO DE RECIBO (ML COMPRA GARANTIDA) ---
window.confirmReceipt = async function () {
    const btn = document.getElementById('btn-confirm-receipt');
    if (btn) { btn.innerText = 'Registrando...'; btn.disabled = true; }

    const key = localStorage.getItem('ml_license');
    const email = localStorage.getItem('ml_license_email') || '';

    try {
        const response = await fetch('../api_licenca_ml.php?action=confirm_receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ license_key: key, email, legal_agree: true })
        });

        const data = await response.json();

        if (data.status === 'success') {
            localStorage.setItem('ml_receipt_confirmed', 'true');
            const modal = document.getElementById('welcome-receipt-modal');
            if (modal) modal.classList.add('hidden');
            alert('Recebimento Confirmado! Bem-vindo ao sistema.');
            window.location.reload();
        } else {
            alert('Atenção: Não foi possível registrar o recibo.\nErro: ' + (data.message || 'Falha de comunicação.'));
            if (btn) { btn.disabled = false; btn.innerText = 'Tentar Novamente'; }
        }
    } catch (e) {
        alert('Erro de conexão. Tente novamente.');
        if (btn) { btn.disabled = false; btn.innerText = 'Confirmar Recebimento e Acesso'; }
    }
};

// --- INICIALIZAÇÃO DO APLICATIVO ---
function init() {
    if (window.lucide) lucide.createIcons();
    restoreSidebarState();

    const today = new Date().toISOString().split('T')[0];
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.textContent = fmtDate(today);
    if (typeof updateTime === 'function') updateTime();

    // Inicializar produtos padrão se vazio
    if (db.products.length === 0 && db.defaultProducts) {
        db.products = [...db.defaultProducts];
        save();
    }

    // Renderizar estado inicial
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof startFreezerReminder === 'function') startFreezerReminder();
    if (typeof renderFreezerLog === 'function') renderFreezerLog();
    if (typeof updateDataStatus === 'function') updateDataStatus();
    if (typeof updateTutorialProgress === 'function') updateTutorialProgress();
    if (typeof loadChecklistState === 'function') loadChecklistState();
    if (typeof updateTermsVisuals === 'function') updateTermsVisuals();

    // Intervalos de atualização
    setInterval(save, 30000);
    if (typeof updateTime === 'function') setInterval(updateTime, 60000);

}


// --- SIDEBAR COLLAPSE (DESKTOP) ---
function toggleSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
    localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
}

// Restaurar estado do colapso ao iniciar
function restoreSidebarState() {
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('sidebar-collapsed');
    }
}

document.addEventListener('DOMContentLoaded', init);
