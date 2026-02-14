@echo off
echo ===================================================
echo   SERVIDOR LOCAL DE TESTES - PLENA
echo ===================================================
echo.
echo Iniciando PHP Built-in Server...
echo Acesso Admin: http://localhost:8000/admin/
echo API Endpoint: http://localhost:8000/api/api_licenca_ml.php
echo.
echo TENTANDO ABRIR NAVEGADOR AUTOMATICAMENTE...
start http://localhost:8000/admin/
echo.
echo Para parar o servidor, feche esta janela.
echo.
cd /d %~dp0
php -S localhost:8000 router.php
pause
