@echo off
echo ========================================
echo ContaVe Pro - Generar Ejecutable Windows
echo ========================================
echo.

echo [INFO] Iniciando proceso de build...

REM Limpiar carpetas anteriores
echo [INFO] Limpiando build previo...
if exist "dist" rmdir /s /q "dist"
if exist "release" rmdir /s /q "release"

REM Build del frontend
echo [INFO] Construyendo frontend con Vite...
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

REM Build de Electron para Windows
echo [INFO] Generando ejecutable de Electron...
echo [INFO] Esto puede tomar varios minutos...
call npx electron-builder --win --x64 --publish=never
if %errorlevel% neq 0 (
    echo ❌ ERROR: Electron builder falló
    echo.
    echo POSIBLES SOLUCIONES:
    echo 1. Ejecutar como administrador
    echo 2. Verificar que todas las dependencias estén instaladas
    echo 3. Limpiar cache: rmdir /s /q "%%LOCALAPPDATA%%\electron-builder\Cache"
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ EJECUTABLE GENERADO EXITOSAMENTE!
echo ========================================
echo.

REM Verificar que se generó el ejecutable
if exist "release\*.exe" (
    echo 📁 Instalador Windows generado:
    dir release\*.exe
    echo.
    echo 🎯 El ejecutable está listo para distribución
    echo 📍 Ubicación: release\ContaVe Pro Setup 2.0.0.exe
    echo.
    echo ¿Desea abrir la carpeta release? (S/N)
    choice /c SN /n /m ""
    if %errorlevel% equ 1 (
        start explorer "release"
    )
) else (
    echo ❌ No se encontró el ejecutable
    if exist "release" (
        echo Contenido de release:
        dir release
    )
    echo.
    echo DEBUGGING:
    echo - Verifique que electron-builder completó sin errores
    echo - Revise los logs anteriores para más detalles
)

echo.
echo 🏁 Proceso completado
pause