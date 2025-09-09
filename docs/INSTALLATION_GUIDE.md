# ContaVe Pro - Guía de Instalación

## 🎯 **INTRODUCCIÓN**

ContaVe Pro es un sistema integral de gestión contable diseñado específicamente para empresas venezolanas. Este documento le guiará paso a paso en la instalación, configuración inicial y primeros pasos.

## 🖥️ **REQUISITOS DEL SISTEMA**

### **Mínimos:**
- **Sistema Operativo**: Windows 10 (64-bit) o superior
- **Memoria RAM**: 4 GB
- **Espacio en Disco**: 500 MB libres
- **Procesador**: Intel Core i3 o AMD equivalente
- **Conexión a Internet**: Solo para activación de licencia

### **Recomendados:**
- **Sistema Operativo**: Windows 11 (64-bit)
- **Memoria RAM**: 8 GB o más
- **Espacio en Disco**: 2 GB libres
- **Procesador**: Intel Core i5 o AMD equivalente
- **Conexión a Internet**: Banda ancha para sincronización

## 📦 **INSTALACIÓN PASO A PASO**

### **Paso 1: Descarga del Instalador**

1. Visite: **www.contavepro.com/descargar**
2. Seleccione la versión apropiada:
   - **ContaVe Pro Setup**: Instalador completo (recomendado)
   - **ContaVe Pro Portable**: Versión portable (no requiere instalación)
3. Descargue el archivo `.exe`

### **Paso 2: Ejecutar el Instalador**

1. **Haga doble clic** en el archivo descargado
2. **Windows SmartScreen**: Si aparece advertencia, haga clic en "Más información" → "Ejecutar de todas formas"
3. **Control de Cuentas de Usuario**: Confirme con "Sí"
4. **Asistente de Instalación**:
   - Idioma: Seleccione "Español (Venezuela)"
   - Licencia: Acepte los términos de uso
   - Ubicación: Predeterminado `C:\Program Files\ContaVe Pro` o personalice
   - Componentes: Mantenga todas las opciones seleccionadas
   - Accesos directos: Recomendado crear en escritorio y menú inicio

### **Paso 3: Primera Ejecución**

1. **Abra ContaVe Pro** desde el escritorio o menú inicio
2. **Splash Screen**: Espere la carga inicial del sistema
3. **Asistente de Configuración**: Se ejecutará automáticamente

## ⚙️ **CONFIGURACIÓN INICIAL**

### **Configuración de Empresa**

1. **Datos Básicos**:
   ```
   RIF: J-123456789-0
   Razón Social: MI EMPRESA, C.A.
   Dirección: Av. Principal, Edificio X, Piso Y, Ciudad
   Teléfono: 0212-1234567
   Email: contacto@miempresa.com
   ```

2. **Configuración Fiscal**:
   - Año Fiscal: 2024 (actual)
   - Moneda: VES (Bolívares)
   - Régimen: Contribuyente Ordinario/Especial

### **Activación de Licencia**

1. **Obtener Licencia**:
   - **Trial**: Se activa automáticamente (7 días)
   - **Comercial**: Contacte ventas@contavepro.com

2. **Activar**:
   - Menu: Configuración → Licencias
   - Ingrese: Clave de licencia (formato XXXXX-XXXXX-XXXXX)
   - Confirme: "Activar Licencia"

## 🏗️ **CONFIGURACIÓN DE BASE DE DATOS**

### **Base de Datos Local (Predeterminada)**

