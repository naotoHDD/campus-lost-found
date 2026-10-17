@echo off
setlocal
cd /d "%~dp0"

if not exist "docker\.env" (
  echo docker\.env n'existe pas. Le projet local n'a pas encore ete configure.
  pause
  exit /b 1
)

docker compose --env-file docker\.env -f docker\compose.full.yml down
echo Lost ^& Found Tunisia est arrete. La base et les fichiers envoyes sont conserves.
pause
