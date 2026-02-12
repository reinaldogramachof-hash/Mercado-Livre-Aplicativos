@echo off
echo ========================================================
echo   INICIANDO SISTEMA MERCADO LIVRE FACTORY (PHP 8.3)
echo ========================================================
echo.
echo 1. Verificando ambiente PHP...
php -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] PHP nao encontrado no PATH. Por favor instale o PHP.
    pause
    exit
)

echo 2. Iniciando Servidor Local em http://localhost:8000 ...
echo    (Nao feche esta janela preta enquanto usar o sistema)
echo.

start http://localhost:8000/Mercado%%20Livre/gestao-barbearia/index.html

php -S localhost:8000
pause
