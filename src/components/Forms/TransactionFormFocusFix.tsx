// components/Forms/TransactionFormFocusFix.tsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Hook especializado para manejar el focus en formularios de ISLR/IVA
 * Resuelve el problema de focus en modales con carga asíncrona de datos
 */
export function useTransactionFormFocus(
  isOpen: boolean,
  type: 'ISLR' | 'IVA' | 'INCOME' | 'EXPENSE',
  modalContentRef?: React.RefObject<HTMLElement>
) {
  const [focusReady, setFocusReady] = useState(false);
  const focusAttempts = useRef(0);
  const maxAttempts = 10;
  const attemptInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isOpen) {
      setFocusReady(false);
      focusAttempts.current = 0;
      if (attemptInterval.current) {
        clearInterval(attemptInterval.current);
      }
      return;
    }

    // Para ISLR/IVA necesitamos un approach más agresivo
    if (type === 'ISLR' || type === 'IVA') {
      attemptInterval.current = setInterval(() => {
        focusAttempts.current++;
        
        // Buscar el primer campo editable disponible
        const container = modalContentRef?.current || document.body;
        const focusableSelectors = [
          'input:not([disabled]):not([readonly]):not([type="hidden"])',
          'select:not([disabled]):not([readonly])',
          'textarea:not([disabled]):not([readonly])'
        ].join(', ');
        
        const firstField = container.querySelector(focusableSelectors) as HTMLElement;
        
        if (firstField && document.body.contains(firstField)) {
          // Verificar que el campo sea visible
          const rect = firstField.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          
          if (isVisible) {
            console.log(`✅ Focus attempt ${focusAttempts.current} successful for ${type}`);
            firstField.focus();
            
            // Para inputs de texto, seleccionar el contenido
            if (firstField instanceof HTMLInputElement && 
                ['text', 'number', 'tel', 'email'].includes(firstField.type)) {
              firstField.select();
            }
            
            setFocusReady(true);
            clearInterval(attemptInterval.current);
            return;
          }
        }
        
        // Detener después de max intentos
        if (focusAttempts.current >= maxAttempts) {
          console.warn(`⚠️ Could not set focus after ${maxAttempts} attempts for ${type}`);
          clearInterval(attemptInterval.current);
        }
      }, 50); // Intentar cada 50ms
    } else {
      // Para EXPENSE usar el approach más simple
      setTimeout(() => {
        const container = modalContentRef?.current || document.body;
        const firstField = container.querySelector('input:not([disabled]), select:not([disabled])') as HTMLElement;
        if (firstField) {
          firstField.focus();
          setFocusReady(true);
        }
      }, 100);
    }

    return () => {
      if (attemptInterval.current) {
        clearInterval(attemptInterval.current);
      }
    };
  }, [isOpen, type, modalContentRef]);

  return { focusReady };
}

/**
 * Componente wrapper para inputs con focus management mejorado
 */
export const FocusableInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    shouldAutoFocus?: boolean;
    focusDelay?: number;
    onFocusReady?: () => void;
  }
>(({ shouldAutoFocus = false, focusDelay = 0, onFocusReady, ...props }, ref) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as any) || internalRef;
  const [hasFocused, setHasFocused] = useState(false);

  useEffect(() => {
    if (shouldAutoFocus && !hasFocused && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current && document.body.contains(inputRef.current)) {
          // Double-check que el elemento es interactivo
          const isInteractive = !inputRef.current.disabled && 
                               !inputRef.current.readOnly &&
                               inputRef.current.offsetParent !== null;
          
          if (isInteractive) {
            inputRef.current.focus();
            setHasFocused(true);
            onFocusReady?.();
          }
        }
      }, focusDelay);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoFocus, focusDelay, hasFocused, onFocusReady]);

  // Prevenir blur accidental durante la carga inicial
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!hasFocused && shouldAutoFocus) {
      e.preventDefault();
      e.currentTarget.focus();
      setHasFocused(true);
    }
    props.onBlur?.(e);
  };

  return (
    <input
      ref={inputRef}
      {...props}
      onBlur={handleBlur}
    />
  );
});

FocusableInput.displayName = 'FocusableInput';

/**
 * HOC para envolver el TransactionForm con fix de focus
 */
export function withTransactionFormFocusFix<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return React.memo((props: P) => {
    const modalRef = useRef<HTMLDivElement>(null);
    
    // Inyectar ref si el componente lo soporta
    const enhancedProps = {
      ...props,
      modalContentRef: modalRef
    } as P;

    return (
      <div ref={modalRef} className="transaction-form-focus-wrapper">
        <Component {...enhancedProps} />
      </div>
    );
  });
}

/**
 * Utilidad para diagnosticar problemas de focus
 */
export function useFocusDiagnostics(enabled = false) {
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = (e: FocusEvent) => {
      console.log('🔍 Focus:', e.target);
    };

    const handleBlur = (e: FocusEvent) => {
      console.log('👁️ Blur:', e.target);
    };

    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
    };
  }, [enabled]);
}