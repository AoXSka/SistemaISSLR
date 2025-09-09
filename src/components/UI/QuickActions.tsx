import React from 'react';
import { Plus, Download, FileText, Receipt, Calculator, Calendar } from 'lucide-react';
import Button from './Button';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'accent' | 'success' | 'warning';
  onClick: () => void;
  shortcut?: string;
}

interface QuickActionsProps {
  onNewISLR?: () => void;
  onNewIVA?: () => void;
  onGenerateReport?: () => void;
  onViewCalendar?: () => void;
  onNavigate?: (module: string) => void;
  className?: string;
}

export default function QuickActions({
  onNewISLR,
  onNewIVA,
  onGenerateReport,
  onViewCalendar,
  onNavigate,
  className = ''
}: QuickActionsProps) {
  const handleAction = (action: string, module?: string) => {
    switch (action) {
      case 'new-islr':
        if (onNewISLR) {
          onNewISLR();
        } else if (onNavigate) {
          onNavigate('islr');
        }
        break;
      case 'new-iva':
        if (onNewIVA) {
          onNewIVA();
        } else if (onNavigate) {
          onNavigate('iva');
        }
        break;
      case 'generate-report':
        if (onGenerateReport) {
          onGenerateReport();
        } else if (onNavigate) {
          onNavigate('reports');
        }
        break;
      case 'view-calendar':
        if (onViewCalendar) {
          onViewCalendar();
        } else if (onNavigate) {
          onNavigate('calendar');
        }
        break;
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-islr',
      label: 'Nueva Retención ISLR',
      icon: Receipt,
      color: 'primary',
      onClick: () => handleAction('new-islr'),
      shortcut: 'Ctrl+I'
    },
    {
      id: 'new-iva',
      label: 'Nueva Retención IVA',
      icon: FileText,
      color: 'accent',
      onClick: () => handleAction('new-iva'),
      shortcut: 'Ctrl+V'
    },
    {
      id: 'generate-report',
      label: 'Generar Reporte',
      icon: Download,
      color: 'success',
      onClick: () => handleAction('generate-report'),
      shortcut: 'Ctrl+R'
    },
    {
      id: 'fiscal-calendar',
      label: 'Calendario Fiscal',
      icon: Calendar,
      color: 'warning',
      onClick: () => handleAction('view-calendar'),
      shortcut: 'Ctrl+F'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700';
      case 'accent':
        return 'from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700';
      case 'success':
        return 'from-success-500 to-success-600 hover:from-success-600 hover:to-success-700';
      case 'warning':
        return 'from-warning-500 to-warning-600 hover:from-warning-600 hover:to-warning-700';
      default:
        return 'from-primary-500 to-primary-600';
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'i':
            event.preventDefault();
            handleAction('new-islr');
            break;
          case 'v':
            event.preventDefault();
            handleAction('new-iva');
            break;
          case 'r':
            event.preventDefault();
            handleAction('generate-report');
            break;
          case 'f':
            event.preventDefault();
            handleAction('view-calendar');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const colorClasses = getColorClasses(action.color);
          
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`
                group relative p-6 bg-gradient-to-br ${colorClasses} 
                text-white rounded-xl shadow-lg hover:shadow-xl 
                transform hover:scale-105 transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              `}
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all duration-200">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">{action.label}</p>
                  {action.shortcut && (
                    <p className="text-xs opacity-75 mt-1">{action.shortcut}</p>
                  )}
                </div>
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-200" />
            </button>
          );
        })}
      </div>
    </div>
  );
}