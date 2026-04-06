// ============================================================
// temperature.js — Gerenciamento de Temperatura e Freezers
// Gestão Sorveteria & Açaí Pro
// ============================================================

function renderTemperature() {
    renderCriticalAlerts();

    const container = document.getElementById('freezer-cards-grid');
    if (!container) return;

    if (db.freezers.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400">
                <i data-lucide="thermometer-snowflake" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                <p class="font-medium">Nenhum freezer cadastrado</p>
                <p class="text-sm mt-1">Clique em "Novo Freezer" para adicionar</p>
            </div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        renderTemperatureLog();
        renderTemperatureChart();
        return;
    }

    const statusColorMap = { normal: 'green', alto: 'yellow', critico: 'red' };
    const statusLabelMap = { normal: 'Normal', alto: 'Alerta', critico: 'Crítico' };

    container.innerHTML = db.freezers.map(freezer => {
        const last = db.temperatures
            .filter(t => t.freezerId === freezer.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

        const sc = statusColorMap[freezer.status] || 'gray';
        const sl = statusLabelMap[freezer.status] || freezer.status;

        const tempDisplay = last
            ? `<div class="text-4xl font-bold text-teal-600">${last.temperature}°C</div>
               <p class="text-sm text-gray-500 mt-1">Ideal: ${freezer.idealTemp}°C</p>`
            : `<div class="text-4xl font-bold text-gray-300">--°C</div>
               <p class="text-sm text-gray-400 mt-1">Sem registro ainda</p>`;

        const lastTime = last
            ? new Date(last.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : 'Sem registro';

        return `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 card-hover">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="font-bold text-gray-800 flex-1">${sanitizeHTML(freezer.name)}</h3>
                    <div class="flex items-center gap-1 shrink-0">
                        <span class="text-xs px-2 py-1 rounded-full bg-${sc}-100 text-${sc}-700 font-medium">${sl}</span>
                        <button onclick="editFreezerModal('${freezer.id}')" class="text-gray-300 hover:text-teal-500 transition-colors p-1" title="Editar">
                            <i data-lucide="pencil" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteFreezer('${freezer.id}')" class="text-gray-300 hover:text-red-500 transition-colors p-1" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="text-center mb-4">${tempDisplay}</div>
                <div class="flex justify-between text-sm mb-4">
                    <span class="text-gray-500">Última leitura:</span>
                    <span class="font-medium text-gray-700">${lastTime}</span>
                </div>
                <button onclick="openTemperatureModal('${freezer.id}')"
                    class="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="thermometer" class="w-4 h-4"></i>
                    Registrar Temperatura
                </button>
            </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Popular select de freezer para o gráfico
    const freezerSelect = document.getElementById('temp-chart-freezer');
    if (freezerSelect) {
        freezerSelect.innerHTML = '<option value="">Todos os freezers</option>' +
            db.freezers.map(f => `<option value="${f.id}">${sanitizeHTML(f.name)}</option>`).join('');
    }

    renderTemperatureLog();
    renderTemperatureChart();
}

function renderCriticalAlerts() {
    const container = document.getElementById('critical-temp-alerts');
    if (!container) return;

    const alerts = db.freezers.filter(f => f.status === 'critico' || f.status === 'alto');
    if (alerts.length === 0) { container.innerHTML = ''; return; }

    container.innerHTML = alerts.map(f => {
        const isCrit = f.status === 'critico';
        return `
            <div class="flex items-center gap-3 p-4 mb-2 rounded-xl border ${isCrit ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}">
                <i data-lucide="alert-triangle" class="w-5 h-5 ${isCrit ? 'text-red-500' : 'text-yellow-500'} shrink-0"></i>
                <div class="flex-1">
                    <p class="text-sm font-bold ${isCrit ? 'text-red-700' : 'text-yellow-700'}">${sanitizeHTML(f.name)}</p>
                    <p class="text-xs ${isCrit ? 'text-red-500' : 'text-yellow-600'}">${isCrit ? 'Temperatura crítica' : 'Temperatura acima do ideal'} — verifique imediatamente</p>
                </div>
                <button onclick="openTemperatureModal('${f.id}')"
                    class="text-xs font-bold px-3 py-1.5 rounded-lg ${isCrit ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'}">
                    Registrar
                </button>
            </div>`;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ── CRUD Freezer ──

function addFreezerModal() {
    const modal = document.getElementById('freezerModal');
    if (!modal) return;
    document.getElementById('freezer-modal-id').value = '';
    document.getElementById('freezer-modal-name').value = '';
    document.getElementById('freezer-modal-ideal').value = '-18';
    document.getElementById('freezer-modal-title').textContent = 'Novo Freezer';
    modal.classList.remove('hidden');
}

function editFreezerModal(id) {
    const freezer = db.freezers.find(f => f.id === id);
    if (!freezer) return;
    const modal = document.getElementById('freezerModal');
    if (!modal) return;
    document.getElementById('freezer-modal-id').value = freezer.id;
    document.getElementById('freezer-modal-name').value = freezer.name;
    document.getElementById('freezer-modal-ideal').value = freezer.idealTemp;
    document.getElementById('freezer-modal-title').textContent = 'Editar Freezer';
    modal.classList.remove('hidden');
}

function saveFreezer(e) {
    if (e) e.preventDefault();
    const editId   = document.getElementById('freezer-modal-id').value.trim();
    const name     = document.getElementById('freezer-modal-name').value.trim();
    const idealTemp = parseFloat(document.getElementById('freezer-modal-ideal').value);

    if (!name) { showNotification('Informe o nome do freezer', 'error'); return; }
    if (isNaN(idealTemp)) { showNotification('Informe a temperatura ideal', 'error'); return; }

    if (editId) {
        // Modo edição
        const freezer = db.freezers.find(f => f.id === editId);
        if (freezer) { freezer.name = name; freezer.idealTemp = idealTemp; }
        save();
        closeModal('freezerModal');
        renderTemperature();
        showNotification(`${name} atualizado!`, 'success');
    } else {
        // Modo criação
        db.freezers.push({
            id: 'freezer_' + getID(),
            name,
            idealTemp,
            currentTemp: idealTemp,
            status: 'normal',
            userAdded: true
        });
        save();
        closeModal('freezerModal');
        renderTemperature();
        showNotification(`${name} adicionado com sucesso!`, 'success');
    }
}

function deleteFreezer(id) {
    const freezer = db.freezers.find(f => f.id === id);
    if (!freezer) return;
    if (confirm(`Excluir "${freezer.name}"? Os registros de temperatura deste freezer também serão removidos.`)) {
        db.freezers = db.freezers.filter(f => f.id !== id);
        db.temperatures = db.temperatures.filter(t => t.freezerId !== id);
        save();
        renderTemperature();
        showNotification('Freezer removido.', 'info');
    }
}

// ── Exportar Log CSV ──

function exportTemperatureLog() {
    if (db.temperatures.length === 0) {
        showNotification('Nenhum registro para exportar', 'warning');
        return;
    }

    const lines = ['"Data/Hora","Freezer","Temperatura (°C)","Status","Observações"'];
    db.temperatures
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .forEach(t => {
            const name = db.freezers.find(f => f.id === t.freezerId)?.name || 'Desconhecido';
            lines.push(`"${new Date(t.timestamp).toLocaleString('pt-BR')}","${name}","${t.temperature}","${t.status}","${t.notes || ''}"`);
        });

    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `temperatura_log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Log exportado com sucesso!', 'success');
}

function renderTemperatureChart() {
    const chartArea = document.getElementById('temperature-chart');
    if (!chartArea) return;

    // Verificar se há um filtro de freezer selecionado
    const freezerSelect = document.getElementById('temp-chart-freezer');
    const selectedFrozerId = freezerSelect ? freezerSelect.value : '';

    // Pegar últimas 24 horas
    const now = new Date();
    const hours = [];
    for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(now.getHours() - i);
        hours.push(hour.toISOString().slice(0, 13)); // YYYY-MM-DDTHH
    }

    // Agrupar temperaturas por hora (opcional: filtrar por freezer)
    const hourlyTemps = {};
    hours.forEach(hour => {
        let readings = db.temperatures.filter(t => t.timestamp.startsWith(hour));
        if (selectedFrozerId) {
            readings = readings.filter(t => t.freezerId === selectedFrozerId);
        }
        if (readings.length > 0) {
            hourlyTemps[hour] = readings.reduce((a, b) => a + b.temperature, 0) / readings.length;
        } else {
            hourlyTemps[hour] = null;
        }
    });

    const temps = Object.values(hourlyTemps).filter(t => t !== null);
    if (temps.length === 0) {
        chartArea.innerHTML = '<p class="text-gray-400 text-sm text-center py-8">Nenhum registro de temperatura nas últimas 24 horas.</p>';
        return;
    }
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const range = maxTemp - minTemp || 1;

    let chartHTML = '';
    hours.forEach((hour, index) => {
        const temp = hourlyTemps[hour];
        const hourLabel = hour.slice(11, 13) + 'h';
        if (temp === null) {
            chartHTML += `<div class="bar-group"><div class="bar-wrapper"></div><div class="x-label">${hourLabel}</div></div>`;
            return;
        }
        const height = ((temp - minTemp) / range) * 100;
        chartHTML += `
            <div class="bar-group">
                <div class="bar-wrapper">
                    <div class="bar bg-gradient-to-t from-teal-500 to-teal-300" 
                         style="height:${height}%"
                         data-value="${temp.toFixed(1)}°C"></div>
                </div>
                <div class="x-label">${hourLabel}</div>
            </div>
        `;
    });

    chartArea.innerHTML = chartHTML || '<p class="text-gray-400 text-sm">Sem dados de temperatura</p>';
}

function renderTemperatureLog() {
    const tbody = document.getElementById('temperature-log-body');
    if (!tbody) return;

    const recentTemps = db.temperatures
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    if (recentTemps.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-400">
                    Nenhum registro de temperatura
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = recentTemps.map(temp => {
        const freezer = db.freezers.find(f => f.id === temp.freezerId);
        const statusColor = temp.status === 'normal' ? 'text-green-600' :
            temp.status === 'alto' ? 'text-yellow-600' : 'text-red-600';
        const statusText = temp.status === 'normal' ? 'Normal' :
            temp.status === 'alto' ? 'Alerta' : 'Crítico';

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">${new Date(temp.timestamp).toLocaleString('pt-BR')}</td>
                <td class="px-6 py-4">${freezer?.name || 'Desconhecido'}</td>
                <td class="px-6 py-4 font-bold ${temp.temperature > -12 ? 'text-red-600' : 'text-gray-800'}">
                    ${temp.temperature}°C
                </td>
                <td class="px-6 py-4">
                    <span class="${statusColor}">${statusText}</span>
                </td>
                <td class="px-6 py-4 text-gray-500">Sistema</td>
            </tr>
        `;
    }).join('');
}



function openTemperatureModal(preselectedId) {
    const select = document.getElementById('temp-freezer');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione o freezer</option>' +
        db.freezers.map(f => `<option value="${f.id}" ${f.id === preselectedId ? 'selected' : ''}>${f.name}</option>`).join('');

    const modal = document.getElementById('temperatureModal');
    if (modal) modal.classList.remove('hidden');
}

function submitTemperature(e) {
    if (e) e.preventDefault();
    const freezerId = document.getElementById('temp-freezer').value;
    const temp = parseFloat(document.getElementById('temp-value').value);
    const notes = document.getElementById('temp-notes').value;

    if (!freezerId || isNaN(temp)) {
        showNotification('Preencha os campos obrigatórios!', 'error');
        return;
    }

    const freezer = db.freezers.find(f => f.id === freezerId);
    if (!freezer) return;

    freezer.currentTemp = temp;
    
    // Atualizar status
    if (temp > db.settings.criticalTemp) {
        freezer.status = 'critico';
    } else if (temp > freezer.idealTemp + 2) {
        freezer.status = 'alto';
    } else {
        freezer.status = 'normal';
    }

    db.temperatures.push({
        id: getID(),
        freezerId,
        temperature: temp,
        status: freezer.status,
        timestamp: new Date().toISOString(),
        notes: notes || 'Leitura manual'
    });

    save();
    if (typeof closeModal === 'function') closeModal('temperatureModal');
    showNotification('Temperatura registrada!', 'success');
    
    const tempView = document.getElementById('view-temperature');
    if (tempView && !tempView.classList.contains('hide')) {
        renderTemperature();
    }
}
