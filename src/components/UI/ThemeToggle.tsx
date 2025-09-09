import React from 'react';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Modo Claro', color: 'text-amber-500' },
    { value: 'dark' as const, icon: Moon, label: 'Modo Oscuro', color: 'text-blue-400' },
    { value: 'auto' as const, icon: Monitor, label: 'Automático', color: 'text-neutral-500' }
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative group">
      <button className="relative p-3 rounded-xl glass-card hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-neutral-200/50 dark:border-neutral-700/50">
        {/* Background Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
        
        <div className="relative">
          {resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5 text-blue-400 drop-shadow-sm" />
          ) : (
            <Sun className="h-5 w-5 text-amber-500 drop-shadow-sm" />
          )}
        </div>
        
        {/* Active Theme Indicator */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full shadow-lg animate-pulse border border-white dark:border-neutral-800"></div>
      </button>
      
      {/* Premium Dropdown */}
      <div className="absolute right-0 top-full mt-3 w-56 glass-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 border border-neutral-200/50 dark:border-neutral-700/50">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-700">
            <Palette className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Tema</span>
          </div>
          
          {/* Theme Options */}
          <div className="space-y-1">
            {themes.map(({ value, icon: Icon, label, color }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`
                  w-full flex items-center px-3 py-3 text-sm rounded-lg transition-all duration-200 font-medium group/item
                  ${theme === value 
                    ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-800 dark:from-primary-900/50 dark:to-primary-800/30 dark:text-primary-200 shadow-md border border-primary-200 dark:border-primary-700' 
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg mr-3 transition-all duration-200
                  ${theme === value 
                    ? 'bg-white/80 shadow-sm' 
                    : 'bg-neutral-100 dark:bg-neutral-700 group-hover/item:bg-neutral-200 dark:group-hover/item:bg-neutral-600'
                  }
                `}>
                  <Icon className={`h-4 w-4 ${theme === value ? color : 'text-neutral-500 dark:text-neutral-400'}`} />
                </div>
                
                <div className="flex-1 text-left">
                  <p className="font-semibold">{label}</p>
                  {value === 'auto' && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Sigue el sistema operativo
                    </p>
                  )}
                </div>
                
                {theme === value && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full animate-pulse shadow-sm"></div>
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-bold">Activo</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Footer */}
          <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center font-medium">
              Diseño Enterprise con identidad venezolana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}