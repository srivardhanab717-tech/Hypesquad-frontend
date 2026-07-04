import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { EmptyState } from '../components/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardUser {
  user_id: string;
  name: string;
  avatar_color: string;
  rank: number;
  score: number;
}

type Scope = 'squad' | 'global';
type Metric = 'streak' | 'hype';

// ---------------------------------------------------------------------------
// LeaderboardScreen
// ---------------------------------------------------------------------------

export function LeaderboardScreen() {
  const { theme } = useTheme();

  const [scope, setScope] = useState<Scope>('global');
  const [metric, setMetric] = useState<Metric>('streak');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = (await api.leaderboard(scope, metric)) as LeaderboardUser[];
      setUsers(data ?? []);
    } catch {
      setError(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [scope, metric]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // -------------------------------------------------------------------------
  // Podium (top 3)
  // -------------------------------------------------------------------------

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  function renderPodium() {
    if (top3.length === 0) return null;

    // Display order: 2nd | 1st | 3rd for the classic podium layout
    const ordered = [top3[1], top3[0], top3[2]].filter(Boolean);
    const podiumHeights = [80, 110, 60]; // 2nd, 1st, 3rd

    return (
      <View style={styles.podiumContainer}>
        {ordered.map((user, idx) => {
          const originalRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          const height = podiumHeights[idx];
          return (
            <View key={user.user_id} style={styles.podiumSlot}>
              {/* Avatar */}
              <View
                style={[
                  styles.podiumAvatar,
                  {
                    backgroundColor: user.avatar_color || theme.colors.primary,
                    width: originalRank === 1 ? 64 : 52,
                    height: originalRank === 1 ? 64 : 52,
                    borderRadius: originalRank === 1 ? 32 : 26,
                  },
                ]}
              >
                <Text style={[styles.podiumAvatarText, { color: theme.colors.textInverse }]}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              {/* Name */}
              <Text
                style={[styles.podiumName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {user.name}
              </Text>
              {/* Score */}
              <Text style={[styles.podiumScore, { color: theme.colors.primary }]}>
                {user.score}
              </Text>
              {/* Podium bar */}
              <View
                style={[
                  styles.podiumBar,
                  {
                    height,
                    backgroundColor:
                      originalRank === 1
                        ? theme.colors.primary
                        : originalRank === 2
                        ? theme.colors.primaryLight
                        : theme.colors.primaryDark,
                  },
                ]}
              >
                <Text style={[styles.podiumRank, { color: theme.colors.textInverse }]}>
                  {originalRank}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Ranked list item
  // -------------------------------------------------------------------------

  function renderItem({ item }: { item: LeaderboardUser }) {
    return (
      <View style={[styles.listItem, { borderBottomColor: theme.colors.borderLight }]}>
        <Text style={[styles.rankNumber, { color: theme.colors.textSecondary }]}>
          {item.rank}
        </Text>
        <View
          style={[
            styles.listAvatar,
            { backgroundColor: item.avatar_color || theme.colors.primary },
          ]}
        >
          <Text style={[styles.listAvatarText, { color: theme.colors.textInverse }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.listName, { color: theme.colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.listScore, { color: theme.colors.primary }]}>{item.score}</Text>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Toggle component
  // -------------------------------------------------------------------------

  function Toggle<T extends string>({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: T }[];
    value: T;
    onChange: (v: T) => void;
  }) {
    return (
      <View style={[styles.toggleRow, { backgroundColor: theme.colors.surface }]}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.toggleButton,
                active && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => onChange(opt.value)}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: active ? theme.colors.textInverse : theme.colors.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Text style={[styles.header, { color: theme.colors.text, ...theme.typography.heading2 }]}>
        Leaderboard
      </Text>

      {/* Toggles */}
      <View style={styles.togglesContainer}>
        <Toggle
          options={[
            { label: 'Squad', value: 'squad' as Scope },
            { label: 'Global', value: 'global' as Scope },
          ]}
          value={scope}
          onChange={setScope}
        />
        <View style={{ width: 12 }} />
        <Toggle
          options={[
            { label: 'Streak', value: 'streak' as Metric },
            { label: 'Hype', value: 'hype' as Metric },
          ]}
          value={metric}
          onChange={setMetric}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
            Could not load the leaderboard.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchLeaderboard}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : users.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No rankings yet"
          subtitle="Check back once more people join!"
        />
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          ListHeaderComponent={renderPodium}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  togglesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    flex: 1,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Podium
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  podiumSlot: {
    alignItems: 'center',
    flex: 1,
  },
  podiumAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  podiumAvatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    maxWidth: 80,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  podiumBar: {
    width: '70%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRank: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Ranked list
  listContent: {
    paddingBottom: 32,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankNumber: {
    width: 32,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  listScore: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
