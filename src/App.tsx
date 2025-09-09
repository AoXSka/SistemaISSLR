import React, { useState } from 'react';
import { useEffect } from 'react';
import { useLicense } from './hooks/useLicense';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import LedgerBook from './components/Modules/LedgerBook';
import PurchaseBook from './components/Modules/PurchaseBook';
import ISLRRetentions from './components/Modules/ISLRRetentions';
import IVARetentions from './components/Modules/IVARetentions';
import ProvidersManager from './components/Modules/ProvidersManager';
import VouchersManager from './components/Modules/VouchersManager';
import Reports from './components/Modules/Reports';
import FiscalCalendar from './components/Modules/FiscalCalendar';
import CompanySettingsModule from './components/Modules/CompanySettings';
import SystemSettings from './components/Modules/SystemSettings';
import LoginScreen from './components/Auth/LoginScreen';
import UserManagement from './components/Auth/UserManagement';
import LicenseValidator from './components/License/LicenseValidator';
import LoadingScreen from './components/UI/LoadingScreen';
import FirstRunWizard from './components/Setup/FirstRunWizard';
import { FiscalProvider } from './hooks/useFiscalConfig';
import { authService } from './services/authService';
import { syncService } from './services/syncService';
import { db } from './services/database-localStorage-backup';
import { supabase } from './config/database';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { license, isExpired, expiryWarning, refreshLicense } = useLicense();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);
  
  // Refresh license after authentication with delay
  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        try {
          refreshLicense();
        } catch (error) {
          console.error('Error refreshing license on auth:', error);
        }
      }, 1000);
    }
  }, [isAuthenticated]);

  /**
   * Verifica si el sistema está inicializado usando Supabase
   * para persistencia entre navegadores
   */
  const checkSystemInitialization = async (): Promise<boolean> => {
    try {
      console.log('🔍 Checking system initialization from cloud...');
      
      // Opción 1: Verificar si existe una empresa configurada
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id, rif, name')
        .limit(1)
        .maybeSingle();

      if (!companyError && companies && companies.rif) {
        console.log('✅ System initialized - Company found:', companies.name);
        // Sincronizar con localStorage para este navegador
        localStorage.setItem('system.first_run', 'false');
        localStorage.setItem('system.company_name', companies.name);
        return true;
      }

      // Opción 2: Verificar si hay usuarios administradores
      const { data: admins, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('role', 'admin')
        .eq('is_active', true)
        .limit(1);

      if (!userError && admins && admins.length > 0) {
        console.log('✅ System initialized - Admin user found:', admins[0].username);
        localStorage.setItem('system.first_run', 'false');
        return true;
      }

      // Opción 3: Verificar localStorage como fallback (para modo offline)
      const localFirstRun = localStorage.getItem('system.first_run');
      if (localFirstRun === 'false') {
        console.log('📦 System initialized (from local storage)');
        return true;
      }

      console.log('🆕 System not initialized - First run detected');
      return false;

    } catch (error) {
      console.error('⚠️ Error checking cloud initialization:', error);
      
      // Si hay error de red, confiar en localStorage
      const localFirstRun = localStorage.getItem('system.first_run');
      return localFirstRun === 'false';
    }
  };

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setInitError(null);
      
      // Initialize database
      await db.connect();
      
      // Check system initialization from cloud/database
      const isInitialized = await checkSystemInitialization();
      setIsFirstRun(!isInitialized);
      
      if (isInitialized) {
        // Check for existing session
        const session = authService.getCurrentSession();
        if (session?.isValid) {
          setCurrentUser(session.user);
          setIsAuthenticated(true);
          console.log('🔐 Existing session found for:', session.user.username);
        }
        
        // Initialize sync service
        await syncService.initializeOfflineMode();
      }
      
      console.log('🚀 App initialization complete', {
        isInitialized,
        isFirstRun: !isInitialized,
        hasSession: !!authService.getCurrentSession()
      });
      
    } catch (error) {
      console.error('App initialization error:', error);
      
      // Handle connection errors gracefully
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError')) {
        console.warn('⚠️ Network error - checking local state');
        
        // Use local state as fallback
        const localFirstRun = localStorage.getItem('system.first_run');
        setIsFirstRun(localFirstRun !== 'false');
        
        // Still check for local session
        const session = authService.getCurrentSession();
        if (session?.isValid) {
          setCurrentUser(session.user);
          setIsAuthenticated(true);
        }
      } else if (error.message?.includes('license')) {
        console.warn('License error during startup, continuing without license features');
      } else {
        setInitError('Error al inicializar la aplicación. Por favor, recargue la página.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (user: any) => {
    console.log('🎯 App.tsx - handleLoginSuccess called with user:', user);
    setCurrentUser(user);
    setIsAuthenticated(true);
    console.log('✅ App.tsx - Authentication state updated:', { user: user?.username, isAuthenticated: true });
  };

  const handleLogout = () => {
    console.log('👋 App.tsx - handleLogout called');
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveModule('dashboard');
    console.log('✅ App.tsx - Logout completed, redirecting to dashboard');
  };

  const handleFirstRunComplete = async () => {
    console.log('🎊 First run wizard completed');
    
    // Mark as initialized in localStorage
    localStorage.setItem('system.first_run', 'false');
    localStorage.setItem('system.setup_completed', new Date().toISOString());
    
    // The wizard should have created company and admin in database
    // which will be detected on next initialization check
    
    setIsFirstRun(false);
    setIsLoading(true);
    
    // Reload the app after setup to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'ledger':
        return <LedgerBook onNavigate={setActiveModule} />;
      case 'purchase':
        return <PurchaseBook onNavigate={setActiveModule} />;
      case 'islr':
        return <ISLRRetentions />;
      case 'iva':
        return <IVARetentions />;
      case 'providers':
        return <ProvidersManager />;
      case 'vouchers':
        return <VouchersManager />;
      case 'reports':
        return <Reports />;
      case 'calendar':
        return <FiscalCalendar />;
      case 'company':
        return <CompanySettingsModule />;
      case 'users':
        return <UserManagement />;
      case 'license':
        return <LicenseValidator />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading screen during initialization
  if (isLoading) {
    return <LoadingScreen message="Inicializando ContaVe Pro..." showProgress={true} progress={65} />;
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error de Inicialización</h3>
            <p className="text-sm text-gray-500 mb-4">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show first run wizard
  if (isFirstRun) {
    return <FirstRunWizard onComplete={handleFirstRunComplete} />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <FiscalProvider>
        <Sidebar 
          activeModule={activeModule} 
          setActiveModule={setActiveModule}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            currentUser={currentUser} 
            license={license}
            onLogout={handleLogout}
            onNavigate={setActiveModule}
          />
          
          {/* License Expiry Warning */}
          {expiryWarning && (
            <div className="bg-warning-500 text-white px-6 py-3 text-center font-medium">
              <span className="mr-2">⚠️</span>
              {expiryWarning.message}
            </div>
          )}
          
          <main className="flex-1 overflow-auto">
            {renderActiveModule()}
          </main>
        </div>
      </FiscalProvider>
    </div>
  );
}