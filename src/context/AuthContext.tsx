import React, { createContext, useContext, useState, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Hardcoded mock user for testing (no real auth)
// ---------------------------------------------------------------------------

const MOCK_USER = {
  id: 'test-user',
  name: 'Test User',
  handle: 'testuser',
  bio: 'This is a test account for development.',
  avatar_color: '#FF6B35',
  streak: 7,
  post_count: 12,
  follower_count: 42,
  following_count: 18,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextValue {
  isAuthenticated: boolean;
  needsSetup: boolean;
  isLoading: boolean;
  signIn: (token: string) => void;
  signOut: () => void;
  completeSetup: () => void;
  user: typeof MOCK_USER;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider — always authenticated with mock user
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const signIn = (_token: string) => {
    setIsAuthenticated(true);
  };

  const signOut = () => {
    setIsAuthenticated(false);
  };

  const completeSetup = () => {
    // No-op in test mode
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        needsSetup: false,
        isLoading: false,
        signIn,
        signOut,
        completeSetup,
        user: MOCK_USER,
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
