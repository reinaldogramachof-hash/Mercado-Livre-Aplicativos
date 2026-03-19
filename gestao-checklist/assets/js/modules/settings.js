
// ==========================================
// MÓDULO: CONFIGURAÇÕES / BACKUP
// ==========================================

function downloadBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gestao_checklist_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function restoreBackup(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const backup = JSON.parse(e.target.result);
            db = backup;
            save();
            alert('Backup restaurado com sucesso! A página será recarregada.');
            location.reload();
        } catch (err) {
            alert('Erro ao ler arquivo. Verifique se é um backup válido.');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação é irreversível!')) {
        db.checklists = [];
        save();
        if (document.getElementById('view-my-checklists').classList.contains('hide') === false) {
            renderChecklists();
        }
        updateDashboardStats();
        showNotification('Todos os dados foram removidos!', 'success');
    }
}

function factoryReset() {
    if (confirm('ATENÇÃO: Isso resetará TODO o sistema para as configurações de fábrica. Todos os dados serão perdidos. Tem certeza?')) {
        localStorage.removeItem(DB_KEY);
        location.reload();
    }
}

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Expor globalmente
window.downloadBackup = downloadBackup;
window.restoreBackup = restoreBackup;
window.clearAllData = clearAllData;
window.factoryReset = factoryReset;
window.openModal = openModal;
window.closeModal = closeModal;
