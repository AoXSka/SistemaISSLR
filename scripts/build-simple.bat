@echo off
echo ========================================
echo ContaVe Pro - Build Simple
echo ========================================
echo.

echo 🚀 Iniciando build...

REM Limpiar carpetas anteriores
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"

echo 🧹 Carpetas limpiadas

REM Build del frontend
echo 📱 Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build de Vite falló
    pause
    exit /b 1
)

echo ✅ Frontend build OK

REM Verificar que dist existe
if not exist "dist\index.html" (
    echo ❌ ERROR: dist\index.html no existe
    pause
    exit /b 1
)

echo ✅ Dist verificado

REM Build de Electron
echo 🔧 Building Electron...
call npm run dist:win
if %errorlevel% neq 0 (
    echo ❌ ERROR: Electron build falló
    pause
    exit /b 1
)

echo ✅ Electron build OK

REM Verificar instalador
if exist "release\*.exe" (
    echo.
    echo ========================================
    echo ✅ BUILD EXITOSO!
    echo ========================================
    dir release\*.exe
    echo.
    pause
) else (
    echo ❌ No se encontró instalador
    pause
)