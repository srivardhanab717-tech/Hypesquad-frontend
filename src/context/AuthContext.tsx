import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface User {
  id: string;
  name: string;
  handle: string;
  bio?: string;
  avatar_color?: string;
  streak?: number;
  post_count?: number;
  follower_count?: number;
  following_count?: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  needsSetup: boolean;
  isLoading: boolean;
  token: string | null;
  signIn: (token: string, user?: User) => Promise<void>;
  signOut: () => Promise<void>;
  completeSetup: () => void;
  user: User | null;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider — loads persisted token on mount, persists on sign in/out
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // On app start, check if a token was already saved from a previous session
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);
          if (storedUser) setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to load persisted auth state', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (newToken: string, newUser?: User) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    if (newUser) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
    }
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const completeSetup = () => {
    // No-op for now — hook up real setup-completion logic here if needed
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        needsSetup: false,
        isLoading,
        token,
        signIn,
        signOut,
        completeSetup,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
