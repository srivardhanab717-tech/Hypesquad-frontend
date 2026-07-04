import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { ProgressRing } from '../components/ProgressRing';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types — server-computed goal shape (snake_case wire format)
// ---------------------------------------------------------------------------

interface Goal {
  id: string;
  category: string;
  description: string;
  deadline: string;
  cadence: 'daily' | 'weekly' | 'custom';
  target_checkins: number;
  completed_checkins: number;
  current_streak: number;
  /** Server-computed status — never derived client-side */
  checkin_status: 'available' | 'done_today' | 'complete';
  visibility: 'public' | 'squad';
}

// ---------------------------------------------------------------------------
// GoalDashboardScreen
// ---------------------------------------------------------------------------

export function GoalDashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Track which goal IDs have an in-flight check-in request */
  const [inflightCheckins, setInflightCheckins] = useState<Set<string>>(new Set());
  /** Track which goal IDs just celebrated (for animation trigger) */
  const [celebrating, setCelebrating] = useState<Set<string>>(new Set());

  // -------------------------------------------------------------------------
  // Fetch goals
  // -------------------------------------------------------------------------

  const fetchGoals = useCallback(async () => {
    try {
      setError(null);
      const data = (await api.goals.mine()) as Goal[];
      setGoals(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load goals');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchGoals();
      setLoading(false);
    })();
  }, [fetchGoals]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  }, [fetchGoals]);

  // -------------------------------------------------------------------------
  // Check-in handler — disable during in-flight, animate on success
  // -------------------------------------------------------------------------

  const handleCheckin = useCallback(
    async (goalId: string) => {
      // Prevent double-tap: if already in-flight, ignore
      if (inflightCheckins.has(goalId)) return;

      // Disable button immediately
      setInflightCheckins((prev) => new Set(prev).add(goalId));

      try {
        await api.goals.checkin(goalId);

        // On success: update local state optimistically
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== goalId) return g;
            const newCompleted = g.completed_checkins + 1;
            const isComplete = newCompleted >= g.target_checkins;
            return {
              ...g,
              completed_checkins: newCompleted,
              current_streak: g.current_streak + 1,
              checkin_status: isComplete ? 'complete' as const : 'done_today' as const,
            };
          }),
        );

        // Trigger celebration animation
        setCelebrating((prev) => new Set(prev).add(goalId));
        setTimeout(() => {
          setCelebrating((prev) => {
            const next = new Set(prev);
            next.delete(goalId);
            return next;
          });
        }, 1500);
      } catch (err: any) {
        // On failure: re-enable button, show error (via brief state)
        setError(err?.message ?? 'Check-in failed. Please try again.');
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      } finally {
        // Re-enable button (only matters on failure path — success disables via status change)
        setInflightCheckins((prev) => {
          const next = new Set(prev);
          next.delete(goalId);
          return next;
        });
      }
    },
    [inflightCheckins],
  );

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------

  const navigateToGoalCreation = () => {
    navigation.navigate('GoalCreation');
  };

  const navigateToGoalDetail = (goalId: string) => {
    navigation.navigate('GoalDetail', { goalId });
  };

  // -------------------------------------------------------------------------
  // Check-in button render helper
  // -------------------------------------------------------------------------

  const renderCheckinButton = (goal: Goal) => {
    const isInFlight = inflightCheckins.has(goal.id);

    switch (goal.checkin_status) {
      case 'available':
        return (
          <TouchableOpacity
            style={[
              styles.checkinButton,
              { backgroundColor: theme.colors.primary },
              isInFlight && { opacity: 0.6 },
            ]}
            onPress={() => handleCheckin(goal.id)}
            disabled={isInFlight}
            activeOpacity={0.7}
          >
            {isInFlight ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Text style={[styles.checkinButtonText, { color: theme.colors.textInverse }]}>
                Check in
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'done_today':
        return (
          <View
            style={[
              styles.checkinButton,
              { backgroundColor: theme.colors.disabled },
            ]}
          >
            <Text style={[styles.checkinButtonText, { color: theme.colors.textSecondary }]}>
              Done today
            </Text>
          </View>
        );

      case 'complete':
        return (
          <View
            style={[
              styles.checkinButton,
              { backgroundColor: theme.colors.success },
            ]}
          >
            <Text style={[styles.checkinButtonText, { color: theme.colors.textInverse }]}>
              Complete
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // -------------------------------------------------------------------------
  // Goal card
  // -------------------------------------------------------------------------

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const progress =
      item.target_checkins > 0
        ? item.completed_checkins / item.target_checkins
        : 0;

    const isCelebrating = celebrating.has(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.goalCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.borderLight,
          },
        ]}
        onPress={() => navigateToGoalDetail(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Progress Ring */}
          <View style={styles.progressContainer}>
            <ProgressRing
              progress={progress}
              size={56}
              strokeWidth={5}
              color={
                item.checkin_status === 'complete'
                  ? theme.colors.success
                  : theme.colors.primary
              }
              trackColor={theme.colors.borderLight}
            />
          </View>

          {/* Goal info */}
          <View style={styles.goalInfo}>
            <Text
              style={[styles.goalDescription, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            <View style={styles.streakRow}>
              <Text style={[styles.streakText, { color: theme.colors.textSecondary }]}>
                {item.current_streak} day streak
              </Text>
              <Text style={[styles.categoryBadge, { color: theme.colors.primary }]}>
                {item.category}
              </Text>
            </View>
          </View>

          {/* Check-in button */}
          <View style={styles.checkinContainer}>
            {renderCheckinButton(item)}
          </View>
        </View>

        {/* Celebration overlay */}
        {isCelebrating && (
          <View style={styles.celebrationOverlay}>
            <Text style={styles.celebrationEmoji}>✨🎉</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No goals yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Create your first commitment and start building momentum.
      </Text>
      <TouchableOpacity
        style={[styles.emptyCta, { backgroundColor: theme.colors.primary }]}
        onPress={navigateToGoalCreation}
        activeOpacity={0.7}
      >
        <Text style={[styles.emptyCtaText, { color: theme.colors.textInverse }]}>
          New commitment
        </Text>
      </TouchableOpacity>
    </View>
  );

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with New commitment CTA */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Goals</Text>
        <TouchableOpacity
          style={[styles.newCommitmentButton, { backgroundColor: theme.colors.primary }]}
          onPress={navigateToGoalCreation}
          activeOpacity={0.7}
        >
          <Text style={[styles.newCommitmentText, { color: theme.colors.textInverse }]}>
            + New commitment
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error toast */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error }]}>
          <Text style={[styles.errorText, { color: theme.colors.textInverse }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Goal list */}
      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoalCard}
        contentContainerStyle={goals.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  newCommitmentButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newCommitmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  goalCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
    marginRight: 12,
  },
  goalDescription: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 12,
    marginRight: 8,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  checkinContainer: {
    minWidth: 90,
    alignItems: 'flex-end',
  },
  checkinButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderRadius: 12,
  },
  celebrationEmoji: {
    fontSize: 28,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCta: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyCtaText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
