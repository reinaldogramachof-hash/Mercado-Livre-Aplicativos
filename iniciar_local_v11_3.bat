@echo off
title Servidor de Testes V11.3 - SISTEMAS DE GESTÃO
echo ========================================================
echo   INICIALIZANDO AMBIENTE DE TESTES LOCAL (PHP + ROUTER)
echo ========================================================
echo.
echo [INFO] Abrindo servidor em http://localhost:8000
echo [INFO] O Router (dev_router.php) esta ativo para evitar cache.
echo [Aviso] Mantenha esta janela aberta enquanto testa.
echo.
timeout /t 2 > nul
start http://localhost:8000/gestao-barbearia/index.html
php -S localhost:8000 dev_router.php
pause
