// ============================================================
// dashboard.js — Gerenciamento do Painel de Controle
// Gestão Sorveteria & Açaí Pro
// ============================================================

function renderDashboard() {
    const today = new Date().toISOString().split('T')[0];

    // Produção do dia
    const todayProduction = db.production
        .filter(p => p.date === today)
        .reduce((sum, p) => sum + p.quantity, 0);

    // Vendas do dia
    const todaySales = db.sales.filter(s => s.date === today);
    const todaySalesValue = todaySales.reduce((sum, s) => sum + s.total, 0);

    // Vendas do mês
    const currentMonth = today.slice(0, 7);
    const monthSales = db.sales.filter(s => s.date.startsWith(currentMonth));
    const monthSalesValue = monthSales.reduce((sum, s) => sum + s.total, 0);

    // Produtos com baixo estoque
    const lowStockCount = db.products.filter(p => p.stock <= p.minStock && p.stock > 0).length;

    // Atualizar cards
    const elDailyProd = document.getElementById('daily-production');
    const elMonthSales = document.getElementById('month-sales');
    const elTodaySales = document.getElementById('today-sales');
    const elLowStock = document.getElementById('low-stock-alert');

    if (elDailyProd) elDailyProd.textContent = `${todayProduction.toFixed(1)} L`;
    if (elMonthSales) elMonthSales.textContent = fmtMoney(monthSalesValue);
    if (elTodaySales) elTodaySales.textContent = fmtMoney(todaySalesValue);
    if (elLowStock) elLowStock.textContent = lowStockCount;

    // Check de Freezers — verificações de hoje
    const todayChecks = (db.temperatures || []).filter(t => (t.timestamp || t.date || '').startsWith(today));
    const checkedFreezerIds = [...new Set(todayChecks.map(t => t.freezerId))];
    const totalFreezers = db.freezers.length;
    const checkedCount = checkedFreezerIds.filter(id => db.freezers.find(f => f.id === id)).length;

    const elFreezerCount = document.getElementById('freezer-check-count');
    const elFreezerText = document.getElementById('freezer-check-text');
    const elFreezerLast = document.getElementById('freezer-last-check');

    if (elFreezerCount) elFreezerCount.textContent = `${checkedCount}/${totalFreezers}`;
    if (elFreezerText) {
        elFreezerText.textContent = checkedCount === totalFreezers
            ? 'todos verificados hoje ✓'
            : `verificado${checkedCount !== 1 ? 's' : ''} hoje`;
        elFreezerCount.className = elFreezerCount.className.replace(/text-\w+-\d+/, checkedCount === 0 ? 'text-red-500' : checkedCount < totalFreezers ? 'text-amber-500' : 'text-teal-500');
    }
    if (elFreezerLast && todayChecks.length > 0) {
        const lastCheck = todayChecks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        const freezer = db.freezers.find(f => f.id === lastCheck.freezerId);
        elFreezerLast.textContent = `Última: ${new Date(lastCheck.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • ${freezer ? freezer.name : 'Freezer'}`;
    }

    // Alerta de temperatura dinâmico
    const tempAlert = document.getElementById('temp-alert-dash');
    const tempAlertMsg = document.getElementById('temp-alert-message');
    const criticalFreezer = db.freezers.find(f => f.status === 'critico');
    if (tempAlert) tempAlert.classList.toggle('hidden', !criticalFreezer);
    if (tempAlertMsg && criticalFreezer) {
        tempAlertMsg.textContent = `${criticalFreezer.name} está em temperatura crítica. Verifique imediatamente!`;
    }

    // Atualizar gráfico de sabores
    renderFlavorSalesChart();

    // Atualizar sabores mais vendidos
    renderTopFlavors();

    // Atualizar vendas recentes
    renderRecentSales();

    // Atualizar ordens de produção
    renderProductionOrders();

    // Atualizar meta de produção
    updateProductionGoal(todayProduction);
}

