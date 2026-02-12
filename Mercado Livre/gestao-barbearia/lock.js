(function () {
    const licenseKey = localStorage.getItem('ml_license_key');
    const licenseEmail = localStorage.getItem('ml_license_email');

    // Validação básica LOCAL (primeira barreira)
    if (!licenseKey || !licenseEmail) {
        window.location.href = 'index.html';
        return;
    }

    // Validação via API (segunda barreira - opcional para performance, mas vital para segurança)
    // Para PWAs Offline-First, podemos confiar no localStorage após a primeira validação online
    // mas o ideal é revalidar periodicamente.

    // O PDF sugere logs. Vamos registrar o acesso se possível.
    /*
    fetch('../api_licenca_ml.php?action=validate_access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            license_key: licenseKey,
            email: licenseEmail,
            app_id: 'gestao-barbearia'
        })
    }).then(r => r.json()).then(data => {
        if (!data.valid) {
            alert(data.message);
            window.location.href = 'index.html';
        }
    }).catch(e => {
        // Se offline, permite acesso se já tiver salvo
        console.log('Modo Offline: Validado por cache local.');
    });
    */

})();
