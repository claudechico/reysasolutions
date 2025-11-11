import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, BackendUser } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: BackendUser | null;
  loading: boolean;
  signUp: (payload: { name: string; email: string; phoneNumber: string; password: string; role?: string }) => Promise<{ error?: string; verificationToken?: string; userId?: string | number; email?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string; user?: BackendUser }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // normalize role to lowercase string to avoid casing mismatches
        if (parsed && typeof parsed === 'object') {
          parsed.role = String(parsed.role || '').toLowerCase().trim();
        }
        setUser(parsed);
        try {
          // eslint-disable-next-line no-console
          console.debug('[Auth] loaded user from storage:', parsed);
        } catch {}
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const signUp: AuthContextType['signUp'] = async (payload) => {
    try {
      const res = await authApi.register(payload);
      if (res?.verificationToken) {
        // Store temporarily to help VerifyOTP find it if the URL lacks the token
        try { sessionStorage.setItem('pending_verification_token', String(res.verificationToken)); } catch {}
        navigate(`/verify-otp?token=${encodeURIComponent(res.verificationToken)}`);
      }
      return {
        verificationToken: res?.verificationToken,
        userId: res?.userId,
        email: res?.email,
      } as any;
    } catch (e: any) {
      const msg = e?.message || e?.response?.data?.message || e?.response?.data?.error || 'Registration failed';
      return { error: msg };
    }
  };

  const signIn: AuthContextType['signIn'] = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      // normalize and persist role so checks are consistent
      const userObj = { ...(res.user || {}) } as any;
      userObj.role = String(userObj.role || '').toLowerCase().trim();
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(userObj));
      setUser(userObj);
      try {
        // eslint-disable-next-line no-console
        console.debug('[Auth] signIn normalized user:', userObj, 'rawUser:', res.user);
      } catch {}
      return { user: res.user } as any;
    } catch (e: any) {
      const msg = e?.message || e?.response?.data?.message || e?.response?.data?.error || 'Login failed';
      return { error: msg };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
