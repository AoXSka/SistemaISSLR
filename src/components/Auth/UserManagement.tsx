import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useToast } from '../UI/Toast';
import { formatDate } from '../../utils/formatters';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Shield, 
  User, 
  Mail, 
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Settings,
  Key,
  Clock,
  Activity,
  UserCheck,
  UserX,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  Sparkles
} from 'lucide-react';

// Componente Toast mejorado
const Toast = ({ type, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />
  };

  const colors = {
    success: 'from-emerald-500 to-green-600',
    error: 'from-red-500 to-rose-600',
    warning: 'from-amber-500 to-orange-600'
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50 
      bg-gradient-to-r ${colors[type]} 
      text-white rounded-2xl p-4 pr-12
      shadow-2xl backdrop-blur-xl
      animate-slide-in min-w-[320px]
      border border-white/20
    `}>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
      >
        ×
      </button>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm mt-1 text-white/90">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Input Component mejorado
const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  className = '',
  error = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative group">
      {LeftIcon && (
        <LeftIcon className={`
          absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4
          ${error ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-400'}
          transition-colors duration-200
        `} />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2.5 
          ${LeftIcon ? 'pl-10' : ''}
          ${RightIcon ? 'pr-10' : ''}
          bg-white dark:bg-gray-800
          border-2 rounded-xl
          ${error 
            ? 'border-red-400 focus:border-red-500' 
            : isFocused 
              ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
              : 'border-gray-200 dark:border-gray-700'
          }
          focus:outline-none
          transition-all duration-200
          ${className}
        `}
      />
      {RightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
        >
          <RightIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Select Component mejorado
const Select = ({ value, onChange, options, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-2.5 pr-10
          bg-white dark:bg-gray-800
          border-2 border-gray-200 dark:border-gray-700
          rounded-xl
          focus:outline-none focus:border-blue-500
          transition-all duration-200
          text-left font-medium
          ${className}
        `}
      >
        {options.find(opt => opt.value === value)?.label || 'Seleccionar...'}
        <ChevronDown className={`
          absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400
          transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}
        `} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-40 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-fade-in">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange({ target: { value: option.value } });
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 text-left
                  transition-colors duration-150
                  ${value === option.value 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// FormField Component
const FormField = ({ label, error, children, required = false }) => (
  <div className="space-y-2">
    {label && (
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1 animate-shake">
        <AlertTriangle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
);

// Button Component mejorado
const Button = ({ 
  variant = 'primary', 
  size = 'md',
  loading = false, 
  icon: Icon, 
  children, 
  onClick,
  className = '',
  disabled = false
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
    danger: 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-xl
        transition-all duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${loading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}
        ${className}
      `}
    >
      {loading ? (
        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : Icon && (
        <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  );
};

// Modal Component mejorado
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform animate-scale-in">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// StatusBadge Component
const StatusBadge = ({ status, text, size = 'md' }) => {
  const colors = {
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5'
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-semibold rounded-full
      ${colors[status]}
      ${sizes[size]}
    `}>
      <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
      {text}
    </span>
  );
};

// StatsCard Component
const StatsCard = ({ icon: Icon, title, value, subtitle, color = 'blue', trend }) => {
  const colors = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-green-600',
    amber: 'from-amber-500 to-orange-600',
    purple: 'from-purple-500 to-pink-600'
  };
  
  return (
    <div className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color]} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br ${colors[color]} rounded-xl shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">
          {value}
        </p>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          {title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

// DataTable Component mejorado
const DataTable = ({ data, columns, loading }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center gap-3">
          <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 font-medium">Cargando usuarios...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            {columns.map(column => (
              <th 
                key={column.key}
                className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => (
            <tr 
              key={record.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              {columns.map(column => (
                <td key={column.key} className="px-6 py-4">
                  {column.render ? column.render(record[column.key], record) : record[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay usuarios registrados</p>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const userList = await authService.getUsers();
      setUsers(userList);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    console.log('✏️ UserManagement - Editing user:', user);
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: '',
      confirmPassword: '',
      role: user.role
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!userForm.username || userForm.username.length < 3) {
      errors.username = 'Mínimo 3 caracteres';
    }

    if (!userForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
      errors.email = 'Email inválido';
    }

    if (!userForm.fullName || userForm.fullName.length < 3) {
      errors.fullName = 'Mínimo 3 caracteres';
    }

    if (!editingUser) {
      if (!userForm.password || userForm.password.length < 8) {
        errors.password = 'Mínimo 8 caracteres';
      }

      if (userForm.password !== userForm.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('💾 UserManagement - Submitting user form:', { isEditing: !!editingUser, userId: editingUser?.id });
      
      const result = editingUser 
        ? await authService.updateUser(editingUser.id, userForm)
        : await authService.createUser(userForm);
      
      if (result.success) {
        addToast({
          type: 'success',
          title: editingUser ? 'Usuario actualizado' : 'Usuario creado',
          message: `${userForm.fullName} ha sido ${editingUser ? 'actualizado' : 'registrado'} exitosamente`
        });
        await loadUsers();
        setShowUserModal(false);
        setEditingUser(null);
      }
    } catch (error) {
      console.error('❌ UserManagement - Submit error:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Ocurrió un error inesperado'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`¿Está seguro de eliminar el usuario "${user.fullName}"? Esta acción no se puede deshacer.`)) return;

    try {
      const result = await authService.deleteUser(userId);
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Usuario eliminado',
          message: `${user.fullName} ha sido eliminado`
        });
        await loadUsers();
      } else {
        addToast({
          type: 'error',
          title: 'Error al eliminar',
          message: result.error || 'No se pudo eliminar el usuario'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el usuario'
      });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'user': return 'info';
      case 'readonly': return 'warning';
      default: return 'neutral';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'user': return 'Usuario';
      case 'readonly': return 'Solo Lectura';
      default: return role;
    }
  };

  const columns = [
    {
      key: 'fullName',
      title: 'Usuario',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-lg">
                {record.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            {record.isActive && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {record.fullName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{record.username}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Contacto',
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{record.email}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {record.department}
          </div>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Rol',
      render: (_, record) => (
        <StatusBadge
          status={getRoleColor(record.role)}
          text={getRoleText(record.role)}
          size="sm"
        />
      )
    },
    {
      key: 'activity',
      title: 'Actividad',
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {record.loginCount} sesiones
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Último: {formatDate(record.lastLogin)}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Estado',
      render: (_, record) => (
        <StatusBadge
          status={record.isActive ? 'success' : 'neutral'}
          text={record.isActive ? 'Activo' : 'Inactivo'}
          size="sm"
        />
      )
    },
    {
      key: 'actions',
      title: 'Acciones',
      render: (_, record) => (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(record)}
            icon={Edit3}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(record.id)}
            icon={Trash2}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          />
        </div>
      )
    }
  ];

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'user', label: 'Usuario' },
    { value: 'readonly', label: 'Solo Lectura' }
  ];

  const filteredUsers = (users || []).filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header Enhanced */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                  Gestión de Usuarios
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Control de acceso y permisos del sistema
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              loading={refreshing}
              icon={RefreshCw}
              className={refreshing ? 'animate-spin' : ''}
            >
              Actualizar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateUser}
              icon={Plus}
            >
              Nuevo Usuario
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Users}
          title="Total Usuarios"
          value={users.length}
          subtitle="Registrados en el sistema"
          color="blue"
          trend={12}
        />
        <StatsCard
          icon={UserCheck}
          title="Usuarios Activos"
          value={users.filter(u => u.isActive).length}
          subtitle="Habilitados actualmente"
          color="green"
          trend={8}
        />
        <StatsCard
          icon={Shield}
          title="Administradores"
          value={users.filter(u => u.role === 'admin').length}
          subtitle="Con permisos completos"
          color="purple"
        />
        <StatsCard
          icon={Activity}
          title="Actividad Hoy"
          value={users.filter(u => u.lastLogin && new Date(u.lastLogin).toDateString() === new Date().toDateString()).length}
          subtitle="Conexiones del día"
          color="amber"
          trend={-5}
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Lista de Usuarios
              </h2>
              <StatusBadge
                status="info"
                text={`${filteredUsers.length} usuarios`}
                size="sm"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar usuarios..."
                  className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 transition-colors min-w-[250px]"
                />
              </div>
              <Button
                variant="secondary"
                icon={Filter}
                size="sm"
              >
                Filtros
              </Button>
              <Button
                variant="secondary"
                icon={Download}
                size="sm"
              >
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <DataTable
          data={filteredUsers}
          columns={columns}
          loading={loading}
        />
      </div>

      {/* User Form Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              {editingUser ? <Edit3 className="h-5 w-5 text-white" /> : <UserCheck className="h-5 w-5 text-white" />}
            </div>
            <span>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre Completo" required error={formErrors.fullName}>
              <Input
                value={userForm.fullName}
                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                placeholder="Juan Pérez"
                leftIcon={User}
                error={!!formErrors.fullName}
              />
            </FormField>

            <FormField label="Usuario" required error={formErrors.username}>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="jperez"
                leftIcon={UserCheck}
                error={!!formErrors.username}
              />
            </FormField>

            <FormField label="Email" required error={formErrors.email}>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="juan@empresa.com"
                leftIcon={Mail}
                error={!!formErrors.email}
              />
            </FormField>

            <FormField label="Rol">
              <Select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                options={roleOptions}
              />
            </FormField>

            <FormField 
              label={editingUser ? "Nueva Contraseña" : "Contraseña"} 
              required={!editingUser}
              error={formErrors.password}
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder={editingUser ? "Opcional" : "Mínimo 8 caracteres"}
                leftIcon={Key}
                rightIcon={showPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowPassword(!showPassword)}
                error={!!formErrors.password}
              />
            </FormField>

            <FormField 
              label="Confirmar Contraseña" 
              required={!editingUser}
              error={formErrors.confirmPassword}
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                value={userForm.confirmPassword}
                onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                placeholder="Repetir contraseña"
                leftIcon={Key}
                error={!!formErrors.confirmPassword}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="ghost"
              onClick={() => setShowUserModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant={editingUser ? 'success' : 'primary'}
              onClick={handleSubmit}
              loading={loading}
              icon={editingUser ? CheckCircle2 : Plus}
            >
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}