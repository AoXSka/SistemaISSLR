#!/bin/bash
# ContaVe Pro - Script de build Windows con Docker

set -e

echo "🚀 ContaVe Pro - Build Windows con Docker"
echo "========================================"

# Verificar que Docker está disponible
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado o no está en PATH"
    echo "Instale Docker Desktop desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Verificar que Docker está corriendo
if ! docker info &> /dev/null; then
    echo "❌ Docker no está corriendo"
    echo "Inicie Docker Desktop e intente nuevamente"
    exit 1
fi

echo "✅ Docker verificado"

# Limpiar builds anteriores
echo "🧹 Limpiando builds anteriores..."
rm -rf release/* dist/*

# Crear directorios necesarios
mkdir -p release logs

# Build con Docker
echo "🔨 Iniciando build con Docker..."
docker build --target builder -t contave-pro-builder .

# Extraer el instalador generado
echo "📦 Extrayendo instalador..."
docker run --rm -v "$(pwd)/release:/output" contave-pro-builder sh -c "cp /app/release/*.exe /output/ 2>/dev/null || echo 'No .exe files found'"

# Verificar que se generó el instalador
if ls release/*.exe 1> /dev/null 2>&1; then
    echo "✅ Build completado exitosamente!"
    echo "📁 Instalador generado:"
    ls -la release/*.exe
    
    # Mostrar información del archivo
    for file in release/*.exe; do
        echo "📋 Archivo: $(basename "$file")"
        echo "📊 Tamaño: $(du -h "$file" | cut -f1)"
        echo "📅 Fecha: $(date -r "$file")"
    done
    
    echo ""
    echo "🎯 Siguiente paso:"
    echo "Pruebe el instalador en una máquina Windows limpia"
    echo "Ejecute como administrador para instalación perMachine"
else
    echo "❌ Error: No se generó el instalador"
    echo "Revise los logs para más detalles"
    exit 1
fi

echo ""
echo "🏁 Build Windows completado"