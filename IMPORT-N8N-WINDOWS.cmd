@echo off
setlocal
cd /d "%~dp0"

if not exist "docker\.env" (
  echo docker\.env n'existe pas. Lancez d'abord START-WINDOWS.cmd.
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop n'est pas demarre.
  pause
  exit /b 1
)

docker compose --env-file docker\.env -f docker\compose.full.yml exec -T n8n n8n import:workflow --input=/workflows/item-matching.json
if errorlevel 1 (
  echo L'import du workflow a echoue. Verifiez que le conteneur n8n est demarre.
  pause
  exit /b 1
)

docker compose --env-file docker\.env -f docker\compose.full.yml restart n8n

set "N8N_ORIGIN=http://localhost:5678"
for /f "tokens=1,* delims==" %%A in ('findstr /B "N8N_ORIGIN=" docker\.env') do set "N8N_ORIGIN=%%B"

echo.
echo Workflow importe avec succes.
echo Ouvrez %N8N_ORIGIN%/ puis publiez le workflow :
echo Lost ^& Found - Automatic item matching
echo.
pause
