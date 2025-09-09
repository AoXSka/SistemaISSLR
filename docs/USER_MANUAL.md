# ContaVe Pro - Manual del Usuario

## 📖 **ÍNDICE**

1. [Introducción](#introducción)
2. [Dashboard Ejecutivo](#dashboard-ejecutivo)
3. [Libro Mayor Contable](#libro-mayor-contable)
4. [Retenciones ISLR](#retenciones-islr)
5. [Retenciones IVA](#retenciones-iva)
6. [Gestión de Proveedores](#gestión-de-proveedores)
7. [Comprobantes](#comprobantes)
8. [Reportes y Análisis](#reportes-y-análisis)
9. [Calendario Fiscal](#calendario-fiscal)
10. [Configuración](#configuración)

---

## 🏁 **INTRODUCCIÓN**

ContaVe Pro es un sistema integral de gestión contable diseñado para cumplir con todas las normativas fiscales venezolanas del SENIAT. Este manual le guiará en el uso de todas las funcionalidades del sistema.

### **Navegación Principal**

La aplicación está organizada en módulos accesibles desde la barra lateral:

- **🏠 Dashboard**: Resumen ejecutivo y métricas
- **📖 Libro Mayor**: Registro completo de transacciones  
- **🧾 ISLR**: Gestión de retenciones del Impuesto Sobre La Renta
- **📄 IVA**: Gestión de retenciones del Impuesto al Valor Agregado
- **👥 Proveedores**: Base de datos de proveedores
- **📋 Comprobantes**: Gestión de comprobantes oficiales
- **📊 Reportes**: Informes ejecutivos y análisis
- **📅 Calendario**: Control de fechas fiscales importantes
- **🏢 Empresa**: Configuración de datos corporativos
- **⚙️ Configuración**: Ajustes del sistema

---

## 🏠 **DASHBOARD EJECUTIVO**

### **Vista General**

El dashboard proporciona una vista panorámica de la situación fiscal de su empresa.

### **Métricas Principales**

1. **Ingresos Totales**: Suma de todos los ingresos del período
2. **Gastos del Mes**: Total de gastos operativos
3. **Retenciones ISLR**: Monto total retenido por ISLR
4. **Retenciones IVA**: Monto total retenido por IVA
5. **Declaraciones Pendientes**: Cantidad de obligaciones fiscales por cumplir
6. **Crecimiento Mensual**: Porcentaje de crecimiento vs período anterior

### **Gráficos Interactivos**

- **Tendencias Mensuales**: Evolución de ingresos durante el año
- **Distribución de Retenciones**: Proporción entre ISLR, IVA y otros

### **Transacciones Recientes**

Lista de las últimas 5 operaciones registradas con:
- Fecha y tipo de operación
- Proveedor involucrado
- Monto de la retención
- Estado actual

### **Alertas Fiscales**

Notificaciones automáticas sobre:
- Vencimientos próximos de declaraciones
- Comprobantes pendientes de envío
- Backups del sistema
- Actualizaciones de normativas

---

## 📖 **LIBRO MAYOR CONTABLE**

### **Propósito**

El Libro Mayor es el registro cronológico de todas las operaciones contables de la empresa.

### **Filtros Disponibles**

1. **Búsqueda por Texto**: Proveedor, número de documento, concepto
2. **Tipo de Operación**: ISLR, IVA, Ingresos, Gastos
3. **Estado**: Pendiente, Pagado, Declarado
4. **Rango de Fechas**: Período específico

### **Columnas de Información**

- **Fecha**: Fecha de la operación
- **Tipo**: ISLR, IVA, Income, Expense
- **Documento**: Número de factura o documento
- **Proveedor**: Nombre y RIF del proveedor
- **Base Imponible**: Monto sujeto a retención
- **% Retención**: Porcentaje aplicado
- **Monto Retenido**: Cantidad retenida
- **Estado**: Estado actual de la operación

### **Acciones Disponibles**

- **👁️ Ver**: Detalles completos de la transacción
- **✏️ Editar**: Modificar datos (si el período está abierto)
- **📄 Comprobante**: Generar comprobante oficial
- **✉️ Email**: Enviar comprobante al proveedor
- **🗑️ Eliminar**: Eliminar transacción (con confirmación)

### **Exportación**

- **PDF**: Libro mayor completo con totales
- **Excel**: Datos para análisis adicional
- **Imprimir**: Formato optimizado para papel

---

## 🧾 **RETENCIONES ISLR**

### **Conceptos ISLR Oficiales**

El sistema incluye los conceptos oficiales del SENIAT:

| Código | Concepto | Tasa |
|--------|----------|------|
| 001 | Honorarios Profesionales | 6% |
| 002 | Servicios Técnicos | 3% |
| 003 | Servicios de Construcción | 2% |
| 004 | Servicios de Publicidad | 3% |
| 005 | Servicios de Limpieza | 2% |
| 006 | Servicios de Transporte | 2% |
| 007 | Arrendamientos | 6% |
| 008 | Servicios de Informática | 3% |

### **Registrar Nueva Retención ISLR**

1. **Clic**: "Nueva Retención ISLR"
2. **Datos del Proveedor**:
   - RIF (validación automática)
   - Nombre o Razón Social
3. **Información del Documento**:
   - Número de factura
   - Número de control (opcional)
   - Fecha de operación
4. **Concepto y Cálculo**:
   - Seleccionar concepto ISLR (auto-calcula tasa)
   - Ingresar base imponible
   - Sistema calcula retención automáticamente

### **Comprobante ISLR**

El sistema genera comprobantes con estructura oficial SENIAT:

```
┌─────────────────────────────────────────────┐
│     COMPROBANTE DE RETENCIÓN I.S.L.R.      │
│         N° 2024-ISLR-00001                  │
├─────────────────────────────────────────────┤
│ AGENTE DE RETENCIÓN                        │
│ [Datos de su empresa]                      │
├─────────────────────────────────────────────┤
│ SUJETO RETENIDO                            │
│ [Datos del proveedor]                      │
├─────────────────────────────────────────────┤
│ DETALLES DE LA RETENCIÓN                   │
│ [Tabla con concepto, base, %, monto]       │
├─────────────────────────────────────────────┤
│ [Firmas del agente y sujeto]               │
└─────────────────────────────────────────────┘
```

---

## 📄 **RETENCIONES IVA**

### **Tipos de Retención IVA**

- **75%**: Contribuyentes ordinarios
- **100%**: Contribuyentes especiales (designados por SENIAT)

### **Proceso de Registro**

1. **Tipo de Operación**: Compra (C) o Venta (V)
2. **Tipo de Documento**: 
   - 01: Factura
   - 02: Nota de Débito  
   - 03: Nota de Crédito
3. **Datos de la Factura**:
   - Número y control
   - Fecha de emisión
4. **Cálculo Automático**:
   - Base imponible
   - IVA 16% = Base × 0.16
   - Retención = IVA × (75% o 100%)

### **Validaciones Automáticas**

- **Base vs Total**: Base + IVA + Exento = Total
- **Retención**: Cálculo automático según porcentaje
- **Formato RIF**: Validación con algoritmo SENIAT
- **Fechas**: Formato DD/MM/YYYY venezolano

---

## 👥 **GESTIÓN DE PROVEEDORES**

### **Base de Datos Completa**

Cada proveedor incluye:

1. **Datos Básicos**:
   - RIF (con validación)
   - Nombre/Razón Social
   - Dirección fiscal
   - Teléfono y email
   - Persona de contacto

2. **Configuración Fiscal**:
   - Tipo de contribuyente
   - % Retención ISLR predeterminado
   - % Retención IVA predeterminado
   - Notas especiales

### **Funciones Especiales**

- **Validación RIF**: Verificación automática con SENIAT
- **Historial**: Todas las transacciones con el proveedor
- **Estadísticas**: Total facturado, retenido, transacciones
- **Comunicación**: Envío directo de comprobantes por email

### **Importación Masiva**

Para registrar múltiples proveedores:
1. Descargue plantilla Excel
2. Complete los datos
3. Importe archivo
4. Valide y confirme

---

## 📋 **COMPROBANTES**

### **Tipos de Comprobantes**

1. **Comprobantes ISLR**: Estructura oficial con 6 columnas
2. **Comprobantes IVA**: Estructura oficial con 8 columnas

### **Estados de Comprobantes**

- **Generado**: PDF creado, listo para envío
- **Enviado**: Email enviado al proveedor
- **Recibido**: Confirmación de recepción (manual)

### **Gestión Masiva**

- **Selección múltiple**: Checkbox en cada comprobante
- **Envío masivo**: Email a múltiples proveedores
- **Descarga masiva**: ZIP con todos los PDFs
- **Impresión masiva**: Lote de comprobantes

### **Numeración Automática**

- **ISLR**: 2024ISLR0001, 2024ISLR0002...
- **IVA**: 2024IVA0001, 2024IVA0002...
- **Secuencial por tipo y año**

---

## 📊 **REPORTES Y ANÁLISIS**

### **Reportes Financieros**

1. **Balance General**: Activos, pasivos y patrimonio
2. **Estado de Resultados**: Ingresos, gastos y utilidades
3. **Flujo de Caja**: Entradas y salidas de efectivo
4. **Análisis de Gastos**: Por categoría y proveedor

### **Reportes Fiscales**

1. **Resumen de Retenciones**: ISLR e IVA por período
2. **Libro de Compras**: Formato oficial SENIAT
3. **Libro de Ventas**: Formato oficial SENIAT
4. **Proyecciones Fiscales**: Estimaciones tributarias

### **Análisis de Proveedores**

- **Ranking por Volumen**: Mayores proveedores
- **Tendencias**: Crecimiento o disminución
- **Retenciones por Proveedor**: Desglose detallado
- **Estados de Cuenta**: Resumen individual

### **Exportación de Reportes**

- **PDF**: Formato profesional para presentación
- **Excel**: Datos para análisis personalizado
- **CSV**: Compatible con otros sistemas
- **Email**: Envío automático programado

---

## 📅 **CALENDARIO FISCAL**

### **Fechas Importantes Automáticas**

El sistema incluye automáticamente:

- **IVA Mensual**: 15 de cada mes
- **ISLR 1ra Quincena**: 15 de cada mes  
- **ISLR 2da Quincena**: Último día del mes
- **Declaración Anual**: 31 de enero
- **Feriados**: Días no hábiles

### **Eventos Personalizados**

Agregue eventos específicos:
- **Reuniones contables**
- **Auditorías programadas**
- **Vencimientos especiales**
- **Recordatorios internos**

### **Alertas Automáticas**

- **7 días antes**: Alerta inicial
- **3 días antes**: Alerta urgente
- **1 día antes**: Alerta crítica
- **Email automático**: Si está configurado

---

## ⚙️ **CONFIGURACIÓN**

### **Datos de Empresa**

Mantenga actualizados:
- **RIF**: Registro fiscal oficial
- **Razón Social**: Nombre legal exacto
- **Dirección**: Dirección fiscal registrada
- **Contacto**: Teléfono y email operativo

### **Configuración Fiscal**

- **Año Fiscal**: Período contable actual
- **Moneda**: VES (Bolívares) por defecto
- **Régimen**: Ordinario/Especial según SENIAT
- **Método**: Base devengado (recomendado)

### **Configuración de Email**

Para automatización de envíos:
1. **Servidor SMTP**: Del proveedor de email
2. **Puerto**: 587 (TLS) o 465 (SSL)
3. **Credenciales**: Usuario y contraseña
4. **Prueba**: Verificar configuración

### **Backup y Seguridad**

- **Backup Automático**: Diario (recomendado)
- **Ubicación**: Carpeta local segura
- **Retención**: 30 días
- **Encriptación**: AES-256 activada
- **Auditoría**: Registro de todas las acciones

---

## 🔧 **MANTENIMIENTO**

### **Tareas Regulares**

**Diarias**:
- [ ] Revisar alertas fiscales
- [ ] Verificar backup automático
- [ ] Registrar transacciones del día

**Semanales**:
- [ ] Revisar proveedores pendientes
- [ ] Generar reportes de análisis
- [ ] Verificar email enviados

**Mensuales**:
- [ ] Declaraciones ISLR e IVA
- [ ] Conciliación bancaria
- [ ] Análisis de gastos por categoría
- [ ] Backup manual adicional

**Anuales**:
- [ ] Declaración anual ISLR
- [ ] Renovación de licencia
- [ ] Actualización de conceptos SENIAT
- [ ] Auditoría integral del sistema

### **Optimización del Sistema**

**Configuración → Sistema → Base de Datos**:
- **Optimizar**: Reorganiza índices y mejora rendimiento
- **Limpiar Cache**: Libera memoria temporal
- **Verificar Integridad**: Valida consistencia de datos
- **Compactar**: Reduce tamaño de base de datos

---

## 🆘 **RESOLUCIÓN DE PROBLEMAS**

### **Problemas Frecuentes**

**❓ "No puedo generar el PDF del comprobante"**
- Verifique que todos los campos obligatorios estén completos
- Asegúrese de que el RIF del proveedor sea válido
- Intente cerrar otros programas que usen memoria

**❓ "El email no se envía"**
- Verifique configuración SMTP en Configuración → Email
- Pruebe la conexión con "Probar Configuración"
- Verifique que el email del proveedor sea correcto

**❓ "Error al exportar archivo SENIAT"**
- Verifique que todas las transacciones tengan RIF válido
- Confirme que las fechas estén en el período correcto
- Revise que los montos de retención sean consistentes

**❓ "La aplicación va lenta"**
- Use Configuración → Sistema → "Optimizar Base de Datos"
- Limpie el cache del sistema
- Verifique espacio disponible en disco

### **Contacto de Soporte**

Si el problema persiste:
- **Email**: soporte@contavepro.com
- **WhatsApp**: +58-212-555-0199
- **Incluya**: Captura de pantalla y descripción detallada

---

## 📈 **MEJORES PRÁCTICAS**

### **Registro de Transacciones**

1. **Registre diariamente**: No acumule para fin de mes
2. **Validación inmediata**: Verifique RIF al ingresar proveedores
3. **Documentación**: Guarde siempre el documento soporte
4. **Revisión**: Verifique cálculos antes de confirmar

### **Gestión de Comprobantes**

1. **Envío oportuno**: Envíe comprobantes máximo 5 días después
2. **Confirmación**: Verifique recepción por parte del proveedor
3. **Archivo**: Mantenga copia digital y física
4. **Seguimiento**: Use el estado para control

### **Cumplimiento Fiscal**

1. **Calendario**: Revise semanalmente fechas importantes
2. **Declaraciones**: Presente antes del vencimiento
3. **Backup**: Mantenga respaldos actualizados
4. **Actualización**: Instale actualizaciones del sistema

### **Seguridad de Datos**

1. **Acceso**: Controle quién tiene acceso al sistema
2. **Passwords**: Use contraseñas fuertes
3. **Backup**: Mantenga copias en ubicación segura
4. **Auditoría**: Revise logs periódicamente

---

## 📞 **CONTACTO Y SOPORTE**

### **Soporte Técnico**
- 📧 soporte@contavepro.com
- 📱 WhatsApp: +58-212-555-0199
- 🌐 www.contavepro.com/soporte

### **Ventas y Licencias**
- 📧 ventas@contavepro.com
- 📱 WhatsApp: +58-212-555-0188
- 🌐 www.contavepro.com

### **Capacitación**
- 📧 capacitacion@contavepro.com
- 📹 YouTube: ContaVe Pro Venezuela
- 📚 docs.contavepro.com

---

*Manual del Usuario v2.0 - Diciembre 2024*
*© ContaVe Solutions - Todos los derechos reservados*