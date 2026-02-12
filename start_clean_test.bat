@ECHO OFF
CLS
cd /d "%~dp0"
ECHO ==========================================================
ECHO   AMBIENTE CLEAN ROOM - MERCADO LIVRE
ECHO   Diretorio: %CD%
ECHO   PHP Version:
php -v
ECHO ==========================================================
ECHO.
ECHO [1] Iniciando Roteador em localhost:8085...
ECHO.

ECHO.
ECHO Iniciando navegador...
start "" "http://127.0.0.1:8085/Mercado Livre/plena-barbearia/app.html"

ECHO Servidor PHP rodando em http://127.0.0.1:8085 ...
ECHO (Nao feche esta janela)
ECHO.
php -S 127.0.0.1:8085 -t . "dev_tools/router_nocache.php"

IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO [ERRO] O servidor PHP falhou ao iniciar.
    ECHO Verifique se o PHP esta nas variaveis de ambiente.
)

PAUSE
