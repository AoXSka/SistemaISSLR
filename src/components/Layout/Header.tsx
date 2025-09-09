import React from 'react';
import { useToast } from '../UI/Toast';
import { Search, User, Settings, LogOut, Globe, Shield, HelpCircle } from 'lucide-react';
import ThemeToggle from '../UI/ThemeToggle';
import NotificationCenter from '../UI/NotificationCenter';

interface HeaderProps {
  currentUser?: any;
  onLogout?: () => void;
  onNavigate?: (module: string) => void;
}

export default function Header({ currentUser, onLogout, onNavigate }: HeaderProps) {
  const { addToast } = useToast();

  const handleUserMenuItemClick = (action: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    switch (action) {
      case 'settings':
        if (onNavigate) {
          onNavigate('settings');
          addToast({
            type: 'info',
            title: 'Configuración',
            message: 'Accediendo a configuración del sistema'
          });
        }
        break;
      case 'support':
        window.open('https://contavepro.com/soporte', '_blank');
        addToast({
          type: 'info',
          title: 'Soporte Técnico',
          message: 'Abriendo portal de soporte en nueva ventana'
        });
        break;
      case 'logout':
        if (confirm('¿Está seguro que desea cerrar la sesión?')) {
          addToast({
            type: 'info',
            title: 'Cerrando Sesión',
            message: 'Hasta pronto, que tenga un buen día'
          });
          setTimeout(() => {
            onLogout?.();
          }, 1000);
        }
        break;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-700/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-lg">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-accent-500/5"></div>

      <div className="relative px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search Section */}
          <div className="flex items-center flex-1 max-w-2xl">
            <div className="relative w-full group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Buscar transacciones, proveedores, comprobantes..."
                className="relative w-full pl-12 pr-6 py-3.5 text-sm bg-white/90 dark:bg-neutral-800/90 border-2 border-neutral-200 dark:border-neutral-600 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-lg backdrop-blur-sm font-medium"
              />

              {/* Search Enhancement Visual */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200">
                <div className="px-2 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-bold rounded border">
                  Enter
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* System Status */}
            <div className="hidden md:flex items-center space-x-3 px-4 py-2 glass-card">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-100">Online</span>
              </div>
              <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600"></div>
              <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">Seguro</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <NotificationCenter />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <div className="flex items-center space-x-4 border-l border-neutral-300/50 dark:border-neutral-600/50 pl-6">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {currentUser?.fullName || 'Usuario'}
                </p>
                <div className="flex items-center justify-end space-x-2 mt-1">
                  <div className="w-2 h-2 bg-venezuela-flag rounded-full shadow-sm"></div>
                  <p className="text-xs text-success-600 dark:text-success-400 font-bold tracking-wide uppercase">
                    {currentUser?.role || 'USER'}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <button className="relative p-3 bg-gradient-to-br from-primary-600 to-accent-600 text-white rounded-xl shadow-lg hover:shadow-2xl hover:from-primary-700 hover:to-accent-700 transition-all duration-200 transform hover:scale-105 group-hover:rotate-3">
                  <User className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                </button>

                {/* Dropdown Menu Premium */}
                <div className="absolute right-0 top-full mt-3 w-64 glass-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 border border-neutral-200/50 dark:border-neutral-700/50">
                  <div className="p-4">
                    {/* User Info */}
                    <div className="pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {currentUser?.fullName || 'Usuario'}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {currentUser?.email || 'usuario@empresa.com'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Licencia</span>
                        <span className="px-3 py-1 bg-gradient-to-r from-success-100 to-success-50 text-success-800 text-xs font-bold rounded-full border border-success-200 shadow-sm">
                          Enterprise
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                      <button 
                        onClick={(e) => handleUserMenuItemClick('settings', e)}
                        className="w-full flex items-center px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all duration-200 font-medium group"
                        aria-label="Abrir configuración del sistema"
                      >
                        <div className="p-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg mr-3 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors duration-200">
                          <Settings className="h-4 w-4" />
                        </div>
                        Configuración
                      </button>

                      <button 
                        onClick={(e) => handleUserMenuItemClick('support', e)}
                        className="w-full flex items-center px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-all duration-200 font-medium group"
                        aria-label="Abrir soporte técnico"
                      >
                        <div className="p-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg mr-3 group-hover:bg-accent-100 dark:group-hover:bg-accent-900/50 transition-colors duration-200">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        Soporte
                      </button>

                      <hr className="my-2 border-neutral-200 dark:border-neutral-700" />

                      <button 
                        onClick={(e) => handleUserMenuItemClick('logout', e)}
                        aria-label="Cerrar sesión"
                        className="w-full flex items-center px-3 py-2.5 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-all duration-200 font-medium group"
                      >
                        <div className="p-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg mr-3 group-hover:bg-error-100 dark:group-hover:bg-error-900/50 transition-colors duration-200">
                          <LogOut className="h-4 w-4" />
                        </div>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}