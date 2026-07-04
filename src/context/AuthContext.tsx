import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { registerPushToken } from '../lib/push';

interface AuthState {
  isAuthenticated: boolean;
  needsSetup: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (token: string) => void;
  signOut: () => void;
  completeSetup: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    needsSetup: false,
    isLoading: false,
  });

  const signIn = (_token: string) => {
    setState({ isAuthenticated: true, needsSetup: true, isLoading: false });
    // Register push token on sign-in
    registerPushToken();
  };

  const signOut = () => {
    setState({ isAuthenticated: false, needsSetup: false, isLoading: false });
  };

  const completeSetup = () => {
    setState((prev) => ({ ...prev, needsSetup: false }));
  };

  // Register push token on app open when already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      registerPushToken();
    }
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, completeSetup }}>
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
