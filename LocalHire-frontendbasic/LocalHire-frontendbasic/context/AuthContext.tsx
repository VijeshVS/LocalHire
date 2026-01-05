
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  loginEmployee, 
  loginEmployer, 
  registerEmployee, 
  registerEmployer, 
  logout as logoutService, 
  getToken, 
  getUserType,
  isAuthenticated as checkAuth 
} from '../services/authService';
import { getEmployeeProfile, getEmployerProfile } from '../services/profileService';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  userType: 'worker' | 'employer' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, type: 'worker' | 'employer') => Promise<void>;
  register: (userData: any, type: 'worker' | 'employer') => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  userType: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'worker' | 'employer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await checkAuth();
      if (authenticated) {
        const type = await getUserType();
        setUserType(type as 'worker' | 'employer');
        await fetchProfile(type as 'worker' | 'employer');
      }
    } catch (error) {
      console.log('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (type: 'worker' | 'employer') => {
    try {
      const profile = type === 'worker' 
        ? await getEmployeeProfile() 
        : await getEmployerProfile();
      setUser(profile);
    } catch (error) {
      console.log('Profile fetch error:', error);
      // If profile fetch fails, user might be logged out
      await logoutService();
      setUser(null);
      setUserType(null);
    }
  };

  const login = async (email: string, password: string, type: 'worker' | 'employer') => {
    try {
      if (type === 'worker') {
        await loginEmployee(email, password);
      } else {
        await loginEmployer(email, password);
      }
      setUserType(type);
      await fetchProfile(type);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any, type: 'worker' | 'employer') => {
    try {
      if (type === 'worker') {
        await registerEmployee(userData);
      } else {
        await registerEmployer(userData);
      }
      // After registration, login automatically
      await login(userData.email, userData.password, type);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
    setUserType(null);
  };

  const refreshProfile = async () => {
    if (userType) {
      await fetchProfile(userType);
    }
  };

  const value: AuthContextType = {
    user,
    userType,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
