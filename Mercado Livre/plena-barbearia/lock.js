(function () {
    const token = localStorage.getItem('plena_license_token');
    const type = localStorage.getItem('plena_license_type');

    // Se não tiver token ou não for do tipo vitalicio_ml, volta para o launcher
    if (!token || type !== 'vitalicio_ml') {
        window.location.href = 'index.html';
    }
})();
