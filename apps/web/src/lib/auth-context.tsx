import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';
import { Loader2 } from 'lucide-react';
import { useRouter } from '@tanstack/react-router';
import type { UserRole, UserStatus } from '@danta/schemas';
import { PUBLIC_ROUTES } from './public-routes';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  practiceId?: string;
  locationId?: string;
  avatarUrl?: string;
  isSuperadmin?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  status: string;
}

export interface Practice {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  timezone?: string;
}

export interface AuthContextValue {
  user: User | null;
  tenant: Tenant | null;
  practice: Practice | null;
  location: Location | null;
  permissions: string[];
  loading: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; inviteToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setPractice: (practiceId: string) => Promise<void>;
  setLocation: (locationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [practice, setPracticeState] = useState<Practice | null>(null);
  const [location, setLocationState] = useState<Location | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data.user);
      setTenant(response.data.tenant);
      setPracticeState(response.data.practice);
      setLocationState(response.data.location);
      setPermissions(response.data.permissions ?? []);
    } catch {
      setUser(null);
      setTenant(null);
      setPracticeState(null);
      setLocationState(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attempt fetchMe to see if we have valid cookies
    fetchMe();
  }, []);

  const login = async (email: string, password: string, mfaCode?: string) => {
    await apiClient.post('/auth/login', { email, password, mfaCode });
    await fetchMe();
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; inviteToken: string }) => {
    await apiClient.post('/auth/register', data);
    await fetchMe();
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore logout errors
    } finally {
      setUser(null);
      setTenant(null);
      setPracticeState(null);
      setLocationState(null);
      setPermissions([]);
      queryClient.clear();
    }
  };

  const refreshTokens = async () => {
    await apiClient.post('/auth/refresh');
    await fetchMe();
  };

  const setPractice = async (practiceId: string) => {
    const response = await apiClient.get(`/practices/${practiceId}`);
    setPracticeState(response.data);
  };

  const setLocation = async (locationId: string) => {
    const response = await apiClient.get(`/locations/${locationId}`);
    setLocationState(response.data);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, practice, location, permissions, loading, login, register, logout, refreshTokens, fetchMe, setPractice, setLocation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const currentPath = router.state.location.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some(route => currentPath === route || currentPath.startsWith(route + '/'));

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.navigate({ to: '/login' });
    return null;
  }

  return <>{children}</>;
}

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { permissions } = useAuth();

  if (!permissions.includes(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to access this resource.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
