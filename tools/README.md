# ContaVe Pro - License Generator Tool

## 📋 Descripción

Este directorio contiene la herramienta externa para generar licencias digitalmente firmadas para ContaVe Pro.

## 🔑 Generación de Licencias

### Uso del CLI

```bash
# Generar licencia interactiva
node license-generator.js

# Verificar claves
ls keys/
```

### Tipos de Licencia

1. **Trial**: 7 días, 50 registros, funciones básicas
2. **Basic**: $99/año, 1,000 registros, 1 empresa
3. **Professional**: $299/año, 10,000 registros, 3 empresas, API
4. **Enterprise**: $599/año, ilimitado, soporte 24/7

### Proceso de Activación

1. **Generar**: Usar license-generator.js
2. **Entregar**: Enviar archivo .json al cliente
3. **Activar**: Cliente importa en ContaVe Pro
4. **Verificar**: Sistema valida firma digital

## 🔐 Seguridad

- **RSA-2048**: Claves asimétricas para firmado
- **SHA-256**: Hash de verificación
- **AES-256**: Payload encryption
- **Offline Validation**: No requiere internet para validar

## 📁 Estructura

```
tools/
├── license-generator.js     # CLI principal
├── keys/                    # Claves RSA
│   ├── contave-private.pem # Clave privada (PROTEGER)
│   └── contave-public.pem  # Clave pública (va en app)
└── licenses/               # Licencias generadas
    └── *.json             # Archivos de licencia
```

## ⚠️ Seguridad Crítica

**NUNCA COMPARTIR LA CLAVE PRIVADA**
- Mantener `contave-private.pem` segura
- Solo el desarrollador debe tener acceso
- La clave pública va embedded en la aplicación

## 🚀 Uso en Producción

```bash
# Generar licencia para cliente
node license-generator.js

# Información requerida:
# - Nombre del cliente
# - Empresa y RIF
# - Email y teléfono
# - Tipo de licencia
# - Duración en meses
```

El sistema generará un archivo .json que el cliente debe importar en ContaVe Pro.