ContaVe Pro incluye SQLite integrado:
- **Ubicación**: `C:\Users\[Usuario]\AppData\Roaming\ContaVe Pro\contave.db`
- **Backup**: Automático diario en `[Ubicación]\Backups\`
- **No requiere instalación adicional**

### **Configuración de Email (Opcional)**

Para envío automático de comprobantes:

1. **Gmail/Google Workspace**:
   ```
   Servidor SMTP: smtp.gmail.com
   Puerto: 587
   Seguridad: TLS
   Usuario: su.email@gmail.com
   Contraseña: [Contraseña de aplicación]
   ```

2. **Otros Proveedores**:
   ```
   Cantv/ABA: smtp.cantv.net:587
   Hotmail: smtp-mail.outlook.com:587
   Yahoo: smtp.mail.yahoo.com:587
   ```

## 🎯 **PRIMEROS PASOS**

### **1. Configurar Primer Proveedor**

1. **Navegue**: Módulo "Proveedores"
2. **Clic**: "Nuevo Proveedor"
3. **Complete**:
   - RIF: V-12345678-9
   - Nombre: Juan Pérez
   - Email: juan@email.com
   - % ISLR: 6% (servicios profesionales)
   - % IVA: 75% (contribuyente ordinario)

### **2. Registrar Primera Retención ISLR**

1. **Navegue**: Módulo "Retenciones ISLR"
2. **Clic**: "Nueva Retención"
3. **Complete**:
   - Proveedor: Seleccione el creado anteriormente
   - Factura: FAC-001
   - Fecha: Actual
   - Concepto: 001 - Honorarios Profesionales
   - Base Imponible: 100.000,00
   - **Sistema calculará automáticamente**: 6% = 6.000,00

### **3. Generar Primer Comprobante**

1. **En la lista**: Localice la retención creada
2. **Clic**: Botón "Generar Comprobante"
3. **Verificar**: PDF con estructura oficial SENIAT
4. **Enviar**: Por email al proveedor (opcional)

### **4. Exportar para SENIAT**

1. **Navegue**: Módulo "Reportes"
2. **Seleccione**: "Exportación SENIAT"
3. **Configure**: Período (ej: 2024-12)
4. **Genere**: Archivo TXT para declaración

## 🔐 **CONFIGURACIÓN DE SEGURIDAD**

### **Backup Automático**

1. **Navegue**: Configuración → Sistema → Base de Datos
2. **Active**: Backup Automático
3. **Frecuencia**: Diario (recomendado)
4. **Retención**: 30 días

### **Contraseña de Usuario**

1. **Primera vez**: No requiere contraseña
2. **Para producción**:
   - Configuración → Seguridad
   - Establecer contraseña fuerte
   - Activar bloqueo por inactividad

## 🚨 **RESOLUCIÓN DE PROBLEMAS**

### **Problemas Comunes**

**Error: "No se puede conectar a la base de datos"**
- **Causa**: Permisos insuficientes
- **Solución**: Ejecutar como administrador

**Error: "Licencia inválida"**
- **Causa**: Clave incorrecta o vencida
- **Solución**: Verificar formato XXXXX-XXXXX-XXXXX

**Error: "No se pueden enviar emails"**
- **Causa**: Configuración SMTP incorrecta
- **Solución**: Verificar credenciales y probar conexión

### **Logs del Sistema**

**Ubicación**: `C:\Users\[Usuario]\AppData\Roaming\ContaVe Pro\Logs\`
**Archivos**:
- `app.log`: Log general de la aplicación
- `database.log`: Operaciones de base de datos
- `email.log`: Envíos de email
- `audit.log`: Auditoría de operaciones fiscales

## 📞 **SOPORTE TÉCNICO**

### **Canales de Soporte**

**📧 Email**: soporte@contavepro.com
**📱 WhatsApp**: +58-212-555-0199
**🌐 Portal**: www.contavepro.com/soporte
**📋 FAQ**: docs.contavepro.com/faq

### **Información para Soporte**

Al contactar soporte, proporcione:
- **Versión**: ContaVe Pro v2.0.0
- **Sistema**: Windows [versión]
- **Tipo de Licencia**: Enterprise/Profesional/Básica
- **Error**: Mensaje exacto o captura de pantalla
- **Log File**: Si es técnico, adjunte log relevante

### **Horarios de Atención**

- **Lunes a Viernes**: 8:00 AM - 6:00 PM (GMT-4)
- **Soporte Enterprise**: 24/7 (Solo licencias Enterprise)
- **WhatsApp**: Respuesta < 2 horas
- **Email**: Respuesta < 24 horas

## 📚 **RECURSOS ADICIONALES**

### **Documentación**

- **Manual de Usuario**: docs.contavepro.com/manual
- **Guía Contable**: docs.contavepro.com/contabilidad
- **Normativas SENIAT**: docs.contavepro.com/seniat
- **Videos Tutoriales**: youtube.com/contavepro

### **Capacitación**

- **Webinar Semanal**: Todos los jueves 2:00 PM
- **Curso Básico**: 4 horas online
- **Certificación**: Programa para contadores
- **Consultoría**: Implementación personalizada

### **Comunidad**

- **Telegram**: @ContaVeProVE
- **LinkedIn**: ContaVe Solutions
- **Facebook**: ContaVe Pro Venezuela

---

## ✅ **LISTA DE VERIFICACIÓN POST-INSTALACIÓN**

- [ ] ✅ Aplicación abre sin errores
- [ ] ✅ Datos de empresa configurados
- [ ] ✅ Licencia activada correctamente
- [ ] ✅ Primer proveedor creado
- [ ] ✅ Primera retención registrada
- [ ] ✅ Comprobante PDF generado
- [ ] ✅ Backup automático configurado
- [ ] ✅ Email configurado (si aplica)
- [ ] ✅ Exportación SENIAT probada

**¡Felicidades! ContaVe Pro está listo para usar.**

---

© 2024 ContaVe Solutions - Todos los derechos reservados