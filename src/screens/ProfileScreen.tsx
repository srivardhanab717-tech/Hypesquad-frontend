import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { PostCard, PostData } from '../components/PostCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileData {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar_color: string;
  streak: number;
  post_count: number;
  follower_count: number;
  following_count: number;
  is_following?: boolean;
}

type RootParams = {
  Profile: { userId?: string } | undefined;
  FollowList: { userId: string; initialTab: 'followers' | 'following' };
  EditProfile: undefined;
  Settings: undefined;
  Leaderboard: undefined;
};

type ProfileRouteProp = RouteProp<RootParams, 'Profile'>;
type NavigationProp = NativeStackNavigationProp<RootParams>;

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

const OWN_MENU_ITEMS = [
  { key: 'stats', label: 'Stats', icon: '📊' },
  { key: 'achievements', label: 'Achievements', icon: '🏆' },
  { key: 'milestone', label: 'Share a milestone', icon: '🎉' },
  { key: 'marketplace', label: 'Coach Marketplace', icon: '🧑‍🏫' },
  { key: 'saved', label: 'Saved posts', icon: '🔖' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ProfileRouteProp>();

  const userId = route.params?.userId;
  const isOwnProfile = !userId;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const data = isOwnProfile
        ? await api.profile.getMe()
        : await api.profile.getMe(); // For others, would be api.profile.get(userId) — using getMe as placeholder
      setProfile(data as ProfileData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    }
  }, [isOwnProfile, userId]);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await api.feed.list();
      setPosts(((data as any)?.posts ?? []) as PostData[]);
    } catch {
      // Non-critical — posts fail silently
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchPosts()]);
    setLoading(false);
  }, [fetchProfile, fetchPosts]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchPosts()]);
    setRefreshing(false);
  }, [fetchProfile, fetchPosts]);

  // Follow / Unfollow toggle
  const handleFollowToggle = useCallback(async () => {
    if (!profile || !userId || followLoading) return;
    setFollowLoading(true);

    const wasFollowing = profile.is_following;
    // Optimistic update
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            is_following: !wasFollowing,
            follower_count: prev.follower_count + (wasFollowing ? -1 : 1),
          }
        : prev,
    );

    try {
      if (wasFollowing) {
        await api.social.unfollow(userId);
      } else {
        await api.social.follow(userId);
      }
    } catch {
      // Revert on failure
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: wasFollowing,
              follower_count: prev.follower_count + (wasFollowing ? 1 : -1),
            }
          : prev,
      );
    } finally {
      setFollowLoading(false);
    }
  }, [profile, userId, followLoading]);

  const handleMenuPress = (key: string) => {
    switch (key) {
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'marketplace':
        // Navigate to Coach Marketplace (placeholder)
        break;
      default:
        // Other menu items are placeholders for now
        break;
    }
  };

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error || 'Profile not found'}
        </Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={loadAll}>
          <Text style={[styles.retryText, { color: theme.colors.textInverse }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderHeader = () => (
    <View>
      {/* Avatar + Name + Handle + Bio */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: profile.avatar_color || theme.colors.primary }]}>
          <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.name, { color: theme.colors.text, ...theme.typography.heading2 }]}>
          {profile.name}
        </Text>
        <Text style={[styles.handle, { color: theme.colors.textSecondary, ...theme.typography.body }]}>
          @{profile.handle}
        </Text>
        {profile.bio ? (
          <Text style={[styles.bio, { color: theme.colors.text, ...theme.typography.body }]}>
            {profile.bio}
          </Text>
        ) : null}
      </View>

      {/* Stat Row */}
      <View style={[styles.statRow, { borderColor: theme.colors.borderLight }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text, ...theme.typography.heading3 }]}>
            {profile.streak}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
            Streak
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.text, ...theme.typography.heading3 }]}>
            {profile.post_count}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
            Posts
          </Text>
        </View>
        <TouchableOpacity
          style={styles.statItem}
          onPress={() =>
            navigation.navigate('FollowList', { userId: profile.id, initialTab: 'followers' })
          }
        >
          <Text style={[styles.statValue, { color: theme.colors.text, ...theme.typography.heading3 }]}>
            {profile.follower_count}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statItem}
          onPress={() =>
            navigation.navigate('FollowList', { userId: profile.id, initialTab: 'following' })
          }
        >
          <Text style={[styles.statValue, { color: theme.colors.text, ...theme.typography.heading3 }]}>
            {profile.following_count}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.primary, ...theme.typography.button }]}>
              Edit
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                profile.is_following
                  ? { borderColor: theme.colors.border }
                  : { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: profile.is_following ? theme.colors.text : theme.colors.textInverse,
                    ...theme.typography.button,
                  },
                ]}
              >
                {profile.is_following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: theme.colors.border, marginLeft: 12 }]}
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.text, ...theme.typography.button }]}>
                Message
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Menu (own profile only) */}
      {isOwnProfile ? (
        <View style={[styles.menuSection, { borderTopColor: theme.colors.borderLight }]}>
          {OWN_MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, { borderBottomColor: theme.colors.borderLight }]}
              onPress={() => handleMenuPress(item.key)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, { color: theme.colors.text, ...theme.typography.body }]}>
                {item.label}
              </Text>
              <Text style={[styles.menuChevron, { color: theme.colors.textSecondary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Posts section header */}
      <View style={styles.postsHeader}>
        <Text style={[styles.postsTitle, { color: theme.colors.text, ...theme.typography.heading3 }]}>
          Posts
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPressAuthor={(p) => {
              // Don't navigate to self
              if (p.id !== profile.id) {
                navigation.push('Profile' as any, { userId: p.id });
              }
            }}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, ...theme.typography.body }]}>
              No posts yet
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    marginBottom: 4,
  },
  handle: {
    marginBottom: 8,
  },
  bio: {
    textAlign: 'center',
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    marginBottom: 2,
  },
  statLabel: {},
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  actionButtonText: {
    textAlign: 'center',
  },
  menuSection: {
    borderTopWidth: 1,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
  },
  menuChevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  postsHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  postsTitle: {},
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {},
});
