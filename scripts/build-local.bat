@echo off
echo ========================================
echo ContaVe Pro - Build Local Windows
echo ========================================
echo.

echo [DEBUG] Iniciando script...
echo [DEBUG] Directorio actual: %CD%

REM Verificar Node.js
echo [DEBUG] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo Descargue desde: https://nodejs.org
    pause
    exit /b 1
)

echo [DEBUG] Node.js OK, obteniendo versión...
for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js encontrado: %NODE_VERSION%

REM Verificar npm
echo [DEBUG] Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no disponible
    pause
    exit /b 1
)

echo [DEBUG] npm OK, obteniendo versión...
for /f %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%

echo.
echo [DEBUG] Limpiando builds anteriores...
if exist "dist" (
    echo   - Eliminando carpeta dist...
    rmdir /s /q dist
)
if exist "release" (
    echo   - Eliminando carpeta release...
    rmdir /s /q release
)
echo ✅ Limpieza completada

echo.
echo [DEBUG] Verificando package.json...
if not exist "package.json" (
    echo ❌ ERROR: package.json no encontrado
    pause
    exit /b 1
)
echo ✅ package.json encontrado

echo.
echo [DEBUG] Verificando dependencias...
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la instalación
        pause
        exit /b 1
    )
) else (
    echo 📦 node_modules existe, actualizando...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló la actualización
        pause
        exit /b 1
    )
)
echo ✅ Dependencias verificadas

echo.
echo [DEBUG] Construyendo frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló el build de Vite
    pause
    exit /b 1
)
echo ✅ Build de Vite completado

echo.
echo [DEBUG] Verificando build...
if not exist "dist\index.html" (
    echo ❌ ERROR: dist\index.html no fue generado
    pause
    exit /b 1
)
echo ✅ Frontend build verificado

echo.
echo [DEBUG] Preparando módulos nativos...
call npx @electron/rebuild --force
if %errorlevel% neq 0 (
    echo ⚠️ WARNING: Rebuild falló, continuando...
)
echo ✅ Módulos nativos preparados

echo.
echo [DEBUG] Construyendo aplicación Electron...
call npx electron-builder --win --x64 --publish=never
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló Electron Builder
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ BUILD COMPLETADO EXITOSAMENTE!
echo ========================================
echo.

if exist "release\*.exe" (
    echo 📁 Instalador generado en release/
    dir release\*.exe
    echo.
    echo ¿Abrir carpeta release? (S/N)
    choice /c SN /n /m ""
    if %errorlevel% equ 1 (
        start explorer "release"
    )
) else (
    echo ❌ No se encontró instalador .exe
    if exist "release" (
        echo Contenido de release:
        dir release
    )
)

echo.
echo 🏁 Build completado
pause