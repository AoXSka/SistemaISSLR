// hooks/useFocusManager.ts
import { useRef, useCallback, useEffect } from 'react';

interface FocusManagerOptions {
  autoFocusDelay?: number;
  selectOnFocus?: boolean;
  restoreFocusOnUnmount?: boolean;
}

export function useFocusManager(options: FocusManagerOptions = {}) {
  const {
    autoFocusDelay = 100,
    selectOnFocus = false,
    restoreFocusOnUnmount = false
  } = options;

  const focusHistory = useRef<HTMLElement[]>([]);
  const previousActiveElement = useRef<Element | null>(null);
  const focusTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      focusTimeouts.current.forEach(timeout => clearTimeout(timeout));
      focusTimeouts.current.clear();
      
      if (restoreFocusOnUnmount && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocusOnUnmount]);

  const setFocusWithDelay = useCallback((
    element: HTMLElement | null,
    delay: number = autoFocusDelay
  ) => {
    if (!element) return;

    const timeout = setTimeout(() => {
      requestAnimationFrame(() => {
        if (document.body.contains(element)) {
          // Store previous focus
          previousActiveElement.current = document.activeElement;
          
          // Focus element
          element.focus({ preventScroll: false });
          
          // Select text if it's an input and option is enabled
          if (selectOnFocus && 'select' in element && typeof element.select === 'function') {
            element.select();
          }
          
          // Track focus history
          focusHistory.current.push(element);
          if (focusHistory.current.length > 10) {
            focusHistory.current.shift();
          }
        }
      });
      
      focusTimeouts.current.delete(timeout);
    }, delay);
    
    focusTimeouts.current.add(timeout);
  }, [autoFocusDelay, selectOnFocus]);

  const focusNext = useCallback(() => {
    const focusableElements = document.querySelectorAll<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const currentIndex = Array.from(focusableElements).findIndex(
      el => el === document.activeElement
    );
    
    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    }
  }, []);

  const focusPrevious = useCallback(() => {
    const focusableElements = document.querySelectorAll<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const currentIndex = Array.from(focusableElements).findIndex(
      el => el === document.activeElement
    );
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    }
  }, []);

  const trapFocus = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    if (!containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);
    
    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    setFocusWithDelay,
    focusNext,
    focusPrevious,
    trapFocus,
    focusHistory: focusHistory.current
  };
}

// Hook para auto-focus en campos con validación
export function useFieldFocus(
  ref: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  options: {
    autoFocus?: boolean;
    focusOnError?: boolean;
    error?: string | null;
    delay?: number;
  } = {}
) {
  const { 
    autoFocus = false, 
    focusOnError = true, 
    error = null,
    delay = 50 
  } = options;
  
  const hasInitialFocus = useRef(false);

  useEffect(() => {
    if (autoFocus && !hasInitialFocus.current && ref.current) {
      hasInitialFocus.current = true;
      const timeout = setTimeout(() => {
        requestAnimationFrame(() => {
          if (ref.current && document.body.contains(ref.current)) {
            ref.current.focus();
            if ('select' in ref.current) {
              ref.current.select?.();
            }
          }
        });
      }, delay);
      
      return () => clearTimeout(timeout);
    }
  }, [autoFocus, delay]);

  useEffect(() => {
    if (focusOnError && error && ref.current) {
      const timeout = setTimeout(() => {
        if (ref.current && document.body.contains(ref.current)) {
          ref.current.focus();
          ref.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [error, focusOnError]);
}