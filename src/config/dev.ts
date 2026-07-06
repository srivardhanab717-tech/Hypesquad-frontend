/**
 * Development configuration flags.
 *
 * SKIP_AUTH = true  → bypass auth screen entirely (app opens straight to Home)
 * SKIP_AUTH = false → show auth screen, but all sign-in actions instantly authenticate
 *                     using MOCK_USER (no real network calls)
 */
export const SKIP_AUTH = false;

/**
 * When true, tapping any sign-in button on the AuthScreen will immediately
 * authenticate as MOCK_USER without making any network requests.
 * Set to false to use real OTP/OAuth authentication.
 */
export const MOCK_AUTH = flase ;

/**
 * Mock user object used when SKIP_AUTH or MOCK_AUTH is true.
 * Provides fake data so screens expecting a current user don't crash.
 */
export const MOCK_USER = {
  id: 'mock-user-001',
  name: 'Test User',
  handle: 'testuser',
  bio: 'This is a test account for development.',
  avatar_color: '#FF6B35',
  streak: 7,
  post_count: 12,
  follower_count: 42,
  following_count: 18,
};
