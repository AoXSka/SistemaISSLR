# ContaVe Pro - Guía de Generación de Instalador Windows

## 🎯 **OPCIONES DE INSTALADOR**

ContaVe Pro ahora incluye **dos métodos** para generar instaladores Windows:

### **Opción 1: Electron Builder (NSIS)**
- **Comando**: `npm run dist:win`
- **Ventajas**: Integrado con el ecosistema Electron
- **Desventajas**: Puede tener conflictos con módulos nativos

### **Opción 2: Inno Setup (Recomendado)**  
- **Comando**: `npm run build:installer`
- **Ventajas**: Más confiable, mejor personalización, scripts en español
- **Archivo**: `installer.iss` (script personalizable)

## 🛠️ **CONFIGURACIÓN INNO SETUP**

### **Prerrequisitos:**
1. **Instalar Inno Setup**: [Descargar aquí](https://jrsoftware.org/isinfo.php)
2. **Agregar al PATH**: `C:\Program Files (x86)\Inno Setup 6\`
3. **Verificar instalación**: Ejecutar `iscc` en CMD debe mostrar ayuda

### **Generación del Instalador:**
```bash
# Método automático (recomendado)
npm run build:installer

# Método manual
npm run build
iscc installer.iss
```

## 📋 **CARACTERÍSTICAS DEL INSTALADOR INNO SETUP**

### **✅ Funcionalidades Incluidas:**
- ✅ **Detección automática** de versiones previas (upgrade automático)
- ✅ **Instalación silenciosa** disponible (`/SILENT` parameter)
- ✅ **Creación de shortcuts** escritorio y menú inicio
- ✅ **Asociación de archivos** .cvpro con ContaVe Pro
- ✅ **Registro Windows** para integración con sistema
- ✅ **Desinstalador completo** con opción de conservar datos
- ✅ **Verificación de requisitos** (Windows 10 64-bit mínimo)
- ✅ **Interface en español** con textos venezolanos

### **📁 Estructura del Instalador:**
```
ContaVe Pro (Instalado en C:\Program Files\ContaVe Pro\)
├── ContaVe Pro.exe (Ejecutable principal)
├── resources\
│   └── app\ (Aplicación web empaquetada)
├── docs\ (Documentación incluida)
├── tools\ (Herramientas licencias)
└── LICENSE.md, README.md
```

## 🎛️ **PERSONALIZACIÓN DEL INSTALADOR**

### **Modificar `installer.iss`:**

#### **Información Básica:**
```ini
AppName=ContaVe Pro
AppVersion=2.0.0
AppPublisher=ContaVe Solutions
```

#### **Requisitos del Sistema:**
```ini
MinVersion=10.0              ; Windows 10 mínimo
ArchitecturesAllowed=x64     ; Solo 64-bit
PrivilegesRequired=admin     ; Requiere permisos admin
```

#### **Directorios de Instalación:**
```ini
DefaultDirName={autopf}\ContaVe Pro
DefaultGroupName=ContaVe Pro
```

#### **Características Avanzadas:**
```ini
; Auto-upgrade de versiones previas
[Code]
function IsUpgrade(): Boolean;
begin
  Result := (GetUninstallString() <> '');
end;
```

## 🔧 **RESOLUCIÓN DE PROBLEMAS**

### **Error: "iscc no reconocido"**
**Causa**: Inno Setup no está instalado o no está en PATH  
**Solución**: 
1. Descargar e instalar [Inno Setup](https://jrsoftware.org/isinfo.php)
2. Agregar `C:\Program Files (x86)\Inno Setup 6\` al PATH
3. Reiniciar terminal y verificar con `iscc`

### **Error: "dist folder not found"**
**Causa**: No se ejecutó el build de Vite  
**Solución**: Ejecutar `npm run build` primero

### **Error: "Access denied"**
**Causa**: Permisos insuficientes  
**Solución**: Ejecutar CMD como Administrador

### **Instalador muy grande**
**Causa**: Incluye módulos innecesarios  
**Solución**: Modificar sección `[Files]` en `installer.iss` para excluir archivos

## 📊 **COMPARACIÓN DE MÉTODOS**

| Característica | Electron Builder | Inno Setup |
|---|---|---|
| **Setup Complexity** | Automático | Manual inicial |
| **Personalización** | Limitada | Completa |
| **Tamaño del instalador** | Mayor | Optimizado |
| **Compatibilidad** | Puede fallar | Alta |
| **Debugging** | Difícil | Fácil |
| **Multiidioma** | Básico | Avanzado |
| **Auto-updater** | Integrado | Manual |
| **Recomendación** | Desarrollo | Producción |

## 🚀 **FLUJO DE PRODUCCIÓN RECOMENDADO**

### **Para Desarrollo:**
```bash
npm run electron-dev  # Testing local
```

### **Para Testing:**
```bash
npm run dist:debug    # Electron Builder con debug
```

### **Para Producción:**
```bash
npm run build:installer  # Inno Setup (recomendado)
```

## 📈 **DISTRIBUCIÓN**

### **Instalador Generado:**
- **Nombre**: `ContaVe-Pro-Setup-2.0.0.exe`
- **Ubicación**: `release/` directory
- **Tamaño**: ~150 MB
- **Compatibilidad**: Windows 10/11 64-bit

### **Instalación Cliente:**
1. **Ejecutar**: `ContaVe-Pro-Setup-2.0.0.exe`
2. **Seguir wizard**: Instalación guiada en español
3. **Activar licencia**: Al primer arranque
4. **Configurar empresa**: Setup wizard automático

## ⚡ **COMANDOS RÁPIDOS**

```bash
# Generar instalador (método recomendado)
npm run build:installer

# Verificar configuración Inno Setup
iscc /?

# Limpiar build previo
rmdir /s dist release
npm run build

# Testing local
npm run electron-dev
```

---

**✨ Con Inno Setup, ContaVe Pro tendrá un instalador Windows profesional, confiable y totalmente personalizado.**