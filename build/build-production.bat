@echo off
setlocal enabledelayedexpansion

echo ========================================
echo ContaVe Pro - Build de Producción
echo ========================================
echo.

REM Configurar variables
set "PROJECT_ROOT=%~dp0.."
set "RELEASE_DIR=%PROJECT_ROOT%\release"
set "DOCKER_IMAGE=contave-pro-builder"

echo 📁 Directorio del proyecto: %PROJECT_ROOT%
echo 📁 Directorio de release: %RELEASE_DIR%
echo.

REM Limpiar builds anteriores
echo 🧹 Limpiando builds anteriores...
if exist "%RELEASE_DIR%" (
    rmdir /s /q "%RELEASE_DIR%"
)
if exist "%PROJECT_ROOT%\dist" (
    rmdir /s /q "%PROJECT_ROOT%\dist"
)

mkdir "%RELEASE_DIR%"
echo ✅ Directorios limpiados

REM Opción 1: Build local (Windows)
echo.
echo Seleccione método de build:
echo 1. Build Local (Recomendado para Windows)
echo 2. Build con Docker (Para entornos Linux/CI)
echo.
choice /c 12 /n /m "Seleccione opción (1 o 2): "

if %errorlevel% equ 1 goto BUILD_LOCAL
if %errorlevel% equ 2 goto BUILD_DOCKER

:BUILD_LOCAL
echo.
echo 🏗️ Iniciando build local...

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    pause
    exit /b 1
)

echo ✅ Node.js verificado

REM Instalar dependencias
echo 📦 Instalando dependencias...
cd /d "%PROJECT_ROOT%"
call npm ci --omit=optional
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló la instalación de dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas

REM Build frontend
echo 🎨 Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build de frontend falló
    pause
    exit /b 1
)

echo ✅ Frontend build completado

REM Rebuild native modules
echo 🔧 Reconstruyendo módulos nativos...
call npm run rebuild
if %errorlevel% neq 0 (
    echo ⚠️ WARNING: Rebuild falló, continuando...
)

echo ✅ Módulos nativos listos

REM Build Electron binarios
echo ⚡ Generando binarios Electron...
call npm run dist:win-portable
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build de Electron falló
    pause
    exit /b 1
)

echo ✅ Binarios Electron generados

goto BUILD_INNO

:BUILD_DOCKER
echo.
echo 🐳 Iniciando build con Docker...

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Docker no está instalado
    pause
    exit /b 1
)

echo ✅ Docker verificado

REM Build Docker image
echo 🔨 Construyendo imagen Docker...
cd /d "%PROJECT_ROOT%"
docker build -t %DOCKER_IMAGE% .
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build de Docker falló
    pause
    exit /b 1
)

echo ✅ Imagen Docker creada

REM Run build in container
echo 🚀 Ejecutando build en contenedor...
docker run --rm -v "%RELEASE_DIR%:/output" %DOCKER_IMAGE%
if %errorlevel% neq 0 (
    echo ❌ ERROR: Build en Docker falló
    pause
    exit /b 1
)

echo ✅ Build Docker completado

:BUILD_INNO
echo.
echo 📦 Generando instalador con Inno Setup...

REM Verificar que existen los binarios
if not exist "%RELEASE_DIR%\win-unpacked" (
    echo ❌ ERROR: No se encontraron binarios en release\win-unpacked
    pause
    exit /b 1
)

REM Buscar Inno Setup
set "ISCC_EXE="
set "ISCC_PATH1=C:\Program Files (x86)\Inno Setup 6\iscc.exe"
set "ISCC_PATH2=C:\Program Files\Inno Setup 6\iscc.exe"

if exist "%ISCC_PATH1%" (
    set "ISCC_EXE=%ISCC_PATH1%"
) else if exist "%ISCC_PATH2%" (
    set "ISCC_EXE=%ISCC_PATH2%"
) else (
    echo ❌ ERROR: Inno Setup no encontrado
    echo.
    echo SOLUCIÓN:
    echo 1. Instale Inno Setup desde: https://jrsoftware.org/isinfo.php
    echo 2. O ejecute manualmente: iscc installer.iss
    pause
    exit /b 1
)

echo ✅ Inno Setup encontrado: %ISCC_EXE%

REM Compilar instalador
echo 🔧 Compilando instalador...
cd /d "%PROJECT_ROOT%"
"%ISCC_EXE%" installer.iss
if %errorlevel% neq 0 (
    echo ❌ ERROR: Compilación de Inno Setup falló
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ BUILD DE PRODUCCIÓN COMPLETADO!
echo ========================================
echo.

REM Mostrar resultados
if exist "%RELEASE_DIR%\ContaVe-Pro-Setup-2.0.0.exe" (
    echo 📦 Instalador generado: ContaVe-Pro-Setup-2.0.0.exe
    
    for %%A in ("%RELEASE_DIR%\ContaVe-Pro-Setup-2.0.0.exe") do (
        echo 📊 Tamaño: %%~zA bytes
        echo 📅 Fecha: %%~tA
    )
    
    echo.
    echo 🎯 PASOS SIGUIENTES:
    echo 1. Probar instalador en máquina Windows limpia
    echo 2. Verificar que todos los módulos funcionan
    echo 3. Validar base de datos se crea correctamente
    echo 4. Confirmar desinstalación limpia
    echo.
    
    echo ¿Abrir carpeta release? (S/N)
    choice /c SN /n /m ""
    if !errorlevel! equ 1 (
        start explorer "%RELEASE_DIR%"
    )
) else (
    echo ❌ ERROR: No se generó el instalador
    echo Revise los logs para más detalles
)

echo.
echo 🏁 Proceso completado
pause