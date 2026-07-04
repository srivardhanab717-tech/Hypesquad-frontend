import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ViewToken,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { EmptyState } from '../components/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationType =
  | 'hype'
  | 'comment'
  | 'follow'
  | 'squad_join'
  | 'squad_invite'
  | 'milestone'
  | 'ai_tip';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  hype: '🔥',
  comment: '💬',
  follow: '👤',
  squad_join: '🤝',
  squad_invite: '📩',
  milestone: '🏆',
  ai_tip: '🤖',
};

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ---------------------------------------------------------------------------
// NotificationsScreen
// ---------------------------------------------------------------------------

export function NotificationsScreen() {
  const { theme } = useTheme();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  // Track IDs we've already sent markRead for to avoid duplicate calls
  const markedReadIds = useRef<Set<string>>(new Set());

  // ---------------------------
  // Data fetching
  // ---------------------------

  const fetchNotifications = useCallback(async () => {
    try {
      setError(false);
      const res = (await api.notifications.list()) as Notification[];
      return res;
    } catch {
      setError(true);
      return [];
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const res = await fetchNotifications();
    setNotifications(res);
    setLoading(false);
  }, [fetchNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    markedReadIds.current.clear();
    const res = await fetchNotifications();
    setNotifications(res);
    setRefreshing(false);
  }, [fetchNotifications]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ---------------------------
  // Mark-read-on-view behavior
  // ---------------------------

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((viewable) => {
        const item = viewable.item as Notification;
        if (item && !item.is_read && !markedReadIds.current.has(item.id)) {
          markedReadIds.current.add(item.id);

          // Fire and forget — mark read on backend
          api.notifications.markRead(item.id).catch(() => {});

          // Update local state to show as read
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
          );
        }
      });
    },
  ).current;

  // ---------------------------
  // Render
  // ---------------------------

  const renderItem = ({ item }: { item: Notification }) => {
    const icon = NOTIFICATION_ICONS[item.type] || '🔔';

    return (
      <View
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.is_read
              ? theme.colors.background
              : theme.colors.surface,
            borderBottomColor: theme.colors.borderLight,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.message,
              {
                color: theme.colors.text,
                fontWeight: item.is_read ? '400' : '600',
              },
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.timestamp,
              { color: theme.colors.textSecondary },
            ]}
          >
            {formatTimestamp(item.created_at)}
          </Text>
        </View>
        {!item.is_read && (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]}
          />
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        icon="🔔"
        title="No notifications"
        subtitle="You're all caught up! Notifications for hypes, comments, followers, and more will appear here."
      />
    );
  };

  // ---------------------------
  // Loading state
  // ---------------------------

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ---------------------------
  // Error state
  // ---------------------------

  if (error && notifications.length === 0) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          Something went wrong
        </Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
          Could not load notifications.
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={loadInitial}
          activeOpacity={0.7}
        >
          <Text style={[styles.retryText, { color: '#FFFFFF' }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Notifications
        </Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : undefined
        }
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
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
