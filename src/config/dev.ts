/**
 * Development configuration flags.
 * Set SKIP_AUTH = true to bypass the entire authentication flow
 * and go straight to the main app with a mock user.
 * Set back to false to restore normal authentication.
 */
export const SKIP_AUTH = true;

/**
 * Mock user object used when SKIP_AUTH is true.
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
