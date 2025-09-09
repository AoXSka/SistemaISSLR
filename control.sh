#!/bin/bash
# Script para encontrar y corregir las validaciones del número de control

echo "🔍 Buscando archivos con validaciones del número de control..."

# 1. Buscar todos los archivos que contienen la regex problemática
echo "📁 Archivos que contienen /^\d{2}-\d{8}$/:"
grep -r "\\^\\\\d{2}-\\\\d{8}\\$" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true
grep -r "/\\^\\\\d{2}-\\\\d{8}\\$/" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true

echo -e "\n📁 Archivos que contienen XX-XXXXXXXX:"
grep -r "XX-XXXXXXXX" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true

echo -e "\n📁 Archivos que contienen controlNumber:"
grep -r "controlNumber" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true

echo -e "\n📁 Archivos que contienen control_number:"
grep -r "control_number" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true

echo -e "\n📁 Archivos que contienen 'número de control':"
grep -r "número de control" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true