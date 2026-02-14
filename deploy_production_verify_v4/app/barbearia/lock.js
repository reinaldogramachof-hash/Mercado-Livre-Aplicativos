(function () {
    // SECURITY CONFIGURATION
    const API_URL = "https://sistemasgestao.com.br/api/api_licenca_ml.php";
    const APP_ID = "Plena Barbearia";

    // 1. DEVICE FINGERPRINTING (Identidade Única do Hardware)
    let deviceId = localStorage.getItem('plena_device_fingerprint');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('plena_device_fingerprint', deviceId);
    }

    // 2. CREDENTIAL CHECK
    const licenseKey = localStorage.getItem('ml_license_key');

    if (!licenseKey) {
        // Sem licença? Tchau.
        window.location.href = 'index.html';
        return;
    }

    // 3. REMOTE VALIDATION (Airlock Check)
    // Valida se este Dispositivo tem permissão para usar esta Licença
    fetch(`${API_URL}?action=validate_access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            license_key: licenseKey,
            device_fingerprint: deviceId,
            app_id: APP_ID
        })
    })
        .then(r => r.json())
        .then(data => {
            if (!data.valid) {
                // KILL SWITCH: O servidor negou o acesso (Pirata ou Dispositivo Duplicado)
                console.error("Security Violation:", data.message);
                alert("Bloqueio de Segurança: " + data.message);
                localStorage.removeItem('ml_license_key'); // Revoga a credencial local
                window.location.href = 'index.html'; // Expulsa o usuário
            } else {
                console.log("License Verified:", data.message);
            }
        })
        .catch(e => {
            // OFFLINE MODE: Se o servidor cair ou o usuário estiver sem net,
            // confiamos na licença local para não quebrar a experiência do cliente.
            console.warn("Offline Mode: Validated locally.");
        });

})();
