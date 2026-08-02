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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  sessionToken: string | null;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Gets the dashboard path based on user role
function getDashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'SECURITY_GUARD':
      return '/security/dashboard';
    case 'RESIDENT':
      return '/resident/dashboard';
    default:
      return '/';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('praveshkavach_user');
    const storedToken = sessionStorage.getItem('praveshkavach_token');
    
    console.log('[v0] AuthProvider init - stored user:', !!storedUser, 'token:', !!storedToken);
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('[v0] Restored user from session:', parsedUser.email, 'role:', parsedUser.role);
        setUser(parsedUser);
        setSessionToken(storedToken);
      } catch (error) {
        console.error('[v0] Failed to restore session:', error);
        sessionStorage.removeItem('praveshkavach_user');
        sessionStorage.removeItem('praveshkavach_token');
      }
    }
    
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('[v0] Login attempt:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('[v0] Login response:', data);
      
      if (!data.success || !data.user || !data.token) {
        throw new Error('Invalid response from server');
      }

      const newUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        avatar: data.user.avatar,
        building: data.user.building,
        flatNumber: data.user.flatNumber,
        gate: data.user.gate,
        shift: data.user.shift,
      };

      setUser(newUser);
      setSessionToken(data.token);
      
      sessionStorage.setItem('praveshkavach_user', JSON.stringify(newUser));
      sessionStorage.setItem('praveshkavach_token', data.token);
      
      console.log('[v0] Login successful - role:', newUser.role);
    } catch (error) {
      console.error('[v0] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      console.log('[v0] Register attempt:', email, 'role:', role);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      console.log('[v0] Register response:', data);
      
      if (!data.success || !data.user || !data.token) {
        throw new Error('Invalid response from server');
      }

      const newUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        avatar: data.user.avatar,
        building: data.user.building,
        flatNumber: data.user.flatNumber,
        gate: data.user.gate,
        shift: data.user.shift,
      };

      setUser(newUser);
      setSessionToken(data.token);
      
      sessionStorage.setItem('praveshkavach_user', JSON.stringify(newUser));
      sessionStorage.setItem('praveshkavach_token', data.token);
      
      console.log('[v0] Registration successful - role:', newUser.role);
    } catch (error) {
      console.error('[v0] Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('[v0] Logout');
    try {
      // Call backend logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
    } catch (error) {
      console.warn('[v0] Backend logout failed, clearing local session anyway:', error);
    }
    
    setUser(null);
    setSessionToken(null);
    sessionStorage.removeItem('praveshkavach_user');
    sessionStorage.removeItem('praveshkavach_token');
  };

  const getDashboardPath = (): string => {
    if (!user) return '/';
    return getDashboardPathForRole(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isInitialized,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      sessionToken,
      getDashboardPath,
    }}>
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
