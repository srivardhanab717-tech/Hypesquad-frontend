import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FollowUser {
  id: string;
  name: string;
  avatar_color: string;
  current_goal: string | null;
  streak: number;
  is_following: boolean;
}

type RootParams = {
  FollowList: { userId: string; initialTab: 'followers' | 'following' };
  Profile: { userId?: string };
};

type FollowListRouteProp = RouteProp<RootParams, 'FollowList'>;
type NavigationProp = NativeStackNavigationProp<RootParams>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FollowListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FollowListRouteProp>();

  const { userId, initialTab } = route.params;
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followInFlight, setFollowInFlight] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [followersData, followingData] = await Promise.all([
        api.social.followers(userId),
        api.social.following(userId),
      ]);
      setFollowers((followersData as FollowUser[]) ?? []);
      setFollowing((followingData as FollowUser[]) ?? []);
    } catch {
      // Handled by empty state
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optimistic follow/unfollow
  const handleToggleFollow = useCallback(
    async (targetUser: FollowUser) => {
      if (followInFlight.has(targetUser.id)) return;

      setFollowInFlight((prev) => new Set(prev).add(targetUser.id));

      const wasFollowing = targetUser.is_following;

      // Optimistic UI update in both lists
      const updateList = (list: FollowUser[]) =>
        list.map((u) => (u.id === targetUser.id ? { ...u, is_following: !wasFollowing } : u));

      setFollowers(updateList);
      setFollowing(updateList);

      try {
        if (wasFollowing) {
          await api.social.unfollow(targetUser.id);
        } else {
          await api.social.follow(targetUser.id);
        }
      } catch {
        // Revert on failure
        const revertList = (list: FollowUser[]) =>
          list.map((u) => (u.id === targetUser.id ? { ...u, is_following: wasFollowing } : u));
        setFollowers(revertList);
        setFollowing(revertList);
      } finally {
        setFollowInFlight((prev) => {
          const next = new Set(prev);
          next.delete(targetUser.id);
          return next;
        });
      }
    },
    [followInFlight],
  );

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderRow = ({ item }: { item: FollowUser }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.colors.borderLight }]}
      onPress={() => navigation.push('Profile', { userId: item.id })}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: item.avatar_color || theme.colors.primary }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.userName, { color: theme.colors.text, ...theme.typography.bodyBold }]}>
          {item.name}
        </Text>
        {item.current_goal ? (
          <Text
            style={[styles.goal, { color: theme.colors.textSecondary, ...theme.typography.caption }]}
            numberOfLines={1}
          >
            🎯 {item.current_goal}
          </Text>
        ) : null}
        <Text style={[styles.streak, { color: theme.colors.primary, ...theme.typography.caption }]}>
          🔥 {item.streak} day streak
        </Text>
      </View>

      {/* Follow/Unfollow button */}
      <TouchableOpacity
        style={[
          styles.followButton,
          item.is_following
            ? { borderColor: theme.colors.border }
            : { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
        ]}
        onPress={() => handleToggleFollow(item)}
        disabled={followInFlight.has(item.id)}
      >
        <Text
          style={[
            styles.followButtonText,
            {
              color: item.is_following ? theme.colors.text : theme.colors.textInverse,
              ...theme.typography.captionBold,
            },
          ]}
        >
          {item.is_following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const currentList = activeTab === 'followers' ? followers : following;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'followers' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('followers')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'followers' ? theme.colors.primary : theme.colors.textSecondary,
                ...theme.typography.bodyBold,
              },
            ]}
          >
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'following' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('following')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'following' ? theme.colors.primary : theme.colors.textSecondary,
                ...theme.typography.bodyBold,
              },
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderRow}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary, ...theme.typography.body }]}>
                {activeTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingTop: 48,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {},
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {},
  goal: {
    marginTop: 2,
  },
  streak: {
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  followButtonText: {},
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {},
});
