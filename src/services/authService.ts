import { db, DatabaseUser } from './databaseService';
import * as bcrypt from 'bcryptjs';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user' | 'readonly';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role?: 'admin' | 'user' | 'readonly';
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
  isValid: boolean;
}

export interface LoginResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentSession: AuthSession | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.loadStoredSession();
    this.setupSessionManagement();
  }

  async register(userData: RegisterData): Promise<RegisterResult> {
    try {
      console.log('👤 Starting registration process for:', userData.username);

      // Ensure database is connected
      await db.connect();

      // Validate required fields
      if (!userData.username?.trim()) {
        console.log('❌ Registration failed: Username is required');
        return { success: false, error: 'El nombre de usuario es obligatorio' };
      }

      if (!userData.email?.trim()) {
        console.log('❌ Registration failed: Email is required');
        return { success: false, error: 'El email es obligatorio' };
      }

      if (!userData.fullName?.trim()) {
        console.log('❌ Registration failed: Full name is required');
        return { success: false, error: 'El nombre completo es obligatorio' };
      }

      if (!userData.password?.trim()) {
        console.log('❌ Registration failed: Password is required');
        return { success: false, error: 'La contraseña es obligatoria' };
      }

      // Check if username already exists
      const existingUserByUsername = await db.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        console.log('❌ Registration failed: Username already exists');
        return { success: false, error: 'El nombre de usuario ya está registrado' };
      }

      // Check if email already exists
      const existingUserByEmail = await db.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        console.log('❌ Registration failed: Email already exists');
        return { success: false, error: 'El email ya está registrado' };
      }

      // Validate password strength
      if (!this.validatePassword(userData.password)) {
        console.log('❌ Registration failed: Password too weak');
        return { 
          success: false, 
          error: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números' 
        };
      }

      console.log('🔐 Hashing password...');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      console.log('✅ Password hashed successfully');

      // Create user data object - USAR SNAKE_CASE PARA LA BASE DE DATOS
      const newUserData = {
        username: userData.username.trim(),
        email: userData.email.trim().toLowerCase(),
        full_name: userData.fullName.trim(),        
        password_hash: hashedPassword,               
        role: userData.role || 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Creating user in database with data:', {
        username: newUserData.username,
        email: newUserData.email,
        full_name: newUserData.full_name,
        role: newUserData.role,
        is_active: newUserData.is_active
      });

      const userId = await db.createUser(newUserData);
      console.log('✅ User created with ID:', userId);

      // Get created user to return (without password hash)
      const createdUser = await db.getUser(userId);
      if (!createdUser) {
        console.error('❌ Could not retrieve created user');
        return { success: false, error: 'Error al crear usuario en la base de datos' };
      }

      // Convert to User interface (snake_case to camelCase)
      const user: User = {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        fullName: createdUser.full_name,  // Mapeo correcto
        role: createdUser.role,
        isActive: createdUser.is_active,  // Mapeo correcto
        lastLogin: createdUser.last_login, // Mapeo correcto
        createdAt: createdUser.created_at  // Mapeo correcto
      };

      console.log('🎉 Registration completed successfully for:', user.username);
      return { success: true, user };
    } catch (error) {
      console.error('💥 Registration error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido en el registro'
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      console.log('🔐 Starting login process for:', credentials.username);

      // Ensure database is connected
      await db.connect();

      // Validate input
      if (!credentials.username?.trim()) {
        console.log('❌ Login failed: Username is required');
        return { success: false, error: 'El nombre de usuario es obligatorio' };
      }

      if (!credentials.password?.trim()) {
        console.log('❌ Login failed: Password is required');
        return { success: false, error: 'La contraseña es obligatoria' };
      }

      console.log('🔍 Looking for user in database...');
      const user = await db.getUserByUsername(credentials.username);

      if (!user) {
        console.log('❌ Login failed: User not found');
        return { success: false, error: 'Usuario no encontrado' };
      }

      console.log('✅ User found:', {
        id: user.id,
        username: user.username,
        email: user.email,
        is_active: user.is_active,  // ← CAMBIO: usar snake_case
        hasPasswordHash: !!user.password_hash,  // ← CAMBIO: usar snake_case
        role: user.role
      });

      // IMPORTANTE: Usar snake_case para el campo de la base de datos
      if (!user.is_active) {  // ← CAMBIO: user.is_active en lugar de user.isActive
        console.log('❌ Login failed: User is inactive');
        return { success: false, error: 'Usuario deshabilitado' };
      }

      // Check if user is locked - usar snake_case
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        console.log('❌ Login failed: User is locked');
        return { 
          success: false, 
          error: `Usuario bloqueado hasta ${new Date(user.locked_until).toLocaleString('es-VE')}` 
        };
      }

      // IMPORTANTE: Usar snake_case
      if (!user.password_hash) {  // ← CAMBIO: user.password_hash en lugar de user.passwordHash
        console.log('❌ Login failed: No password hash stored');
        return { success: false, error: 'Error de configuración de usuario' };
      }

      console.log('🔐 Verifying password...');
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
      console.log('🔐 Password verification result:', isValidPassword);

      if (!isValidPassword) {
        console.log('❌ Login failed: Invalid password');
        await this.handleFailedLogin(credentials.username);
        return { success: false, error: 'Contraseña incorrecta' };
      }

      console.log('🎟️ Creating session...');
      const session = this.createSession(this.convertToPublicUser(user));
      this.currentSession = session;
      this.storeSession(session);

      console.log('📅 Updating last login...');
      await db.updateUser(user.id, { 
        last_login: new Date().toISOString(),  // ← CAMBIO: usar snake_case
        failed_login_attempts: 0,              // ← CAMBIO: usar snake_case
        locked_until: undefined                // ← CAMBIO: usar snake_case
      });

      console.log('🎉 Login successful for user:', user.username);
      return { success: true, session };
    } catch (error) {
      console.error('💥 Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido en el login'
      };
    }
  }

  logout(): void {
    try {
      if (this.currentSession) {
        console.log('👋 Logging out user:', this.currentSession.user.username);
      }

      this.currentSession = null;
      localStorage.removeItem('contave-auth-session');
      
      if (this.sessionCheckInterval) {
        clearInterval(this.sessionCheckInterval);
        this.sessionCheckInterval = null;
      }

      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentSession?.user || null;
  }

  getCurrentSession(): AuthSession | null {
    if (this.currentSession && this.isSessionValid(this.currentSession)) {
      return this.currentSession;
    }
    
    // Session expired or invalid
    if (this.currentSession) {
      console.log('⏰ Current session expired, clearing...');
      this.logout();
    }
    
    return null;
  }

  isAuthenticated(): boolean {
    const session = this.getCurrentSession();
    return session?.isValid || false;
  }

  hasRole(requiredRole: 'admin' | 'user' | 'readonly'): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const roleHierarchy = { admin: 3, user: 2, readonly: 1 };
    const userLevel = roleHierarchy[currentUser.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  private createSession(user: User): AuthSession {
    const token = this.generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

    const session: AuthSession = {
      user: { ...user },
      token,
      expiresAt: expiresAt.toISOString(),
      isValid: true
    };

    console.log('🎟️ Session created:', {
      userId: user.id,
      username: user.username,
      expiresAt: session.expiresAt,
      token: token.substring(0, 8) + '...'
    });

    return session;
  }

  private generateSecureToken(): string {
    try {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('❌ Error generating token:', error);
      // Fallback for environments without crypto API
      return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
  }

  private storeSession(session: AuthSession): void {
    try {
      localStorage.setItem('contave-auth-session', JSON.stringify(session));
      console.log('💾 Session stored in localStorage');
    } catch (error) {
      console.error('❌ Failed to store session:', error);
    }
  }

  private loadStoredSession(): void {
    try {
      const storedSession = localStorage.getItem('contave-auth-session');
      if (!storedSession) {
        console.log('🔍 No stored session found');
        return;
      }

      const session = JSON.parse(storedSession);
      
      if (this.isSessionValid(session)) {
        this.currentSession = session;
        console.log('🔄 Restored valid session for user:', session.user.username);
        this.setupSessionManagement();
      } else {
        console.log('⏰ Stored session expired or invalid, removing');
        localStorage.removeItem('contave-auth-session');
      }
    } catch (error) {
      console.error('❌ Error loading stored session:', error);
      localStorage.removeItem('contave-auth-session');
    }
  }

  private isSessionValid(session: AuthSession): boolean {
    if (!session || !session.expiresAt) return false;
    
    const expiryDate = new Date(session.expiresAt);
    const now = new Date();
    
    return expiryDate > now && session.isValid;
  }

  private setupSessionManagement(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Check session validity every minute
    this.sessionCheckInterval = setInterval(() => {
      if (this.currentSession && !this.isSessionValid(this.currentSession)) {
        console.log('⏰ Session expired during check, logging out...');
        this.logout();
      }
    }, 60000); // Check every minute
  }

  private async handleFailedLogin(username: string): Promise<void> {
    try {
      const user = await db.getUserByUsername(username);
      if (!user) return;

      // Usar snake_case para los campos de la base de datos
      const attempts = (user.failed_login_attempts || 0) + 1;  // ← CAMBIO
      const maxAttempts = 5;

      let updateData: Partial<DatabaseUser> = { 
        failed_login_attempts: attempts,  // ← CAMBIO
        updated_at: new Date().toISOString()  // ← CAMBIO
      };

      // Lock user after max attempts
      if (attempts >= maxAttempts) {
        const lockDuration = 30; // 30 minutes
        const lockedUntil = new Date();
        lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDuration);
        updateData.locked_until = lockedUntil.toISOString();  // ← CAMBIO
        console.log(`🔒 User ${username} locked for ${lockDuration} minutes after ${attempts} failed attempts`);
      }

      await db.updateUser(user.id, updateData);
      console.log(`📝 Failed login recorded for ${username}: attempt ${attempts}/${maxAttempts}`);
    } catch (error) {
      console.error('❌ Error handling failed login:', error);
    }
  }

  private validatePassword(password: string): boolean {
    // Minimum 8 characters, at least one uppercase, one lowercase, one number
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return hasMinLength && hasUppercase && hasLowercase && hasNumber;
  }

  private convertToPublicUser(dbUser: DatabaseUser): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      fullName: dbUser.full_name,        // snake_case a camelCase
      role: dbUser.role,
      isActive: dbUser.is_active,        // snake_case a camelCase
      lastLogin: dbUser.last_login,      // snake_case a camelCase
      createdAt: dbUser.created_at       // snake_case a camelCase
    };
  }

  // User management methods (for admin interface)
  async getUsers(): Promise<User[]> {
    try {
      const dbUsers = await db.getUsers();
      return dbUsers.map(this.convertToPublicUser);
    } catch (error) {
      console.error('❌ Error getting users:', error);
      return [];
    }
  }

  async createUser(userData: RegisterData): Promise<RegisterResult> {
    // Only admins can create users
    if (!this.hasRole('admin')) {
      return { success: false, error: 'No tiene permisos para crear usuarios' };
    }

    return await this.register(userData);
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      // Only admins can update users (or user updating themselves)
      const currentUser = this.getCurrentUser();
      if (!currentUser || (!this.hasRole('admin') && currentUser.id !== userId)) {
        return { success: false, error: 'No tiene permisos para actualizar este usuario' };
      }

      // Convert updates to database format
      const dbUpdates: Partial<DatabaseUser> = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await db.updateUser(userId, dbUpdates);
      console.log(`📝 User updated: ${userId} by ${currentUser.username}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al actualizar usuario' 
      };
    }
  }

  async deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Only admins can delete users
      if (!this.hasRole('admin')) {
        return { success: false, error: 'No tiene permisos para eliminar usuarios' };
      }

      const currentUser = this.getCurrentUser();
      if (currentUser?.id === userId) {
        return { success: false, error: 'No puede eliminar su propio usuario' };
      }

      await db.deleteUser(userId);
      console.log(`🗑️ User deleted: ${userId} by ${currentUser!.username}`);

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al eliminar usuario' 
      };
    }
  }

  // Session extension
  async extendSession(): Promise<boolean> {
    if (!this.currentSession) {
      console.log('❌ No current session to extend');
      return false;
    }

    try {
      const newExpiryTime = new Date();
      newExpiryTime.setHours(newExpiryTime.getHours() + 8);

      this.currentSession.expiresAt = newExpiryTime.toISOString();
      this.storeSession(this.currentSession);

      console.log('⏰ Session extended until:', newExpiryTime.toISOString());
      return true;
    } catch (error) {
      console.error('❌ Error extending session:', error);
      return false;
    }
  }

  // Development/testing helpers
  async debugUserData(): Promise<void> {
    console.log('🔧 === DEBUG: Authentication State ===');
    console.log('Current session:', this.currentSession);
    console.log('Is authenticated:', this.isAuthenticated());
    console.log('Current user:', this.getCurrentUser());
    
    try {
      const allUsers = await db.getUsers();
      console.log('Total users in database:', allUsers.length);
      allUsers.forEach(user => {
        console.log(`User: ${user.username} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`);
      });
    } catch (error) {
      console.error('Error getting debug data:', error);
    }
    console.log('🔧 === END DEBUG ===');
  }

  // Clear all authentication data (for testing)
  clearAllAuthData(): void {
    console.warn('🚨 CLEARING ALL AUTHENTICATION DATA');
    this.logout();
    localStorage.removeItem('contave-auth-session');
    localStorage.removeItem('contave-users-v2');
    console.log('🧹 All auth data cleared');
  }
}

export const authService = AuthService.getInstance();