// ============================================================
// MÓDULO DE NOTIFICAÇÕES — Gestão Barbearia Pro v4.2
// Busca notificações em sistemasdegestao.tech/api_notificacoes.php
// ============================================================

const NOTIF_API_URL   = 'https://sistemasdegestao.tech/api_notificacoes.php';
const NOTIF_TARGET    = 'barbearia';
const NOTIF_READ_KEY  = 'ml_notif_read_barber';
const NOTIF_CACHE_KEY = 'ml_notif_cache_barber';
const NOTIF_MAX       = 10;

let _notifData = []; // lista processada e filtrada

// ── Inicialização ─────────────────────────────────────────
function initNotifications() {
    fetchNotifications();
}

// ── Fetch com cache de 30 min ─────────────────────────────
async function fetchNotifications() {
    const cached = (() => { try { return JSON.parse(localStorage.getItem(NOTIF_CACHE_KEY)); } catch { return null; } })();
    const now = Date.now();

    // Usar cache se fresco (< 30 min)
    if (cached && (now - cached.fetchedAt) < 30 * 60 * 1000) {
        processNotifications(cached.data);
        return;
    }

    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        const res   = await fetch(`${NOTIF_API_URL}?target=${NOTIF_TARGET}`, { signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        localStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify({ data, fetchedAt: now }));
        processNotifications(data);
    } catch (e) {
        // Offline ou erro → usar cache antigo silenciosamente
        if (cached) processNotifications(cached.data);
    }
}

// ── Filtragem, ordenação e limite ─────────────────────────
function processNotifications(rawList) {
    const now = new Date();
    _notifData = (rawList || [])
        .filter(n => {
            const targets    = n.targets || ['all'];
            const validTarget  = targets.includes('all') || targets.includes(NOTIF_TARGET);
            const notExpired   = !n.expires || new Date(n.expires) > now;
            return validTarget && notExpired;
        })
        .sort((a, b) => new Date(b.published) - new Date(a.published))
        .slice(0, NOTIF_MAX);

    updateNotifBadge();
}

// ── Leitura / marcação ─────────────────────────────────────
function _getReadIds() {
    try { return JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || '[]'); }
    catch { return []; }
}

function markAsRead(id) {
    const read = _getReadIds();
    if (!read.includes(id)) {
        read.push(id);
        localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(read));
    }
    updateNotifBadge();
    renderNotifications();
}

function markAllAsRead() {
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(_notifData.map(n => n.id)));
    updateNotifBadge();
    renderNotifications();
}

// ── Badge ─────────────────────────────────────────────────
function updateNotifBadge() {
    const read  = _getReadIds();
    const count = _notifData.filter(n => !read.includes(n.id)).length;
    document.querySelectorAll('.notif-badge').forEach(badge => {
        badge.textContent = count > 9 ? '9+' : count;
        badge.classList.toggle('hidden', count === 0);
    });
}

// ── Render da view Notificações ───────────────────────────
function renderNotifications() {
    const container = document.getElementById('notif-list');
    if (!container) return;

    const read = _getReadIds();

    if (_notifData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 text-slate-400 dark:text-slate-500">
                <i data-lucide="bell-off" class="w-12 h-12 mx-auto mb-3 opacity-40"></i>
                <p class="font-medium text-sm">Nenhuma notificação disponível</p>
                <p class="text-xs mt-1">Novidades, atualizações e avisos aparecerão aqui</p>
            </div>`;
        lucide.createIcons();
        return;
    }

    const typeMap = {
        update:   { icon: 'rocket',       color: 'blue',  label: 'Atualização' },
        security: { icon: 'shield-alert', color: 'red',   label: 'Segurança'   },
        backup:   { icon: 'hard-drive',   color: 'amber', label: 'Backup'      },
        info:     { icon: 'info',         color: 'slate', label: 'Informativo' },
        promo:    { icon: 'tag',          color: 'green', label: 'Novidade'    },
    };

    container.innerHTML = _notifData.map(n => {
        const isRead = read.includes(n.id);
        const tc     = typeMap[n.type] || typeMap.info;
        const date   = new Date(n.published).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
        const pulse  = !isRead ? '<span class="w-2 h-2 rounded-full bg-brand-blue animate-pulse inline-block ml-1 align-middle"></span>' : '';

        return `
        <div class="bg-white dark:bg-slate-800 rounded-xl border ${isRead ? 'border-slate-100 dark:border-white/5 opacity-60' : 'border-brand-blue/30 dark:border-brand-blue/20'} p-5 transition-all">
            <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 flex-1 min-w-0">
                    <div class="w-10 h-10 rounded-full bg-${tc.color}-100 dark:bg-${tc.color}-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <i data-lucide="${tc.icon}" class="w-5 h-5 text-${tc.color}-600 dark:text-${tc.color}-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2 mb-1.5">
                            <span class="text-[10px] font-bold bg-${tc.color}-100 dark:bg-${tc.color}-900/30 text-${tc.color}-700 dark:text-${tc.color}-400 px-2 py-0.5 rounded-full uppercase tracking-wide">${tc.label}</span>
                            ${pulse}
                            <span class="text-[10px] text-slate-400 dark:text-slate-500">${date}</span>
                            ${n.version ? `<span class="text-[10px] font-bold text-slate-400 dark:text-slate-500">v${n.version}</span>` : ''}
                        </div>
                        <h4 class="font-bold text-slate-800 dark:text-white text-sm mb-1">${n.title}</h4>
                        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${n.body}</p>
                        ${n.details ? `<p class="text-xs text-slate-500 dark:text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100 dark:border-white/5">${n.details}</p>` : ''}
                    </div>
                </div>
                <div class="shrink-0 text-right">
                    ${!isRead
                        ? `<button onclick="markAsRead('${n.id}')" class="text-xs text-brand-blue hover:text-brand-dark font-medium whitespace-nowrap">Marcar lida</button>`
                        : `<span class="text-[10px] text-slate-300 dark:text-slate-600">Lida</span>`
                    }
                </div>
            </div>
        </div>`;
    }).join('');

    lucide.createIcons();
}
