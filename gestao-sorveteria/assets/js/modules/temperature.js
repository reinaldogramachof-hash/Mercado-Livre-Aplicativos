// ============================================================
// temperature.js — Gerenciamento de Temperatura e Freezers
// Gestão Sorveteria & Açaí Pro
// ============================================================

function renderTemperature() {
    // Renderizar cards de freezers
    const container = document.querySelector('#view-temperature .grid');
    if (!container) return;

    container.innerHTML = db.freezers.map(freezer => {
        const statusColor = freezer.status === 'normal' ? 'green' :
            freezer.status === 'alto' ? 'yellow' : 'red';
        const statusText = freezer.status === 'normal' ? 'Normal' :
            freezer.status === 'alto' ? 'Alerta' : 'Crítico';

        return `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 card-hover">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-800">${freezer.name}</h3>
                    <span class="text-xs px-2 py-1 rounded-full bg-${statusColor}-100 text-${statusColor}-600">
                        ${statusText}
                    </span>
                </div>
                <div class="text-center mb-4">
                    ${(() => {
                        const last = db.temperatures.filter(t => t.freezerId === freezer.id).sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))[0];
                        return last
                            ? `<div class="text-4xl font-bold text-teal-600">${last.temperature}°C</div><p class="text-sm text-gray-500">Ideal: ${freezer.idealTemp}°C</p>`
                            : `<div class="text-4xl font-bold text-gray-300">--°C</div><p class="text-sm text-gray-400">Nenhum registro. Registre a temperatura.</p>`;
                    })()}
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Status:</span>
                        <span class="font-medium">${freezer.status}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Última leitura:</span>
                        <span class="font-medium">${(() => {
                            const last = db.temperatures.filter(t => t.freezerId === freezer.id).sort((a,b) => new Date(b.timestamp)-new Date(a.timestamp))[0];
                            return last ? new Date(last.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : 'Sem registro';
                        })()}</span>
                    </div>
                </div>
                <button onclick="openTemperatureModal('${freezer.id}')" class="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-medium">
                    Registrar Temperatura
                </button>
            </div>
        `;
    }).join('');

    // Renderizar histórico
    renderTemperatureLog();

    // Renderizar gráfico
    renderTemperatureChart();
}

function renderTemperatureChart() {
    const chartArea = document.getElementById('temperature-chart');
    if (!chartArea) return;

    // Pegar últimas 24 horas
    const now = new Date();
    const hours = [];
    for (let i = 23; i >= 0; i--) {
        const hour = new Date(now);
        hour.setHours(now.getHours() - i);
        hours.push(hour.toISOString().slice(0, 13)); // YYYY-MM-DDTHH
    }

    // Agrupar temperaturas por hora
    const hourlyTemps = {};
    hours.forEach(hour => {
        const readings = db.temperatures.filter(t => t.timestamp.startsWith(hour));
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
        const hourLabel = new Date(hour).getHours().toString().padStart(2, '0') + 'h';
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
