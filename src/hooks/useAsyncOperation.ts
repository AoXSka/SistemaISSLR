import { useState, useCallback } from 'react';
import { useToast } from '../components/UI/Toast';
import { performanceService } from '../services/performanceService';

interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  trackPerformance?: boolean;
}

export function useAsyncOperation<T = any>(
  options: UseAsyncOperationOptions<T> = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { addToast } = useToast();

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    const startTime = options.trackPerformance ? Date.now() : 0;
    
    try {
      performanceService.recordRequest();
      
      const result = await asyncFn();
      setData(result);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      if (options.successMessage) {
        addToast({
          type: 'success',
          title: 'Operación Exitosa',
          message: options.successMessage
        });
      }
      
      // Record performance metrics
      if (options.trackPerformance && startTime > 0) {
        const duration = Date.now() - startTime;
        performanceService.recordResponseTime(duration);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido');
      setError(error);
      
      performanceService.recordError();
      
      if (options.onError) {
        options.onError(error);
      }
      
      if (options.errorMessage || !options.onError) {
        addToast({
          type: 'error',
          title: 'Error en la Operación',
          message: options.errorMessage || error.message
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [options, addToast]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
}