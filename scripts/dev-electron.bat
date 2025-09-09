@echo off
REM ContaVe Pro - Desarrollo con Electron
REM Script para desarrollo local rápido

echo ========================================
echo ContaVe Pro - Desarrollo Electron
echo ========================================
echo.

REM Matar procesos Electron existentes
taskkill /f /im "ContaVe Pro.exe" 2>nul
taskkill /f /im "electron.exe" 2>nul

echo 🧹 Procesos Electron cerrados

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
)

echo.
echo 🚀 Iniciando modo desarrollo...
echo.
echo INSTRUCCIONES:
echo 1. Se abrirá Vite dev server en http://localhost:5173
echo 2. Se abrirá ContaVe Pro en Electron automáticamente
echo 3. Los cambios se recargan automáticamente
echo 4. Presione Ctrl+C para detener
echo.

REM Iniciar desarrollo con concurrently
call npx concurrently ^
  --kill-others ^
  --prefix-colors "blue,green" ^
  --names "VITE,ELECTRON" ^
  "npm run dev" ^
  "npx wait-on http://localhost:5173 && npx electron electron/main.js"

echo.
echo 👋 Desarrollo terminado
pause