@echo off
setlocal
cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
  echo Docker n'est pas installe ou n'est pas disponible dans le PATH.
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop n'est pas demarre. Lancez-le, attendez que le moteur soit pret, puis reessayez.
  pause
  exit /b 1
)

if not exist "docker\.env" (
  where node >nul 2>&1
  if errorlevel 1 (
    echo Node.js est necessaire pour la premiere configuration locale.
    pause
    exit /b 1
  )
  node scripts\setup-local.mjs
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js est necessaire pour completer la configuration n8n.
  pause
  exit /b 1
)

node scripts\setup-automation.mjs
if errorlevel 1 (
  pause
  exit /b 1
)

docker compose --env-file docker\.env -f docker\compose.full.yml up --build -d
if errorlevel 1 (
  echo Le projet n'a pas pu demarrer. Consultez les messages Docker ci-dessus.
  pause
  exit /b 1
)

set "APP_ORIGIN=http://localhost:8080"
for /f "tokens=1,* delims==" %%A in ('findstr /B "APP_ORIGIN=" docker\.env') do set "APP_ORIGIN=%%B"
set "N8N_ORIGIN=http://localhost:5678"
for /f "tokens=1,* delims==" %%A in ('findstr /B "N8N_ORIGIN=" docker\.env') do set "N8N_ORIGIN=%%B"

echo.
echo Lost ^& Found Tunisia est pret : %APP_ORIGIN%
echo Documentation API : %APP_ORIGIN%/api/docs
echo Automatisation n8n : %N8N_ORIGIN%/
echo Etat du service : %APP_ORIGIN%/health
echo Identifiants administrateur : docker\.env
echo.
pause
