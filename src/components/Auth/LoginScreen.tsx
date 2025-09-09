import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Shield, 
  Globe, 
  Mail, 
  UserCheck, 
  Sparkles,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { authService, LoginCredentials, RegisterData } from '../../services/authService';
import { syncService } from '../../services/syncService';
import { useToast } from '../UI/Toast';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const { addToast } = useToast();

  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    username: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState<RegisterData>({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'admin' // First user should be admin
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const switchMode = (newMode: 'login' | 'register') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setErrors({});
      setIsTransitioning(false);
    }, 300);
  };

  const validateLogin = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!loginForm.username?.trim()) {
      newErrors.username = 'El nombre de usuario es obligatorio';
    }
    
    if (!loginForm.password?.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!registerForm.username?.trim() || registerForm.username.length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    }
    
    if (!registerForm.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      newErrors.email = 'Ingrese un email válido';
    }
    
    if (!registerForm.fullName?.trim() || registerForm.fullName.length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!registerForm.password?.trim() || registerForm.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('🚀 Login button clicked');
    
    if (!validateLogin()) {
      console.log('❌ Login validation failed');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Attempting login with:', {
        username: loginForm.username,
        passwordLength: loginForm.password.length
      });
      
      const result = await authService.login(loginForm);
      console.log('📋 Login result:', {
        success: result.success,
        hasSession: !!result.session,
        hasUser: !!result.session?.user,
        error: result.error
      });
      
      if (result.success && result.session?.user) {
        console.log('✅ Login successful, user data:', {
          id: result.session.user.id,
          username: result.session.user.username,
          email: result.session.user.email,
          role: result.session.user.role
        });
        
        addToast({
          type: 'success',
          title: '¡Bienvenido!',
          message: `Sesión iniciada como ${result.session.user.fullName || result.session.user.username}`
        });
        
        // Call parent component to update authentication state
        console.log('🔗 Calling onLoginSuccess with user data');
        onLoginSuccess(result.session.user);
      } else {
        console.log('❌ Login failed:', result.error);
        addToast({
          type: 'error',
          title: 'Error de autenticación',
          message: result.error || 'Credenciales incorrectas'
        });
      }
    } catch (error) {
      console.error('💥 Login exception:', error);
      addToast({
        type: 'error',
        title: 'Error del sistema',
        message: error instanceof Error ? error.message : 'Error inesperado durante el login'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    console.log('🚀 Register button clicked');
    
    if (!validateRegister()) {
      console.log('❌ Register validation failed');
      return;
    }

    setIsLoading(true);

    try {
      console.log('👤 Attempting registration for:', {
        username: registerForm.username,
        email: registerForm.email,
        fullName: registerForm.fullName,
        role: registerForm.role,
        passwordLength: registerForm.password.length
      });
      
      const result = await authService.register(registerForm);
      console.log('📋 Registration result:', {
        success: result.success,
        hasUser: !!result.user,
        error: result.error
      });
      
      if (result.success && result.user) {
        console.log('✅ Registration successful, user data:', {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role
        });
        
        addToast({
          type: 'success',
          title: '¡Registro exitoso!',
          message: 'Usuario creado correctamente. Ahora puede iniciar sesión.'
        });
        
        // Switch to login mode and pre-fill username
        switchMode('login');
        setLoginForm({ 
          username: registerForm.username, 
          password: '' 
        });
        
        // Clear register form
        setRegisterForm({
          username: '',
          email: '',
          fullName: '',
          password: '',
          confirmPassword: '',
          role: 'admin'
        });
      } else {
        console.log('❌ Registration failed:', result.error);
        addToast({
          type: 'error',
          title: 'Error en el registro',
          message: result.error || 'No se pudo crear el usuario'
        });
      }
    } catch (error) {
      console.error('💥 Registration exception:', error);
      addToast({
        type: 'error',
        title: 'Error del sistema',
        message: error instanceof Error ? error.message : 'Error inesperado durante el registro'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugAuth = async () => {
    await authService.debugUserData();
    setDebugMode(!debugMode);
  };

  const syncStatus = syncService.getStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Debug Button */}
      {import.meta.env.DEV && (
        <button
          onClick={handleDebugAuth}
          className="fixed top-4 right-4 z-50 px-3 py-2 bg-yellow-500 text-black rounded-lg text-xs font-bold hover:bg-yellow-400 transition-colors"
        >
          🔧 Debug Auth
        </button>
      )}

      <div className="relative w-full max-w-md z-10">
        {/* Logo Section Enhanced */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300">
                <Building2 className="h-10 w-10 text-primary-700" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-200 via-white to-yellow-200 bg-clip-text text-transparent mb-2">
            ContaVe Pro
          </h1>
          <p className="text-primary-200 font-medium tracking-widest text-sm uppercase">
            Enterprise System v2.0
          </p>
          
          {/* Connection Status Badge */}
          <div className="inline-flex items-center gap-3 mt-6 px-5 py-2.5 bg-black/30 backdrop-blur-xl rounded-full border border-white/10">
            <div className={`relative ${syncStatus.isOnline ? 'text-green-400' : 'text-orange-400'}`}>
              <div className="absolute inset-0 blur-sm animate-pulse">
                <Globe className="h-4 w-4" />
              </div>
              <Globe className="h-4 w-4 relative" />
            </div>
            <span className="text-white/90 text-sm font-medium">
              {syncStatus.isOnline ? 'Sistema Online' : 'Modo Offline'}
            </span>
            <div className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
          </div>
        </div>

        {/* Main Card */}
        <div className={`
          relative
          bg-gradient-to-br from-white/10 to-white/5 
          backdrop-blur-2xl 
          rounded-3xl 
          p-8 
          shadow-2xl 
          border border-white/20
          ${isTransitioning ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}
          transition-all duration-300 ease-out
        `}>
          {/* Sparkle decoration */}
          <Sparkles className="absolute top-4 right-4 h-4 w-4 text-yellow-300/50 animate-pulse" />
          
          {/* Mode Toggle Enhanced */}
          <div className="relative mb-8">
            <div className="flex bg-black/20 backdrop-blur-sm rounded-2xl p-1.5">
              <button
                onClick={() => switchMode('login')}
                className={`
                  relative flex-1 py-3.5 px-4 rounded-xl font-semibold 
                  transition-all duration-300 ease-out
                  ${mode === 'login'
                    ? 'bg-white text-primary-700 shadow-xl scale-[1.02]'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <LogIn className="h-4 w-4 inline mr-2" />
                Iniciar Sesión
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`
                  relative flex-1 py-3.5 px-4 rounded-xl font-semibold 
                  transition-all duration-300 ease-out
                  ${mode === 'register'
                    ? 'bg-white text-primary-700 shadow-xl scale-[1.02]'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                Registrarse
              </button>
            </div>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-white">Bienvenido</h2>
                <p className="text-primary-200 text-sm">Ingrese sus credenciales para continuar</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90 tracking-wide">
                  Usuario
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 transition-colors duration-200" />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, username: e.target.value });
                      if (errors.username) setErrors({ ...errors, username: '' });
                    }}
                    placeholder="Ingrese su usuario"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-neutral-800 placeholder-neutral-400 font-medium transition-all duration-200"
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1 animate-shake">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90 tracking-wide">
                  Contraseña
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 transition-colors duration-200" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="Ingrese su contraseña"
                    className="w-full pl-12 pr-12 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-neutral-800 placeholder-neutral-400 font-medium transition-all duration-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1 animate-shake">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-200 ease-out bg-gradient-to-r from-white to-neutral-50 text-primary-700 shadow-xl hover:shadow-2xl border-2 border-white/50 w-full disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>

              <div className="text-center text-xs text-white/50 bg-black/20 rounded-lg p-3">
                <p className="font-medium mb-1">🚀 Para crear tu primera cuenta:</p>
                <p>Usa el botón "Registrarse" arriba para crear un usuario administrador</p>
              </div>
            </div>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-white">Crear Cuenta</h2>
                <p className="text-primary-200 text-sm">Complete la información requerida</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/90 tracking-wide">
                    Nombre Completo
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      value={registerForm.fullName}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, fullName: e.target.value });
                        if (errors.fullName) setErrors({ ...errors, fullName: '' });
                      }}
                      placeholder="Juan Pérez"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-neutral-800 placeholder-neutral-400 font-medium transition-all duration-200"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-300 flex items-center gap-1 animate-shake">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/90 tracking-wide">
                    Usuario
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      value={registerForm.username}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, username: e.target.value });
                        if (errors.username) setErrors({ ...errors, username: '' });
                      }}
                      placeholder="admin"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-neutral-800 placeholder-neutral-400 font-medium transition-all duration-200"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-300 flex items-center gap-1 animate-shake">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90 tracking-wide">
                  Email
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => {
                      setRegisterForm({ ...registerForm, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="admin@empresa.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-neutral-800 placeholder-neutral-400 font-medium transition-all duration-200"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-300 flex items-center gap-1 animate-shake">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90 tracking-wide">
                  Rol de Usuario
                </label>
                <select
                  value={registerForm.role}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value as 'admin' | 'user' | 'readonly' })}
                  className="w-full px-4 py-3.5 bg-white/95 backdrop-blur-sm text-neutral-800 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none font-medium transition-all duration-200 hover:border-neutral-300"
                >
                  <option value="admin">Administrador (Acceso completo)</option>
                  <option value="user">Usuario Estándar</option>
                  <option value="readonly">Solo Lectura</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/90 tracking-wide">
                    Contraseña
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      placeholder="8+ caracteres"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-neutral-800 placeholder-neutral-400 font-medium transition-all duration-200"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-300 flex items-center gap-1 animate-shake">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white/90 tracking-wide">
                    Confirmar
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.confirmPassword}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, confirmPassword: e.target.value });
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                      }}
                      placeholder="Repetir"
                      className="w-full pl-12 pr-12 py-3.5 bg-white/95 backdrop-blur-sm border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-neutral-800 placeholder-neutral-400 font-medium transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-300 flex items-center gap-1 animate-shake">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Password strength indicator */}
              {registerForm.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Fortaleza de contraseña</span>
                    <span className={`font-semibold ${
                      registerForm.password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.password) ? 'text-green-300' :
                      registerForm.password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.password) ? 'text-amber-300' :
                      'text-red-300'
                    }`}>
                      {registerForm.password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.password) ? 'Fuerte' :
                       registerForm.password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.password) ? 'Media' : 'Débil'}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        registerForm.password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.password) ? 'bg-green-400 w-full' :
                        registerForm.password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.password) ? 'bg-amber-400 w-2/3' :
                        'bg-red-400 w-1/3'
                      }`}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-200 ease-out bg-gradient-to-r from-white to-neutral-50 text-primary-700 shadow-xl hover:shadow-2xl border-2 border-white/50 w-full disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    <span>Creando cuenta...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Crear Cuenta</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Enhanced */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-6 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Conexión Segura</span>
            </div>
            <div className="w-px h-4 bg-white/20"></div>
            <span>© 2024 ContaVe Solutions</span>
            <div className="w-px h-4 bg-white/20"></div>
            <span>v2.0.0</span>
          </div>
        </div>

        {/* Debug Info */}
        {debugMode && import.meta.env.DEV && (
          <div className="mt-4 p-4 bg-black/50 backdrop-blur-xl rounded-xl text-white text-xs font-mono">
            <h4 className="font-bold mb-2">🔧 Debug Info:</h4>
            <p>Environment: {import.meta.env.DEV ? 'Development' : 'Production'}</p>
            <p>Storage Keys: {Object.keys(localStorage).filter(k => k.startsWith('contave-')).length}</p>
            <p>Current Session: {this.currentSession ? 'Active' : 'None'}</p>
            <button
              onClick={() => authService.clearAllAuthData()}
              className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
            >
              Clear All Auth Data
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}