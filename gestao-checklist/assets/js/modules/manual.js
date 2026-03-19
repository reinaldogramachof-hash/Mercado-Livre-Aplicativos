
// ==========================================
// MÓDULO: MANUAL INTERATIVO
// ==========================================

function markSectionComplete(sectionId) {
    let completed = JSON.parse(localStorage.getItem('gestao_checklist_manual_completed') || '[]');
    if (!completed.includes(sectionId)) {
        completed.push(sectionId);
        localStorage.setItem('gestao_checklist_manual_completed', JSON.stringify(completed));
        showNotification('Etapa concluída!', 'success');
    }
    updateTutorialProgress();
}

function updateTutorialProgress() {
    const sections = ['instalacao', 'primeiro-uso', 'criacao', 'templates', 'organizacao', 'relatorios', 'produtividade'];
    const completed = JSON.parse(localStorage.getItem('gestao_checklist_manual_completed') || '[]');
    const total = sections.length;
    const percent = Math.round((completed.length / total) * 100);

    const progressBar = document.getElementById('tutorial-progress');
    const completedSteps = document.getElementById('completed-steps');

    if (progressBar) progressBar.style.width = percent + '%';
    if (completedSteps) completedSteps.textContent = `${completed.length}/${total} etapas`;

    sections.forEach(id => {
        const btn = document.querySelector(`[onclick="scrollToSection('${id}')"]`);
        if (btn) {
            if (completed.includes(id)) {
                btn.classList.add('bg-green-100', 'border-green-300', 'text-green-700');
                btn.classList.remove('border-gray-200');
            } else {
                btn.classList.remove('bg-green-100', 'border-green-300', 'text-green-700');
                btn.classList.add('border-gray-200');
            }
        }
    });
}

function confirmTerms() {
    db.settings.termsAccepted = true;
    db.settings.termsAcceptedAt = new Date().toISOString();
    save();

    const badge = document.getElementById('terms-accepted-badge');
    const icon = document.getElementById('terms-icon');
    const title = document.getElementById('terms-title');
    const desc = document.getElementById('terms-desc');
    const button = document.getElementById('btn-confirm-terms');
    const date = document.getElementById('terms-date');

    if (badge && icon && title && desc && button && date) {
        icon.className = 'w-12 h-12 text-green-500 mb-3';
        icon.setAttribute('data-lucide', 'check-circle');
        title.textContent = 'Termos Aceitos!';
        desc.textContent = 'Obrigado por confirmar os termos. Seu sistema está pronto para uso completo.';
        button.classList.add('hidden');
        badge.classList.remove('hidden');
        date.textContent = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        lucide.createIcons();
    }

    showNotification('Termos aceitos com sucesso!', 'success');
}

// Expor globalmente
window.markSectionComplete = markSectionComplete;
window.updateTutorialProgress = updateTutorialProgress;
window.confirmTerms = confirmTerms;
