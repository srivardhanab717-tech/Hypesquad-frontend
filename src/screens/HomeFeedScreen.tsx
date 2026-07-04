import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { PostCard, PostData } from '../components/PostCard';
import { EmptyState } from '../components/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoryItem {
  id: string;
  name: string;
  avatar_color: string;
  streak: number;
  checked_in_today: boolean;
  is_self: boolean;
}

interface FeedResponse {
  posts: PostData[];
  next_cursor: string | null;
}

// ---------------------------------------------------------------------------
// Quick Access Row items
// ---------------------------------------------------------------------------

const QUICK_ACCESS = [
  { label: 'AI Coach', icon: '🤖', route: 'AICoach' },
  { label: 'Reels', icon: '🎬', route: 'ReelsFeed' },
  { label: 'Discover', icon: '🔍', route: 'Discover' },
  { label: 'Body Double', icon: '👥', route: 'BodyDouble' },
] as const;

// ---------------------------------------------------------------------------
// HomeFeedScreen
// ---------------------------------------------------------------------------

export function HomeFeedScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  // Feed state
  const [posts, setPosts] = useState<PostData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const hasMore = useRef(true);

  // Stories state
  const [stories, setStories] = useState<StoryItem[]>([]);

  // ---------------------------
  // Data fetching
  // ---------------------------

  const fetchFeed = useCallback(
    async (cursorParam?: string) => {
      const res = (await api.feed.list(cursorParam)) as FeedResponse;
      return res;
    },
    [],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchFeed();
      setPosts(res.posts);
      setCursor(res.next_cursor);
      hasMore.current = !!res.next_cursor;
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchFeed]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(false);
    try {
      const res = await fetchFeed();
      setPosts(res.posts);
      setCursor(res.next_cursor);
      hasMore.current = !!res.next_cursor;
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchFeed]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore.current || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetchFeed(cursor);
      setPosts((prev) => [...prev, ...res.posts]);
      setCursor(res.next_cursor);
      hasMore.current = !!res.next_cursor;
    } catch {
      // Load-more failures are non-critical; user can scroll again to retry
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, fetchFeed, loadingMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ---------------------------
  // Navigation callbacks
  // ---------------------------

  const handlePressAuthor = useCallback(
    (post: PostData) => {
      navigation.push('Profile', { userId: (post as any).author_id });
    },
    [navigation],
  );

  const handlePressGoal = useCallback(
    (post: PostData) => {
      navigation.push('GoalDetail', { goalId: (post as any).goal_id });
    },
    [navigation],
  );

  const handleQuickAccess = useCallback(
    (route: string) => {
      navigation.push(route);
    },
    [navigation],
  );

  // ---------------------------
  // Render helpers
  // ---------------------------

  const renderStoryItem = (item: StoryItem) => (
    <View key={item.id} style={styles.storyItem}>
      <View
        style={[
          styles.storyAvatar,
          {
            backgroundColor: item.avatar_color || theme.colors.primary,
            borderColor: item.checked_in_today
              ? theme.colors.success
              : theme.colors.border,
          },
        ]}
      >
        <Text style={styles.storyAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text
        style={[
          styles.storyName,
          { color: theme.colors.text, ...theme.typography.caption },
        ]}
        numberOfLines={1}
      >
        {item.is_self ? 'You' : item.name.split(' ')[0]}
      </Text>
      <Text
        style={[
          styles.storyStreak,
          { color: theme.colors.primary, ...theme.typography.caption },
        ]}
      >
        🔥{item.streak}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Stories bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.storiesContainer,
          { borderBottomColor: theme.colors.borderLight },
        ]}
        style={styles.storiesScroll}
      >
        {stories.map(renderStoryItem)}
      </ScrollView>

      {/* Quick-access row */}
      <View style={[styles.quickAccessRow, { borderBottomColor: theme.colors.borderLight }]}>
        {QUICK_ACCESS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.quickAccessItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleQuickAccess(item.route)}
          >
            <Text style={styles.quickAccessIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.quickAccessLabel,
                { color: theme.colors.text, ...theme.typography.caption },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        icon="📭"
        title="No posts yet"
        subtitle="Follow some people or join a squad to see their updates here."
      />
    );
  };

  // ---------------------------
  // Main render
  // ---------------------------

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="⚠️"
          title="Something went wrong"
          subtitle="Could not load your feed. Please try again."
        />
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadInitial}
          activeOpacity={0.7}
        >
          <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPressAuthor={handlePressAuthor}
            onPressGoal={handlePressGoal}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  // Stories
  storiesScroll: {},
  storiesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 60,
  },
  storyAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  storyName: {
    marginTop: 4,
    textAlign: 'center',
  },
  storyStreak: {
    marginTop: 2,
  },
  // Quick access
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  quickAccessItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 72,
  },
  quickAccessIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickAccessLabel: {
    textAlign: 'center',
  },
  // Footer
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  // Retry
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
