@echo off
echo ========================================
echo ContaVe Pro - Generador de Instalador
echo Usando Inno Setup como alternativa
echo ========================================
echo.

REM Definir rutas posibles de Inno Setup
set ISCC_PATH1="C:\Program Files (x86)\Inno Setup 6\iscc.exe"
set ISCC_PATH2="C:\Program Files\Inno Setup 6\iscc.exe"
set ISCC_PATH3="C:\Program Files (x86)\Inno Setup 5\iscc.exe"
set ISCC_PATH4="C:\Program Files\Inno Setup 5\iscc.exe"

set ISCC_EXE=
echo Buscando Inno Setup en ubicaciones comunes...

REM Verificar cada ubicación posible
if exist %ISCC_PATH1% (
    set ISCC_EXE=%ISCC_PATH1%
    echo ✓ Encontrado en: %ISCC_PATH1%
    goto :found
)

if exist %ISCC_PATH2% (
    set ISCC_EXE=%ISCC_PATH2%
    echo ✓ Encontrado en: %ISCC_PATH2%
    goto :found
)

if exist %ISCC_PATH3% (
    set ISCC_EXE=%ISCC_PATH3%
    echo ✓ Encontrado en: %ISCC_PATH3%
    goto :found
)

if exist %ISCC_PATH4% (
    set ISCC_EXE=%ISCC_PATH4%
    echo ✓ Encontrado en: %ISCC_PATH4%
    goto :found
)

REM Intentar buscar en PATH también
where iscc >nul 2>nul
if %errorlevel% equ 0 (
    set ISCC_EXE=iscc
    echo ✓ Encontrado en PATH del sistema
    goto :found
)

REM Si no se encuentra
echo ❌ ERROR: No se pudo encontrar Inno Setup en las ubicaciones habituales
echo.
echo Ubicaciones verificadas:
echo - %ISCC_PATH1%
echo - %ISCC_PATH2%  
echo - %ISCC_PATH3%
echo - %ISCC_PATH4%
echo - PATH del sistema
echo.
echo SOLUCION MANUAL:
echo 1. Busque manualmente "iscc.exe" en su sistema
echo 2. Ejecute desde esa carpeta: iscc.exe "%CD%\installer.iss"
echo.
echo O instale desde: https://jrsoftware.org/isinfo.php
echo.
pause
exit /b 1

:found
echo.

REM Verificar y construir la aplicación
echo Construyendo aplicación con Vite...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Falló el build de Vite
    pause
    exit /b 1
)
echo ✓ Build de Vite completado

REM Construir con Electron Builder
echo.
echo Construyendo con Electron Builder...
call npm run dist:win
if %errorlevel% neq 0 (
    echo ERROR: Falló Electron Builder
    pause
    exit /b 1
)
echo ✓ Electron Builder completado

REM Verificar que la carpeta win-unpacked exista
if not exist "release\win-unpacked" (
    echo ERROR: No se encontró release\win-unpacked
    echo El build de Electron Builder no se completó correctamente
    echo.
    echo Estructura encontrada en release:
    if exist "release" (
        dir release
    ) else (
        echo - Carpeta release no existe
    )
    pause
    exit /b 1
)
echo ✓ Carpeta win-unpacked encontrada

echo.

REM Crear directorio de release si no existe
if not exist "release" mkdir release

echo Generando instalador con Inno Setup...
echo Script: installer.iss
echo Compilador: %ISCC_EXE%
echo Salida: release\ContaVe-Pro-Setup-2.0.0.exe
echo.

REM Compilar el instalador usando la ruta encontrada
%ISCC_EXE% installer.iss

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✅ INSTALADOR GENERADO EXITOSAMENTE
    echo ========================================
    echo.
    
    REM Mostrar información del archivo generado
    if exist "release\ContaVe-Pro-Setup-2.0.0.exe" (
        for %%A in ("release\ContaVe-Pro-Setup-2.0.0.exe") do (
            echo Archivo: %%~nxA
            echo Tamaño: %%~zA bytes
            echo Fecha: %%~tA
        )
        echo.
        echo TESTING:
        echo 1. Desinstale cualquier versión previa de ContaVe Pro
        echo 2. Ejecute ContaVe-Pro-Setup-2.0.0.exe COMO ADMINISTRADOR
        echo 3. Complete la instalación
        echo 4. Busque "ContaVe Pro" en menú inicio
        echo.
        echo ¿Desea abrir la carpeta release? ^(S/N^)
        choice /c SN /n /m ""
        if !errorlevel! equ 1 (
            explorer "release"
        )
    )
) else (
    echo.
    echo ========================================
    echo ❌ ERROR EN LA GENERACIÓN DEL INSTALADOR
    echo ========================================
    echo.
    echo Código de error: %errorlevel%
    echo.
    echo DEBUGGING MANUAL:
    echo Ejecute manualmente: %ISCC_EXE% installer.iss
    echo.
    pause
    exit /b 1
)

echo.
echo ¡Gracias por usar ContaVe Pro!
echo Soporte: soporte@contavepro.com
pause