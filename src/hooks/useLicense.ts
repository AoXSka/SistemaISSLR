import { useState, useEffect, useCallback, useMemo } from 'react';
import { licenseService, LicenseData } from '../services/licenseService';
import { licenseGuard } from '../utils/licenseGuard';

export function useLicense() {
  const [license, setLicense] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Define loadLicense as useCallback to make it reusable
  const loadLicense = useCallback(async () => {
    try {
      // Add timeout to prevent blocking
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('License loading timeout')), 5000)
      );
      
      const licensePromise = new Promise<LicenseData | null>((resolve) => {
        try {
          const currentLicense = licenseService.getCurrentLicense();
          resolve(currentLicense);
        } catch (error) {
          console.error('Error getting current license:', error);
          resolve(null);
        }
      });
      
      const currentLicense = await Promise.race([licensePromise, timeoutPromise]) as LicenseData | null;
      
      setLicense(currentLicense);
      
      if (currentLicense) {
        console.log('📄 License loaded successfully');
      }
    } catch (error) {
      console.error('❌ License loading error:', error);
      setError('Error loading license');
      setLicense(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Single initialization effect to prevent loops
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      loadLicense();
    }
  }, [initialized, loadLicense]);

  const refreshLicense = useCallback(async () => {
    try {
      await licenseService.refreshLicense();
      await loadLicense();
    } catch (error) {
      console.error('Error refreshing license:', error);
    }
  }, [loadLicense]);

  // Memoize expensive calculations
  const isActive = useMemo(() => {
    return !!license && !licenseService.isExpired();
  }, [license]);

  const isExpired = useMemo(() => {
    return licenseService.isExpired();
  }, [license]);

  const remainingDays = useMemo(() => {
    return licenseService.getRemainingDays();
  }, [license]);

  const usageStats = useMemo(() => {
    return licenseService.getUsageStats();
  }, [license]);

  const features = useMemo(() => {
    return license ? licenseService.getLicenseFeatures(license.license.type) : [];
  }, [license]);

  const expiryWarning = useMemo(() => {
    return licenseService.getExpiryWarning();
  }, [license, remainingDays]);

  // Safe permission methods with error handling
  const canAccess = useCallback((feature: string) => {
    try {
      return licenseService.hasFeature(feature);
    } catch (error) {
      console.error('Error checking feature access:', feature, error);
      return false;
    }
  }, [license]);

  const canCreateRecords = useCallback(() => {
    try {
      return licenseService.canCreateRecords();
    } catch (error) {
      console.error('Error checking record creation permission:', error);
      return false;
    }
  }, [license]);

  const canAddUsers = useCallback(() => {
    try {
      return licenseService.canAddUsers();
    } catch (error) {
      console.error('Error checking user creation permission:', error);
      return false;
    }
  }, [license]);

  return {
    license,
    loading,
    error,
    isActive,
    isExpired,
    isNearExpiry: remainingDays <= 30 && remainingDays > 0,
    remainingDays,
    usageStats,
    features,
    expiryWarning,
    
    // Permission methods
    canAccess,
    canCreateRecords,
    canAddUsers,
    
    // Actions
    refreshLicense,
    reload: loadLicense
  };
}

export function useLicenseProtection(requiredFeature: string) {
  const license = useLicense();
  
  // Memoize to prevent unnecessary recalculations
  const canAccess = useMemo(() => license.canAccess(requiredFeature), [license.license, requiredFeature]);
  const blockedMessage = useMemo(() => canAccess ? '' : `Esta función requiere licencia válida: ${requiredFeature}`, [canAccess, requiredFeature]);
  
  return {
    ...license,
    canAccess,
    blockedMessage
  };
}