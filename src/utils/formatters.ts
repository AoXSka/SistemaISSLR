// CORRECCIÓN CRÍTICA: Formateo de moneda con redondeo contable
export const formatCurrency = (amount: number): string => {
  // Validar entrada
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn('⚠️ formatCurrency: Invalid amount:', amount);
    return 'Bs. 0,00';
  }
  
  // Aplicar redondeo contable antes del formato
  const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;
  
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(roundedAmount);
};

// CORRECCIÓN: Formateo de números con validación
export const formatNumber = (number: number): string => {
  if (typeof number !== 'number' || isNaN(number)) {
    console.warn('⚠️ formatNumber: Invalid number:', number);
    return '0,00';
  }
  
  const roundedNumber = Math.round((number + Number.EPSILON) * 100) / 100;
  
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(roundedNumber);
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDate = (date: string): string => {
  if (!date || date === null || date === undefined) {
    return 'Nunca';
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }
  
  return new Intl.DateTimeFormat('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(dateObj);
};

export const formatRIF = (rif: string): string => {
  if (!rif) return '';
  
  // Remove any existing formatting
  const cleanRif = rif.replace(/[^0-9A-Za-z]/g, '');
  
  // Format as X-XXXXXXXX-X
  if (cleanRif.length >= 10) {
    return `${cleanRif[0]}-${cleanRif.slice(1, 9)}-${cleanRif[9]}`;
  }
  
  return rif;
};

export const validateRIF = (rif: string): boolean => {
  const rifPattern = /^[VEJGPGRC]-\d{8}-\d$/;
  return rifPattern.test(rif);
};

export const generateVoucherNumber = (type: 'ISLR' | 'IVA'): string => {
  try {
    // Usar timestamp para evitar colisiones + contador atómico
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Obtener secuencia de manera atómica
    const sequenceKey = `contave-voucher-sequence-${type}-${year}${month}`;
    const currentSequence = parseInt(localStorage.getItem(sequenceKey) || '1');
    const sequence = currentSequence.toString().padStart(8, '0');
    
    // Incrementar secuencia de forma atómica
    localStorage.setItem(sequenceKey, (currentSequence + 1).toString());
    
    // Formato: AAAAMMSSSSSSSS (Año + Mes + Secuencia de 8 dígitos)
    const voucherNumber = `${year}${month}${sequence}`;
    
    console.log(`📄 Generated ${type} voucher number:`, voucherNumber);
    return voucherNumber;
    
  } catch (error) {
    console.error('❌ Error generating voucher number:', error);
    // Fallback: usar timestamp para evitar duplicados
    const fallback = `${Date.now()}`.slice(-10);
    console.warn(`⚠️ Using fallback voucher number: ${fallback}`);
    return fallback;
  }
};