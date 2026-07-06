import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Read Supabase config from app.json → expo.extra (never hard-coded)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? '';

/**
 * Custom storage adapter using expo-secure-store for session persistence.
 * Encrypts data at rest — never use plain AsyncStorage for auth tokens.
 */
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Silently fail — secure store may not be available in all environments
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Silently fail
    }
  },
};

/**
 * Initialized Supabase client with secure session persistence.
 * If supabaseUrl or supabaseAnonKey are missing/placeholder, the client
 * will be non-functional but won't crash the app on initialization.
 */
let supabase: SupabaseClient;

try {
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );
} catch (e) {
  // If createClient throws for any reason, create a minimal stub
  // that won't crash the app (API calls will just fail gracefully)
  console.error('[supabase.ts] Failed to initialize Supabase client:', e);
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: () => ({
      on: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} }),
      subscribe: () => {},
      untrack: () => {},
      presenceState: () => ({}),
      track: async () => {},
    }),
    removeChannel: () => {},
  } as any;
}

export { supabase };
