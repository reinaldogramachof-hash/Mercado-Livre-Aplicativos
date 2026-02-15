(function () {
    // V11.3 - STABLE LOCK (No Loop)
    const licenseKey = localStorage.getItem('plena_license');
    const licenseEmail = localStorage.getItem('ml_license_email');

    // Se NÃO temos licença, verificamos se precisamos redirecionar
    if (!licenseKey || !licenseEmail) {
        // Só redireciona se NÃO estivermos na index.html (página de ativação)
        // Isso evita o loop infinito de "index -> lock -> index"
        const isEntryPage = window.location.pathname.endsWith('index.html') ||
            window.location.pathname.endsWith('/') ||
            window.location.pathname === '';

        if (!isEntryPage) {
            console.log('Acesso negado: Redirecionando para ativação.');
            window.location.href = 'index.html';
        }
        return;
    }

    console.log('Filtro de Segurança: Licença ativa detectada.');
})();