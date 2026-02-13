(function () {
    const API_URL = 'https://sistemasgestao.com.br/api/api_licenca_ml.php';
    const licenseKey = localStorage.getItem('ml_license_key');
    const licenseEmail = localStorage.getItem('ml_license_email');

    // Validação básica LOCAL (primeira barreira)
    if (!licenseKey || !licenseEmail) {
        window.location.href = 'index.html';
        return;
    }

    // Validação via API (segunda barreira)
    fetch(`${API_URL}?action=validate_access`, {
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

})();
