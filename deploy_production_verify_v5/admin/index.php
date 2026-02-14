<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plena Admin - Controle de Licenças</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        .glass {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
        }

        .fade-in {
            animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }
    </style>
</head>

<body class="bg-slate-100 min-h-screen text-slate-800 font-sans">

    <!-- LOGIN MODAL -->
    <div id="login-modal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i data-lucide="shield-check" class="w-8 h-8 text-blue-600"></i>
            </div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Acesso Restrito</h2>
            <p class="text-slate-500 text-sm mb-6">Painel Administrativo Plena</p>

            <form onsubmit="doLogin(event)" class="space-y-4">
                <input type="password" id="admin-pass" placeholder="Senha de Admin"
                    class="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-center">
                <button type="submit"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-200">
                    Entrar
                </button>
            </form>
            <p id="login-msg" class="text-red-500 text-xs mt-4 min-h-[1.5em]"></p>
        </div>
    </div>

    <!-- NEW LICENSE MODAL -->
    <div id="new-license-modal"
        class="hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center relative">
            <button onclick="closeNewLicenseModal()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <h2 class="text-2xl font-bold text-slate-800 mb-6">Nova Licença</h2>
            <div class="space-y-4 text-left">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cliente</label>
                    <input type="text" id="new-client"
                        class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail (Opcional)</label>
                    <input type="email" id="new-email"
                        class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Produto</label>
                    <select id="new-product"
                        class="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Gestão Barbearia">Gestão Barbearia</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>
                <button onclick="createLicense()"
                    class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-green-200 mt-4">
                    Confirmar Geração
                </button>
            </div>
        </div>
    </div>

    <!-- MAIN APP -->
    <div id="app-container" class="hidden flex flex-col min-h-screen">
        <!-- Sidebar/Nav -->
        <nav class="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
            <div class="flex items-center gap-3">
                <div class="bg-blue-600 text-white p-2 rounded-lg">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                </div>
                <h1 class="font-bold text-xl tracking-tight">Plena Admin</h1>
            </div>
            <div class="flex items-center gap-6">
                <div class="hidden md:flex gap-1 text-sm font-medium text-slate-500">
                    <button onclick="switchTab('dashboard')"
                        class="px-3 py-2 rounded-lg hover:bg-slate-50 text-blue-600 bg-blue-50 nav-btn"
                        data-tab="dashboard">Dashboard</button>
                    <button onclick="switchTab('licenses')" class="px-3 py-2 rounded-lg hover:bg-slate-50 nav-btn"
                        data-tab="licenses">Licenças</button>
                    <button onclick="switchTab('receipts')" class="px-3 py-2 rounded-lg hover:bg-slate-50 nav-btn"
                        data-tab="receipts">Recibos Digitais</button>
                    <button onclick="switchTab('logs')" class="px-3 py-2 rounded-lg hover:bg-slate-50 nav-btn"
                        data-tab="logs">Logs do Sistema</button>
                </div>
                <button onclick="logout()" class="text-slate-400 hover:text-red-500 transition-colors">
                    <i data-lucide="log-out" class="w-5 h-5"></i>
                </button>
            </div>
        </nav>

        <!-- Content -->
        <main class="flex-1 p-6 max-w-7xl mx-auto w-full">

            <!-- DASHBOARD TAB -->
            <div id="tab-dashboard" class="tab-content fade-in">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <!-- Stats Cards -->
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-xs font-bold text-slate-400 uppercase">Receita Total</p>
                        <h3 class="text-3xl font-bold text-slate-800 mt-2" id="stat-revenue">R$ 0,00</h3>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-xs font-bold text-slate-400 uppercase">Vendas Mês (MRR)</p>
                        <h3 class="text-3xl font-bold text-green-600 mt-2" id="stat-mrr">R$ 0,00</h3>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-xs font-bold text-slate-400 uppercase">Licenças Ativas</p>
                        <h3 class="text-3xl font-bold text-blue-600 mt-2" id="stat-active">0</h3>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <p class="text-xs font-bold text-slate-400 uppercase">Dispositivos Únicos</p>
                        <h3 class="text-3xl font-bold text-purple-600 mt-2" id="stat-devices">0</h3>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 class="font-bold text-lg mb-4">Top Produtos</h3>
                    <div id="top-products-list" class="space-y-3">
                        <!-- Dynamic -->
                    </div>
                </div>
            </div>

            <!-- LICENSES TAB -->
            <div id="tab-licenses" class="tab-content hidden fade-in">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Gerenciar Licenças</h2>
                    <div class="flex gap-2">
                        <input type="text" id="search-lic" placeholder="Buscar cliente ou chave..."
                            class="border rounded-lg px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none">
                        <button onclick="loadLicenses()"
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        </button>
                        <button onclick="openNewLicenseModal()"
                            class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 ml-2">
                            <i data-lucide="plus"></i> Nova
                        </button>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th class="px-6 py-4">Data</th>
                                    <th class="px-6 py-4">Cliente</th>
                                    <th class="px-6 py-4">Produto</th>
                                    <th class="px-6 py-4">Licença</th>
                                    <th class="px-6 py-4">Status</th>
                                    <th class="px-6 py-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="licenses-table" class="divide-y divide-slate-100">
                                <!-- Dynamic -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- RECEIPTS TAB -->
            <div id="tab-receipts" class="tab-content hidden fade-in">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold">Recibos Digitais (Auditoria)</h2>
                        <p class="text-slate-500 text-sm">Provas de entrega e aceite de termos.</p>
                    </div>
                    <button onclick="loadReceipts()"
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i> Atualizar
                    </button>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th class="px-6 py-4">Data/Hora</th>
                                    <th class="px-6 py-4">IP</th>
                                    <th class="px-6 py-4">Cliente (Licença)</th>
                                    <th class="px-6 py-4">Declaração</th>
                                </tr>
                            </thead>
                            <tbody id="receipts-table" class="divide-y divide-slate-100">
                                <!-- Dynamic -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- LOGS TAB -->
            <div id="tab-logs" class="tab-content hidden fade-in">
                <div class="bg-slate-900 text-green-400 font-mono text-xs p-6 rounded-2xl shadow-lg h-[80vh] overflow-y-auto"
                    id="logs-container">
                    Carregando logs do sistema...
                </div>
            </div>

        </main>
    </div>

    <script>
        const API_URL = '../api/api_licenca_ml.php';
        let AUTH_SECRET = '';

        // INIT
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            const savedSecret = sessionStorage.getItem('admin_secret');
            if (savedSecret) {
                AUTH_SECRET = savedSecret;
                checkAuth();
            }
        });

        async function doLogin(e) {
            e.preventDefault();
            const pass = document.getElementById('admin-pass').value;
            const msg = document.getElementById('login-msg');

            if (!pass) return;

            AUTH_SECRET = pass; // Store temporarily
            const success = await loadDashboard(); // Try to load dashboard to validate

            if (success) {
                sessionStorage.setItem('admin_secret', pass);
                document.getElementById('login-modal').classList.add('hidden');
                document.getElementById('app-container').classList.remove('hidden');
                msg.textContent = '';
            } else {
                msg.textContent = 'Senha incorreta ou erro de conexão.';
                AUTH_SECRET = '';
            }
        }

        async function checkAuth() {
            const success = await loadDashboard();
            if (success) {
                document.getElementById('login-modal').classList.add('hidden');
                document.getElementById('app-container').classList.remove('hidden');
            } else {
                sessionStorage.removeItem('admin_secret');
            }
        }

        function logout() {
            sessionStorage.removeItem('admin_secret');
            location.reload();
        }

        async function apiCall(action, params = {}) {
            try {
                const url = new URL(API_URL, window.location.href);
                url.searchParams.append('action', action);

                // Add secret to URL for simple GETs if needed, or stick to headers logic in PHP checkAuth
                // PHP checkAuth checks: $server['HTTP_X_ADMIN_SECRET'] ?? $data['secret'] ?? $get['secret']
                // We'll use Headers for cleanliness

                const response = await fetch(url, {
                    method: 'POST', // Always POST for body params
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Secret': AUTH_SECRET
                    },
                    body: JSON.stringify(params)
                });

                if (response.status === 403) return null;
                return await response.json();
            } catch (e) {
                console.error(e);
                return null;
            }
        }

        // TABS LOGIC
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById('tab-' + tabId).classList.remove('hidden');

            document.querySelectorAll('.nav-btn').forEach(btn => {
                if (btn.dataset.tab === tabId) {
                    btn.classList.add('text-blue-600', 'bg-blue-50');
                } else {
                    btn.classList.remove('text-blue-600', 'bg-blue-50');
                }
            });

            if (tabId === 'dashboard') loadDashboard();
            if (tabId === 'licenses') loadLicenses();
            if (tabId === 'receipts') loadReceipts();
            if (tabId === 'logs') loadLogs();
        }

        // DATA LOADING
        async function loadDashboard() {
            const data = await apiCall('dashboard_stats');
            if (!data) return false;

            document.getElementById('stat-revenue').innerText = fmtMoney(data.total_revenue);
            document.getElementById('stat-mrr').innerText = fmtMoney(data.monthly_revenue);
            document.getElementById('stat-active').innerText = data.active_subscriptions;
            document.getElementById('stat-devices').innerText = data.active_devices_count;

            const topProd = document.getElementById('top-products-list');
            topProd.innerHTML = Object.entries(data.top_products || {}).map(([name, count]) => `
                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span class="font-medium">${name}</span>
                    <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">${count} ativos</span>
                </div>
            `).join('');

            return true;
        }

        async function loadLicenses() {
            const list = await apiCall('list');
            if (!list) return;

            const term = document.getElementById('search-lic').value.toLowerCase();
            const filtered = list.filter(l =>
                (l.client && l.client.toLowerCase().includes(term)) ||
                (l.key && l.key.toLowerCase().includes(term))
            );

            const tbody = document.getElementById('licenses-table');
            tbody.innerHTML = filtered.map(l => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-mono text-xs text-slate-500">${l.created_at?.substring(0, 10)}</td>
                    <td class="px-6 py-4 font-medium text-slate-900">${l.client || 'N/A'}</td>
                    <td class="px-6 py-4 text-slate-600">${l.product || 'N/A'}</td>
                    <td class="px-6 py-4 font-mono text-xs text-slate-500">${l.key.substring(0, 18)}...</td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 rounded-full text-xs font-bold ${l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${l.status}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <button onclick="copyToClip('${l.key}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Copiar Chave">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                        ${l.device_id ? `<button onclick="resetDevice('${l.key}')" class="text-orange-500 hover:text-orange-700" title="Resetar Dispositivo">
                            <i data-lucide="smartphone-off" class="w-4 h-4"></i>
                        </button>` : ''}
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }

        async function loadReceipts() {
            const list = await apiCall('get_receipts');
            if (!list) return;

            const tbody = document.getElementById('receipts-table');
            tbody.innerHTML = list.map(r => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-mono text-xs text-slate-500">${r.timestamp}</td>
                    <td class="px-6 py-4 font-mono text-xs">${r.ip}</td>
                    <td class="px-6 py-4">
                        <div class="text-sm font-bold text-slate-800">${r.client_email}</div>
                        <div class="text-xs font-mono text-slate-400">${r.license_key}</div>
                    </td>
                    <td class="px-6 py-4 text-xs italic text-slate-600 max-w-xs truncate" title="${r.confirmation_text}">
                        ${r.confirmation_text}
                    </td>
                </tr>
            `).join('');
        }

        async function loadLogs() {
            const res = await apiCall('read_logs');
            if (!res) return;

            const container = document.getElementById('logs-container');
            container.innerHTML = res.logs.map(l => `<div class="mb-1 border-b border-white/10 pb-1">${l.msg}</div>`).join('') || 'Nenhum log recente.';
        }

        // ACTIONS
        async function resetDevice(key) {
            if (!confirm('Tem certeza que deseja desvincular o dispositivo desta licença?')) return;
            const res = await apiCall('update_status', { key: key, status: 'reset_device' });
            if (res && res.success) {
                alert('Dispositivo desvinculado!');
                loadLicenses();
            }
        }

        function openNewLicenseModal() {
            document.getElementById('new-license-modal').classList.remove('hidden');
        }

        function closeNewLicenseModal() {
            document.getElementById('new-license-modal').classList.add('hidden');
        }

        async function createLicense() {
            const client = document.getElementById('new-client').value;
            if (!client) return alert('Informe o nome do cliente');

            const email = document.getElementById('new-email').value;
            const product = document.getElementById('new-product').value;

            // Envia para API
            const res = await apiCall('create', { client, email, product });

            if (res && res.key) {
                closeNewLicenseModal();
                loadLicenses();
                alert('Licença Criada com Sucesso!\nChave: ' + res.key);
                navigator.clipboard.writeText(res.key);
            } else {
                alert('Erro ao criar licença: ' + (res?.message || 'Erro desconhecido'));
            }
        }

        function copyToClip(text) {
            navigator.clipboard.writeText(text);
            alert('Copiado!');
        }

        function fmtMoney(val) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
        }
    </script>
</body>

</html>