function renderFlavorSalesChart() {
    const chartArea = document.getElementById('flavor-sales-chart');
    if (!chartArea) return;

    // Agrupar vendas por sabor (últimos 7 dias)
    const flavorSales = {};
    const last7Days = [];
    const today = new Date();

    // Gerar últimos 7 dias
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }

    // Inicializar estrutura
    last7Days.forEach(date => {
        flavorSales[date] = { sorvete: 0, acai: 0 };
    });

    // Contar vendas
    db.sales.forEach(sale => {
        if (last7Days.includes(sale.date)) {
            sale.items.forEach(item => {
                const product = db.products.find(p => p.id === item.productId);
                if (product) {
                    if (product.category === 'sorvete') {
                        flavorSales[sale.date].sorvete += item.quantity;
                    } else if (product.category === 'acai') {
                        flavorSales[sale.date].acai += item.quantity;
                    }
                }
            });
        }
    });

    // Calcular máximo para escala
    const maxSales = Math.max(...Object.values(flavorSales).flatMap(v => [v.sorvete, v.acai]), 10);

    let chartHTML = '';
    last7Days.forEach(date => {
        const dayData = flavorSales[date];
        const dayLabel = new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' });

        const sorveteHeight = (dayData.sorvete / maxSales) * 100;
        const acaiHeight = (dayData.acai / maxSales) * 100;

        chartHTML += `
            <div class="bar-group">
                <div class="bar-wrapper">
                    <div class="bar bg-teal-600" 
                         style="height:${sorveteHeight}%"
                         data-value="${dayData.sorvete} vendas"></div>
                    <div class="bar bg-teal-400" 
                         style="height:${acaiHeight}%"
                         data-value="${dayData.acai} vendas"></div>
                </div>
                <div class="x-label">${dayLabel}</div>
            </div>
        `;
    });

    chartArea.innerHTML = chartHTML || '<p class="text-gray-400 text-sm">Sem dados para exibir</p>';
}

