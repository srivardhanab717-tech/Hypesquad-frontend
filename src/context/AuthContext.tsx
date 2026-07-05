import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { registerPushToken } from '../lib/push';
import { SKIP_AUTH, MOCK_USER } from '../config/dev';

interface AuthState {
  isAuthenticated: boolean;
  needsSetup: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (token: string) => void;
  signOut: () => void;
  completeSetup: () => void;
  user: typeof MOCK_USER | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(
    SKIP_AUTH
      ? { isAuthenticated: true, needsSetup: false, isLoading: false }
      : { isAuthenticated: false, needsSetup: false, isLoading: false },
  );

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

  // Derive user from state
  const user = state.isAuthenticated ? (SKIP_AUTH ? MOCK_USER : null) : null;

  // Register push token on app open when already authenticated
  useEffect(() => {
    if (state.isAuthenticated && !SKIP_AUTH) {
      registerPushToken();
    }
  }, [state.isAuthenticated]);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, completeSetup, user }}>
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
