@echo off
echo ========================================
echo ContaVe Pro - Build con Permisos Admin
echo ========================================
echo.

REM Verificar si se está ejecutando como administrador
net session >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ejecutándose como Administrador
) else (
    echo ❌ ERROR: Este script requiere permisos de administrador
    echo.
    echo SOLUCIÓN:
    echo 1. Haga clic derecho en "Símbolo del sistema"
    echo 2. Seleccione "Ejecutar como administrador"
    echo 3. Navegue a la carpeta del proyecto
    echo 4. Ejecute: scripts\build-admin.bat
    echo.
    pause
    exit /b 1
)

echo.
echo 🧹 Limpiando builds anteriores...
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"

echo.
echo 🗂️ Limpiando cache de electron-builder...
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache"
    echo ✅ Cache limpiado
) else (
    echo ℹ️ Cache ya estaba limpio
)

echo.
echo 📱 Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build de Vite falló
    pause
    exit /b 1
)

echo ✅ Frontend build completado

REM Verificar que dist existe
if not exist "dist\index.html" (
    echo ❌ ERROR: dist\index.html no fue generado
    pause
    exit /b 1
)

echo ✅ Dist verificado

echo.
echo 🔧 Building Electron (con permisos admin)...
echo ⏳ Esto puede tardar varios minutos...
call npm run dist:win
if %errorlevel% neq 0 (
    echo ❌ ERROR: Electron build falló
    echo.
    echo DEBUG INFO:
    echo - Verifique logs arriba para detalles
    echo - Si hay errores de symbolic links, ejecute como administrador
    echo - Si hay errores de wine, use build local en Windows
    pause
    exit /b 1
)

echo.
if exist "release\*.exe" (
    echo ========================================
    echo ✅ BUILD EXITOSO CON PERMISOS ADMIN!
    echo ========================================
    echo.
    dir release\*.exe
    echo.
    echo 🎯 Instalador generado exitosamente
    echo ✅ Symbolic links creados correctamente
    echo ✅ Code signing aplicado
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
echo 🏁 Build con admin completado
pause