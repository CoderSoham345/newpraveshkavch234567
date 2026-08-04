import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'RESIDENT' | 'SECURITY_GUARD' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  building?: string;
  flatNumber?: string;
  gate?: string;
  shift?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  isAuthenticated: boolean;
  sessionToken: string | null;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Normalize role string for storage & routing ("admin", "security", "resident")
function normalizeRoleString(role: UserRole | string): string {
  const r = (role || '').toUpperCase();
  if (r === 'ADMIN') return 'admin';
  if (r === 'SECURITY' || r === 'SECURITY_GUARD' || r === 'GUARD') return 'security';
  return 'resident';
}

function getDashboardPathForRole(role: UserRole | string): string {
  const r = normalizeRoleString(role);
  switch (r) {
    case 'admin':
      return '/admin/dashboard';
    case 'security':
      return '/security/dashboard';
    case 'resident':
      return '/resident/dashboard';
    default:
      return '/';
  }
}

// Pre-defined demo users
const DEMO_USERS: Record<string, { name: string; role: UserRole; validPasswords: string[]; building?: string; flatNumber?: string; gate?: string; shift?: string }> = {
  'admin@test.com': {
    name: 'System Admin',
    role: 'ADMIN',
    validPasswords: ['admin123', 'Password123', '123456', 'admin'],
    building: 'Tower A',
    flatNumber: 'A-101',
    gate: 'Main Gate',
    shift: 'General',
  },
  'guard@test.com': {
    name: 'Security Guard',
    role: 'SECURITY_GUARD',
    validPasswords: ['guard123', 'Password123', '123456', 'guard', 'security'],
    building: 'Tower A',
    flatNumber: 'Guard Room',
    gate: 'Gate 1',
    shift: 'Day Shift',
  },
  'resident@test.com': {
    name: 'John Doe (Resident)',
    role: 'RESIDENT',
    validPasswords: ['resident123', 'Password123', '123456', 'resident'],
    building: 'Tower B',
    flatNumber: 'B-402',
    gate: 'Main Gate',
    shift: 'N/A',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const storedUser = localStorage.getItem('praveshkavach_user') || sessionStorage.getItem('praveshkavach_user');
      const storedToken = localStorage.getItem('praveshkavach_token') || sessionStorage.getItem('praveshkavach_token');
      const storedRole = localStorage.getItem('role');

      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        if (storedRole) {
          const norm = storedRole.toLowerCase();
          const activeRole: UserRole = (norm === 'admin') ? 'ADMIN' : (norm === 'security' || norm === 'security_guard' || norm === 'guard') ? 'SECURITY_GUARD' : 'RESIDENT';
          parsedUser.role = activeRole;
        }
        setUser(parsedUser);
        setSessionToken(storedToken || 'demo-token');
        console.log('[v0] Restored user session:', parsedUser.email, 'role:', parsedUser.role);
      }
    } catch (error) {
      console.error('[v0] Failed to restore session:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const login = async (emailInput: string, passwordInput: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    try {
      const email = (emailInput || '').trim().toLowerCase();
      const password = (passwordInput || '').trim();

      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      let matchedUser: User | null = null;

      // 1. Check Demo Users
      const demoUser = DEMO_USERS[email];
      if (demoUser) {
        if (demoUser.validPasswords.includes(password)) {
          matchedUser = {
            id: 'demo-' + demoUser.role.toLowerCase(),
            email: email,
            name: demoUser.name,
            role: demoUser.role,
            building: demoUser.building,
            flatNumber: demoUser.flatNumber,
            gate: demoUser.gate,
            shift: demoUser.shift,
          };
        }
      }

      // 2. Check Registered Users in LocalStorage
      if (!matchedUser) {
        try {
          const rawRegs = localStorage.getItem('praveshkavach_registered_users');
          if (rawRegs) {
            const registeredUsers: Array<any> = JSON.parse(rawRegs);
            const found = registeredUsers.find(
              (u: any) => (u.email || '').toLowerCase() === email && u.password === password
            );
            if (found) {
              matchedUser = {
                id: found.id || 'reg-' + Date.now(),
                email: found.email,
                name: found.name || 'User',
                role: found.role || 'RESIDENT',
                building: found.building || 'Tower A',
                flatNumber: found.flatNumber || 'A-101',
              };
            }
          }
        } catch (e) {
          console.error('[v0] Error reading registered users:', e);
        }
      }

      if (!matchedUser) {
        throw new Error('Invalid Email or Password');
      }

      // Save credentials & user state in localStorage
      const roleStr = normalizeRoleString(matchedUser.role);
      const token = 'demo-token-' + Date.now();

      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', roleStr);
      localStorage.setItem('email', matchedUser.email);
      localStorage.setItem('name', matchedUser.name);
      localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
      localStorage.setItem('praveshkavach_user', JSON.stringify(matchedUser));
      localStorage.setItem('praveshkavach_token', token);

      if (!rememberMe) {
        sessionStorage.setItem('praveshkavach_user', JSON.stringify(matchedUser));
        sessionStorage.setItem('praveshkavach_token', token);
      }

      setUser(matchedUser);
      setSessionToken(token);
      console.log('[v0] Client demo login successful for:', matchedUser.email, 'Role:', matchedUser.role);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (emailInput: string, passwordInput: string, nameInput: string, roleInput: UserRole) => {
    setIsLoading(true);
    try {
      const email = (emailInput || '').trim().toLowerCase();
      const password = (passwordInput || '').trim();
      const name = (nameInput || '').trim();

      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }

      const roleStr = normalizeRoleString(roleInput);
      const userRole: UserRole = roleStr === 'admin' ? 'ADMIN' : (roleStr === 'security' ? 'SECURITY_GUARD' : 'RESIDENT');

      const newUser: User = {
        id: 'reg-' + Date.now(),
        email: email,
        name: name,
        role: userRole,
        building: 'Tower A',
        flatNumber: userRole === 'RESIDENT' ? 'A-101' : 'N/A',
      };

      // Save user to registered users array in localStorage
      let registeredUsers: Array<any> = [];
      try {
        const rawRegs = localStorage.getItem('praveshkavach_registered_users');
        if (rawRegs) {
          registeredUsers = JSON.parse(rawRegs);
        }
      } catch (e) {
        registeredUsers = [];
      }

      if (registeredUsers.some((u: any) => (u.email || '').toLowerCase() === email) || DEMO_USERS[email]) {
        throw new Error('An account with this email already exists');
      }

      registeredUsers.push({
        id: newUser.id,
        email: newUser.email,
        password: password,
        name: newUser.name,
        role: newUser.role,
        building: newUser.building,
        flatNumber: newUser.flatNumber,
      });

      localStorage.setItem('praveshkavach_registered_users', JSON.stringify(registeredUsers));

      // Auto log in after registration
      const token = 'demo-token-' + Date.now();
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', roleStr);
      localStorage.setItem('email', newUser.email);
      localStorage.setItem('name', newUser.name);
      localStorage.setItem('praveshkavach_user', JSON.stringify(newUser));
      localStorage.setItem('praveshkavach_token', token);

      setUser(newUser);
      setSessionToken(token);
      console.log('[v0] Client demo registration successful for:', newUser.email, 'Role:', newUser.role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('[v0] Client demo logout');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('praveshkavach_user');
    localStorage.removeItem('praveshkavach_token');

    sessionStorage.removeItem('praveshkavach_user');
    sessionStorage.removeItem('praveshkavach_token');

    setUser(null);
    setSessionToken(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const roleStr = normalizeRoleString(newRole);
    const updatedUser: User = {
      ...user,
      role: newRole,
    };
    setUser(updatedUser);
    localStorage.setItem('role', roleStr);
    localStorage.setItem('praveshkavach_user', JSON.stringify(updatedUser));
    if (sessionStorage.getItem('praveshkavach_user')) {
      sessionStorage.setItem('praveshkavach_user', JSON.stringify(updatedUser));
    }
    console.log('[v0] Switched portal role to:', newRole);
  };

  const getDashboardPath = (): string => {
    if (!user) return '/';
    return getDashboardPathForRole(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitialized,
        login,
        register,
        logout,
        switchRole,
        isAuthenticated: !!user,
        sessionToken,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
