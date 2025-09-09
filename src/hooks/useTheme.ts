import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
}

export const useTheme = () => {
  const [themeState, setThemeState] = useState<ThemeState>(() => {
    const savedTheme = localStorage.getItem('contave-theme') as Theme || 'auto';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolvedTheme = savedTheme === 'auto' ? systemTheme : savedTheme;
    
    return {
      theme: savedTheme,
      resolvedTheme,
      systemTheme
    };
  });

  // Aplicar tema al documento
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  // Establecer tema
  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem('contave-theme', newTheme);
    
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const resolvedTheme = newTheme === 'auto' ? systemTheme : newTheme;
    
    setThemeState({
      theme: newTheme,
      resolvedTheme,
      systemTheme
    });

    applyTheme(resolvedTheme);
  }, [applyTheme]);

  // Alternar entre claro y oscuro
  const toggleTheme = useCallback(() => {
    const newTheme = themeState.resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [themeState.resolvedTheme, setTheme]);

  // Escuchar cambios del tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      
      setThemeState(prev => {
        const resolvedTheme = prev.theme === 'auto' ? newSystemTheme : prev.resolvedTheme;
        if (prev.theme === 'auto') {
          applyTheme(resolvedTheme);
        }
        
        return {
          ...prev,
          systemTheme: newSystemTheme,
          resolvedTheme
        };
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [applyTheme]);

  // Aplicar tema al montar
  useEffect(() => {
    applyTheme(themeState.resolvedTheme);
  }, [themeState.resolvedTheme, applyTheme]);

  return {
    theme: themeState.theme,
    resolvedTheme: themeState.resolvedTheme,
    systemTheme: themeState.systemTheme,
    setTheme,
    toggleTheme,
    isDark: themeState.resolvedTheme === 'dark',
    isLight: themeState.resolvedTheme === 'light',
    isAuto: themeState.theme === 'auto'
  };
};

export default useTheme;