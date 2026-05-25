import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loginRequest, registerRequest, fetchMe, checkBackendAlive, type AuthUser } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'atleta' | 'coach', product: 'holy-oly' | 'volta') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  backendAlive: boolean | null;
  enterDemoMode: () => void;
  demoMode: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER: AuthUser = {
  id: 'demo-athlete-1',
  email: 'demo@holyoly.com',
  name: 'Demo Atleta',
  role: 'athlete',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [backendAlive, setBackendAlive] = useState<boolean | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(() => localStorage.getItem('demoMode') === '1');

  // Ping backend on mount
  useEffect(() => {
    let cancelled = false;
    checkBackendAlive().then((alive) => {
      if (!cancelled) setBackendAlive(alive);
    });
    return () => { cancelled = true; };
  }, []);

  // Validate token on mount if backend alive
  useEffect(() => {
    if (!token || backendAlive !== true || demoMode) return;
    fetchMe()
      .then((me) => {
        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
      })
      .catch(() => {
        // Token inválido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      });
  }, [backendAlive, token, demoMode]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.removeItem('demoMode');
    setToken(data.access_token);
    setUser(data.user);
    setDemoMode(false);
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: 'atleta' | 'coach',
    product: 'holy-oly' | 'volta',
  ) => {
    const data = await registerRequest(email, password, name, role === 'coach' ? 'coach' : 'athlete', product);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.removeItem('demoMode');
    setToken(data.access_token);
    setUser(data.user);
    setDemoMode(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demoMode');
    setToken(null);
    setUser(null);
    setDemoMode(false);
  }, []);

  const enterDemoMode = useCallback(() => {
    localStorage.setItem('demoMode', '1');
    localStorage.setItem('user', JSON.stringify(DEMO_USER));
    localStorage.setItem('token', 'demo');
    setDemoMode(true);
    setUser(DEMO_USER);
    setToken('demo');
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token,
      login, register,
      logout,
      isAuthenticated: !!user,
      backendAlive,
      enterDemoMode, demoMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
