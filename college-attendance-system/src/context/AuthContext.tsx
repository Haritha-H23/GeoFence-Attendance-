import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { saveAuth, loadToken, loadUser, clearAuth } from '../services/tokenStore';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tok = loadToken();
    const usr = loadUser();
    if (tok && usr) {
      try {
        setToken(tok);
        setUser(JSON.parse(usr));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, tok: string) => {
    saveAuth(tok, JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