function renderTopFlavors() {
    const container = document.getElementById('top-flavors');
    if (!container) return;

    // Contar vendas por sabor
    const flavorCount = {};
    db.sales.forEach(sale => {
        sale.items.forEach(item => {
            const product = db.products.find(p => p.id === item.productId);
            if (product && product.flavor) {
                if (!flavorCount[product.flavor]) {
                    flavorCount[product.flavor] = 0;
                }
                flavorCount[product.flavor] += item.quantity;
            }
        });
    });

    const topFlavors = Object.entries(flavorCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (topFlavors.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center">Sem vendas registradas</p>';
        return;
    }

    const maxCount = topFlavors[0][1];

    container.innerHTML = topFlavors.map(([flavor, count]) => `
        <div class="space-y-1">
            <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">${flavor}</span>
                <span class="text-sm font-bold text-teal-600">${count} vendas</span>
            </div>
            <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-teal-600 to-teal-500 h-full transition-all duration-500" 
                     style="width: ${(count / maxCount) * 100}%"></div>
            </div>
        </div>
    `).join('');
}

function renderRecentSales() {
    const container = document.getElementById('recent-sales-list');
    const noSalesMsg = document.getElementById('no-sales-today');
    if (!container || !noSalesMsg) return;

    const today = new Date().toISOString().split('T')[0];

    const todaySales = db.sales
        .filter(s => s.date === today)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

    if (todaySales.length === 0) {
        container.innerHTML = '';
        noSalesMsg.classList.remove('hidden');
        return;
    }

    noSalesMsg.classList.add('hidden');
    container.innerHTML = todaySales.map(sale => {
        const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        return `
            <div class="flex items-center justify-between p-4 hover:bg-gray-50">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                        <i data-lucide="ice-cream" class="w-5 h-5 text-teal-600"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-800">Venda #${sale.id.slice(-6)}</p>
                        <p class="text-xs text-gray-500">${itemCount} itens • ${sale.paymentMethod}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold text-gray-800">${fmtMoney(sale.total)}</p>
                    <p class="text-xs text-gray-500">${new Date(sale.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

function renderProductionOrders() {
    const container = document.getElementById('production-orders');
    const noProductionMsg = document.getElementById('no-production');
    if (!container || !noProductionMsg) return;

    const today = new Date().toISOString().split('T')[0];

    const todayProduction = db.production
        .filter(p => p.date === today)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

    if (todayProduction.length === 0) {
        container.innerHTML = '';
        noProductionMsg.classList.remove('hidden');
        return;
    }

    noProductionMsg.classList.add('hidden');

    const getStatusColor = (status) => {
        switch (status) {
            case 'produzindo': return 'bg-blue-100 text-blue-600';
            case 'pronto': return 'bg-green-100 text-green-600';
            default: return 'bg-yellow-100 text-yellow-600';
        }
    };

    container.innerHTML = todayProduction.map(order => `
        <div class="flex items-center justify-between p-4 hover:bg-gray-50">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full ${getStatusColor(order.status)} flex items-center justify-center mr-3">
                    <i data-lucide="factory" class="w-5 h-5"></i>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-800">${order.flavor} - ${order.quantity} ${order.unit}</p>
                    <p class="text-xs text-gray-500">${order.type} • Início: ${new Date(order.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
            <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}">
                ${order.status}
            </span>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function updateProductionGoal(todayProduction) {
    const goal = db.settings.dailyProductionGoal || 50;
    const percentage = Math.min((todayProduction / goal) * 100, 100);

    const elGoal = document.getElementById('production-goal');
    const elToday = document.getElementById('production-today');
    const elBar = document.getElementById('production-bar');
    const elText = document.getElementById('production-text');

    if (elGoal) elGoal.textContent = `${goal} L`;
    if (elToday) elToday.textContent = `${todayProduction.toFixed(1)} L`;
    if (elBar) elBar.style.width = `${percentage}%`;
    if (elText) elText.textContent = `${percentage.toFixed(1)}% da meta diária`;
}

function updateTime() {
    const elTime = document.getElementById('current-time');
    if (elTime) {
        elTime.textContent = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// ============================================================
// VERIFICAÇÃO HUMANA DE FREEZERS
// ============================================================

function renderFreezerLog() {
    const container = document.getElementById('freezer-log-list');
    const summary = document.getElementById('freezer-log-summary');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();
    // Compatível com registros que têm só timestamp (sem campo date)
    const todayLogs = (db.temperatures || []).filter(t => {
        const ts = t.timestamp || t.date || '';
        return ts.startsWith(today);
    });

    // Última verificação por freezer
    const lastByFreezer = {};
    todayLogs.forEach(t => {
        if (!lastByFreezer[t.freezerId] || new Date(t.timestamp) > new Date(lastByFreezer[t.freezerId].timestamp)) {
            lastByFreezer[t.freezerId] = t;
        }
    });

    // Resumo no header do card
    const checkedCount = Object.keys(lastByFreezer).length;
    const total = db.freezers.length;
    if (summary) {
        summary.textContent = checkedCount === 0
            ? 'Nenhum registro hoje'
            : `${checkedCount}/${total} verificados hoje`;
    }

    // Renderizar uma linha por freezer
    container.innerHTML = db.freezers.map(freezer => {
        const log = lastByFreezer[freezer.id];
        const hoursAgo = log ? Math.floor((now - new Date(log.timestamp)) / 3600000) : null;
        const minutesAgo = log ? Math.floor((now - new Date(log.timestamp)) / 60000) % 60 : null;

        // Status por tempo desde o último check
        let statusIcon, statusClass, statusText;
        if (!log) {
            statusIcon = 'clock';
            statusClass = 'bg-red-100 text-red-500';
            statusText = 'Pendente';
        } else if (hoursAgo < 2) {
            statusIcon = 'check-circle';
            statusClass = 'bg-green-100 text-green-600';
            statusText = hoursAgo === 0 ? `${minutesAgo}min atrás` : `${hoursAgo}h atrás`;
        } else if (hoursAgo < 4) {
            statusIcon = 'alert-circle';
            statusClass = 'bg-amber-100 text-amber-600';
            statusText = `${hoursAgo}h atrás`;
        } else {
            statusIcon = 'alert-triangle';
            statusClass = 'bg-red-100 text-red-500';
            statusText = `+${hoursAgo}h sem check`;
        }

        const lastTempText = log
            ? `${log.temperature}°C às ${new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : '—';

        return `
            <div class="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-700 truncate">${freezer.name}</p>
                    <p class="text-xs text-gray-400">${lastTempText}</p>
                </div>
                <div class="flex items-center gap-2">
                    <input type="number" step="0.1" placeholder="${freezer.idealTemp}"
                        id="temp-input-${freezer.id}"
                        class="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400">
                    <button onclick="logFreezerTemp('${freezer.id}')"
                        class="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-bold hover:bg-teal-600 active:scale-95 transition-all">
                        ✓
                    </button>
                </div>
                <div class="w-8 h-8 rounded-full ${statusClass} flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${statusIcon}" class="w-4 h-4"></i>
                </div>
            </div>
            <p class="text-[10px] text-right pr-4 pb-2 -mt-1 ${log ? 'text-gray-300' : 'text-red-300'}">${statusText}</p>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function logFreezerTemp(freezerId) {
    const input = document.getElementById(`temp-input-${freezerId}`);
    if (!input || input.value === '') {
        showNotification('Digite a temperatura antes de registrar.', 'error');
        return;
    }

    const temp = parseFloat(input.value);
    if (isNaN(temp) || temp > 10 || temp < -40) {
        showNotification('Temperatura inválida. Use valores entre -40°C e +10°C.', 'error');
        return;
    }

    const freezer = db.freezers.find(f => f.id === freezerId);
    const now = new Date();
    const nowISO = now.toISOString();
    const today = nowISO.split('T')[0];

    db.temperatures.push({
        id: getID(),
        freezerId: freezerId,
        temperature: temp,
        date: today,
        timestamp: nowISO,
        notes: 'Leitura manual — Dashboard'
    });

    // Atualizar status do freezer
    const critical = db.settings.criticalTemp || -12;
    if (freezer) {
        freezer.currentTemp = temp;
        freezer.status = temp > critical ? 'critico' : temp > (critical - 3) ? 'alerta' : 'normal';
    }

    save();
    input.value = '';
    showNotification(`${freezer ? freezer.name : 'Freezer'}: ${temp}°C registrado!`, 'success');
    renderFreezerLog();

    // Atualizar o check-count no card de KPIs
    const todayChecks = (db.temperatures || []).filter(t => {
        const ts = t.timestamp || t.date || '';
        return ts.startsWith(today);
    });
    const checkedCount = [...new Set(todayChecks.map(t => t.freezerId))].length;
    const elCount = document.getElementById('freezer-check-count');
    const elText = document.getElementById('freezer-check-text');
    const elLast = document.getElementById('freezer-last-check');
    if (elCount) elCount.textContent = `${checkedCount}/${db.freezers.length}`;
    if (elText) elText.textContent = checkedCount === db.freezers.length ? 'todos verificados hoje ✓' : `verificado${checkedCount !== 1 ? 's' : ''} hoje`;
    if (elLast && freezer) elLast.textContent = `Última: ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • ${freezer.name}`;

    checkFreezerReminderBanner();
}

function startFreezerReminder() {
    checkFreezerReminderBanner();
    setInterval(checkFreezerReminderBanner, 60 * 60 * 1000); // a cada 1 hora
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) checkFreezerReminderBanner();
    });
}

function checkFreezerReminderBanner() {
    const banner = document.getElementById('freezer-reminder-banner');
    if (!banner) return;

    const dismissed = parseInt(localStorage.getItem('freezer_reminder_dismissed') || '0');
    const now = Date.now();
    const oneHour = 3600000;

    // Última verificação de qualquer freezer (compatível com e sem campo date)
    const lastLog = (db.temperatures || [])
        .map(t => new Date(t.timestamp || 0).getTime())
        .sort((a, b) => b - a)[0] || 0;

    const minutesSinceLast = Math.floor((now - lastLog) / 60000);
    const hoursSinceLast = Math.floor(minutesSinceLast / 60);

    const shouldShow = (now - lastLog) > oneHour && (now - dismissed) > oneHour;

    banner.classList.toggle('hidden', !shouldShow);

    if (shouldShow) {
        const reminderText = document.getElementById('freezer-reminder-text');
        if (reminderText) {
            reminderText.textContent = lastLog === 0
                ? 'Nenhuma verificação registrada hoje. Registre agora!'
                : `Última verificação há ${hoursSinceLast}h${minutesSinceLast % 60 > 0 ? ` ${minutesSinceLast % 60}min` : ''}. Registre agora.`;
        }
    }
}

function dismissFreezerReminder() {
    localStorage.setItem('freezer_reminder_dismissed', Date.now().toString());
    const banner = document.getElementById('freezer-reminder-banner');
    if (banner) banner.classList.add('hidden');
}

function scrollToFreezerLog() {
    const card = document.getElementById('freezer-log-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
