import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Home, 
  BookOpen, 
  Receipt, 
  FileText, 
  Users, 
  TrendingUp,
  Settings,
  Calculator,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Key,
  AlertCircle,
  Shield,
  Activity,
  Bell,
  Sparkles,
  Zap,
  Globe,
  LogOut,
  HelpCircle,
  ChevronDown,
  Menu,
  book,
  X,
  Layers,
  Database,
  Cpu,
  User
} from 'lucide-react';

// Notification Badge Component
const NotificationBadge = ({ value, type = 'default', pulse = false }) => {
  const types = {
    default: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600'
  };
  
  if (!value) return null;
  
  return (
    <div className="absolute -top-1 -right-1 z-10">
      <div className={`
        relative min-w-[20px] h-[20px] px-1.5
        ${types[type]}
        text-white text-[10px] font-black rounded-full 
        flex items-center justify-center
        shadow-lg border-2 border-white dark:border-gray-900
        ${pulse ? 'animate-pulse' : ''}
      `}>
        {value}
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-white opacity-30 animate-ping" />
        )}
      </div>
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ 
  item, 
  isActive, 
  isCollapsed, 
  onClick, 
  loadingBadges 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;
  
  return (
    <li className="relative">
      <button
        data-module={item.id}
        onClick={() => onClick(item.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative w-full flex items-center rounded-2xl
          transition-all duration-300 ease-out group
          ${isActive 
            ? 'bg-gradient-to-r from-white/25 to-white/15 shadow-2xl scale-[1.02] border border-white/30' 
            : 'hover:bg-white/10 hover:scale-[1.01]'
          }
          ${isCollapsed ? 'justify-center p-3' : 'justify-start px-4 py-3.5'}
        `}
      >
        {/* Active Indicator */}
        {isActive && (
          <>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-yellow-400 via-blue-400 to-red-400 rounded-r-full shadow-lg animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl" />
          </>
        )}
        
        {/* Hover Effect */}
        <div className={`
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
          bg-gradient-to-r from-white/5 to-white/10 
          transition-opacity duration-300
        `} />
        
        {/* Icon Container */}
        <div className="relative z-10 flex items-center">
          <div className={`
            relative p-2.5 rounded-xl
            ${isActive 
              ? 'bg-gradient-to-br from-blue-500/30 to-indigo-600/30 shadow-lg' 
              : 'group-hover:bg-white/10'
            }
            transition-all duration-300
            ${isHovered && !isActive ? 'rotate-3 scale-110' : ''}
          `}>
            <Icon className={`
              h-5 w-5 
              ${isActive ? 'text-white drop-shadow-lg' : 'text-gray-300 group-hover:text-white'}
              transition-all duration-300
            `} />
            
            {/* Badge */}
            {item.badge && !loadingBadges && (
              <NotificationBadge 
                value={item.badge} 
                type={item.badgeType || 'default'}
                pulse={item.badgePulse}
              />
            )}
            
            {/* Loading Badge */}
            {loadingBadges && item.showLoadingBadge && (
              <div className="absolute -top-1 -right-1 w-4 h-4">
                <div className="w-full h-full border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          {/* Label */}
          {!isCollapsed && (
            <span className={`
              ml-3 text-sm font-semibold tracking-wide
              ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}
              transition-colors duration-300
            `}>
              {item.label}
            </span>
          )}
        </div>
        
        {/* Right Arrow for Active */}
        {!isCollapsed && isActive && (
          <ChevronRight className="ml-auto h-4 w-4 text-white/60 animate-pulse" />
        )}
      </button>
      
      {/* Tooltip for Collapsed State */}
      {isCollapsed && isHovered && (
        <div className={`
          absolute left-20 top-1/2 -translate-y-1/2 z-50
          px-4 py-2.5 bg-gray-900 text-white rounded-xl
          text-sm font-semibold whitespace-nowrap
          shadow-2xl border border-gray-700
          animate-fade-in pointer-events-none
          before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2
          before:border-8 before:border-transparent before:border-r-gray-900
        `}>
          {item.label}
          {item.badge && (
            <span className={`
              ml-2 px-2 py-0.5 text-xs rounded-full
              ${item.badgeType === 'danger' ? 'bg-red-500' : 
                item.badgeType === 'warning' ? 'bg-amber-500' : 
                'bg-blue-500'}
            `}>
              {item.badge}
            </span>
          )}
        </div>
      )}
    </li>
  );
};

// System Status Widget
const SystemStatus = ({ isCollapsed }) => {
  const [status, setStatus] = useState('online');
  const [lastSync, setLastSync] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  if (isCollapsed) {
    return (
      <div className="flex justify-center">
        <div className={`
          w-3 h-3 rounded-full animate-pulse
          ${status === 'online' ? 'bg-green-400' : 'bg-amber-400'}
        `} />
      </div>
    );
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`
            w-2.5 h-2.5 rounded-full
            ${status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}
          `} />
          <span className="text-xs font-semibold text-gray-300">
            Sistema {status === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
        <Activity className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">CPU</span>
          <span className="text-gray-300 font-semibold">24%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full w-1/4 animate-pulse" />
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Memoria</span>
          <span className="text-gray-300 font-semibold">58%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-1.5 rounded-full w-[58%]" />
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Última sincronización</span>
          <span className="text-gray-300">
            {lastSync.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

// Main Sidebar Component
export default function Sidebar({ 
  activeModule = 'dashboard', 
  setActiveModule = () => {}, 
  isCollapsed: initialCollapsed = false, 
  setIsCollapsed: setCollapsedProp = () => {} 
}) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [badges, setBadges] = useState({});
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const sidebarRef = useRef(null);

  // Enhanced menu items with categories
  const menuSections = [
    {
      title: 'Principal',
      items: [
        { 
          id: 'dashboard', 
          label: 'Dashboard Ejecutivo', 
          icon: Home, 
          badge: null 
        },
        { 
          id: 'calendar', 
          label: 'Calendario Fiscal', 
          icon: Calendar, 
          badge: badges.calendar,
          badgeType: 'warning',
          badgePulse: true
        }
      ]
    },
    {
      title: 'Contabilidad',
      items: [
        { 
          id: 'ledger', 
          label: 'Libro Mayor', 
          icon: BookOpen, 
          badge: badges.ledger
        },
        { 
          id: 'purchase', 
          label: 'Libro de Compras', 
          icon: BookOpen, 
          badge: badges.book
        },
        { 
          id: 'vouchers', 
          label: 'Comprobantes', 
          icon: Calculator, 
          badge: badges.vouchers,
          badgeType: 'danger'
        },
        { 
          id: 'reports', 
          label: 'Reportes', 
          icon: TrendingUp, 
          badge: null 
        }
      ]
    },
    {
      title: 'Retenciones',
      items: [
        { 
          id: 'islr', 
          label: 'Retenciones ISLR', 
          icon: Receipt, 
          badge: badges.islr,
          badgeType: 'warning'
        },
        { 
          id: 'iva', 
          label: 'Retenciones IVA', 
          icon: FileText, 
          badge: badges.iva,
          badgeType: 'warning'
        }
      ]
    },
    {
      title: 'Gestión',
      items: [
        { 
          id: 'providers', 
          label: 'Proveedores', 
          icon: Users, 
          badge: badges.providers 
        },
        { 
          id: 'company', 
          label: 'Empresa', 
          icon: Building2, 
          badge: null 
        }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { 
          id: 'users', 
          label: 'Usuarios', 
          icon: Shield, 
          badge: badges.users 
        },
        { 
          id: 'license', 
          label: 'Licencias', 
          icon: Key, 
          badge: badges.license,
          badgeType: 'success'
        },
        { 
          id: 'settings', 
          label: 'Configuración', 
          icon: Settings, 
          badge: null 
        }
      ]
    }
  ];

  // Load badge counts
  const loadBadgeCounts = useCallback(async () => {
    setLoadingBadges(true);
    try {
      // Load real badge counts from services
      const { transactionService } = await import('../../services/transactionService');
      const { voucherService } = await import('../../services/voucherService');
      
      const pendingISLR = await transactionService.getTransactions({ 
        type: 'ISLR', 
        status: 'PENDING' 
      });
      
      const pendingIVA = await transactionService.getTransactions({ 
        type: 'IVA', 
        status: 'PENDING' 
      });
      
      const pendingVouchers = await voucherService.getVouchers({ 
        emailSent: false 
      });
      
      // Calculate fiscal calendar alerts
      const today = new Date();
      const day = today.getDate();
      const calendarAlerts = (day >= 10 && day <= 20) ? 1 : 0;
      
      const newBadges = {
        islr: pendingISLR.length > 0 ? pendingISLR.length.toString() : null,
        iva: pendingIVA.length > 0 ? pendingIVA.length.toString() : null,
        vouchers: pendingVouchers.length > 0 ? pendingVouchers.length.toString() : null,
        calendar: calendarAlerts > 0 ? calendarAlerts.toString() : null,
        license: '✓'
      };
      
      setBadges(newBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
      setBadges({});
    } finally {
      setLoadingBadges(false);
    }
  }, []);

  useEffect(() => {
    loadBadgeCounts();
    const interval = setInterval(loadBadgeCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadBadgeCounts]);

  // Handle module click
  const handleModuleClick = useCallback((moduleId) => {
    setActiveModule(moduleId);
    setShowMobileMenu(false);
    
    // Visual feedback
    const button = document.querySelector(`[data-module="${moduleId}"]`);
    if (button) {
      button.classList.add('animate-pulse');
      setTimeout(() => button.classList.remove('animate-pulse'), 300);
    }
  }, [setActiveModule]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    setCollapsedProp(newState);
    localStorage.setItem('sidebar-collapsed', newState.toString());
  }, [isCollapsed, setCollapsedProp]);

  // Load saved state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
      setCollapsedProp(true);
    }
  }, [setCollapsedProp]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="fixed top-4 left-4 z-50 p-3 bg-gray-900 rounded-xl shadow-xl lg:hidden"
      >
        {showMobileMenu ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
      </button>
      
      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900
          transition-all duration-500 ease-out
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          min-h-screen flex flex-col
          shadow-2xl border-r border-gray-700/50
        `}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute -bottom-8 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        </div>
        
        {/* Header */}
        <div className="relative p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white">
                    ContaVe Pro
                  </h1>
                  <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">
                    Enterprise v2.0
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
            
            <button
              onClick={toggleSidebar}
              className={`
                p-2 rounded-xl hover:bg-white/10 
                transition-all duration-300 group
                ${isCollapsed ? 'mx-auto' : ''}
              `}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
              )}
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {menuSections.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? 'mt-6' : ''}>
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              {isCollapsed && idx > 0 && (
                <div className="my-3 mx-auto w-8 h-px bg-gray-700" />
              )}
              <ul className="space-y-1">
                {section.items.map(item => (
                  <MenuItem
                    key={item.id}
                    item={{
                      ...item,
                      showLoadingBadge: ['islr', 'iva', 'vouchers', 'calendar'].includes(item.id)
                    }}
                    isActive={activeModule === item.id}
                    isCollapsed={isCollapsed}
                    onClick={handleModuleClick}
                    loadingBadges={loadingBadges}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
        
        {/* System Status */}
        <div className="p-4 border-t border-gray-700/50">
          <SystemStatus isCollapsed={isCollapsed} />
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50">
          {!isCollapsed ? (
            <div className="text-center space-y-3">
              <div className="flex justify-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <div className="w-2 h-2 bg-red-400 rounded-full" />
              </div>
              <div className="text-xs text-gray-500">
                <p className="font-semibold">© 2024 Celestial Current Solutions</p>
                <p>Todos los derechos reservados</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </aside>
      
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}