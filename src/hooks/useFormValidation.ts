import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { validateForm, FormValidation } from '../utils/validators';

interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules: FormValidation;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialValuesRef = useRef(initialValues);
  const isInitialMount = useRef(true);

  // Initialize form with proper values handling
  useEffect(() => {
    // Only update if initialValues actually changed (deep comparison)
    const hasChanged = JSON.stringify(initialValues) !== JSON.stringify(initialValuesRef.current);
    
    if (isInitialMount.current || hasChanged) {
      console.log('🔄 useFormValidation - Initializing/updating form values:', {
        isInitialMount: isInitialMount.current,
        hasChanged,
        initialValues
      });
      
      setValues(initialValues);
      initialValuesRef.current = initialValues;
      isInitialMount.current = false;
      
      // Only clear errors/touched on mount, not on updates
      if (isInitialMount.current) {
        setErrors({});
        setTouched({});
      }
    }
  }, []); // Remove initialValues dependency to prevent infinite loops

  // Separate effect for handling prop changes (edit mode)
  useEffect(() => {
    if (!isInitialMount.current) {
      const hasChanged = JSON.stringify(initialValues) !== JSON.stringify(initialValuesRef.current);
      if (hasChanged) {
        console.log('🔄 useFormValidation - Props changed, updating form values');
        setValues(initialValues);
        initialValuesRef.current = initialValues;
      }
    }
  }, [initialValues]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }
  }, [errors]);

  const markTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [field as string]: true
    }));
  }, []);

  const validateField = useCallback((field: keyof T) => {
    const fieldRules = validationRules[field as string];
    if (!fieldRules) return;

    const value = values[field];
    let error = '';

    for (const rule of fieldRules) {
      if (!rule.validator(value)) {
        error = rule.message;
        break;
      }
    }

    setErrors(prev => ({
      ...prev,
      [field as string]: error
    }));

    return !error;
  }, [values, validationRules]);

  const validateAll = useCallback(() => {
    const validationErrors = validateForm(values, validationRules);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [values, validationRules]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateAll, onSubmit]);

  const reset = useCallback((newInitialValues?: T) => {
    const newValues = newInitialValues || initialValuesRef.current;
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    if (newInitialValues) {
      initialValuesRef.current = newInitialValues;
    }
    console.log('🔄 useFormValidation - Form reset to:', newValues);
  }, []);

  const getFieldError = useCallback((field: keyof T) => {
    return touched[field as string] ? errors[field as string] : '';
  }, [errors, touched]);

  const hasErrors = useMemo(() => 
    Object.values(errors).some(error => error !== ''), 
    [errors]
  );
  
  const isValid = useMemo(() => 
    !hasErrors && Object.keys(touched).length > 0, 
    [hasErrors, touched]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    hasErrors,
    setValue,
    markTouched,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    getFieldError
  };
}