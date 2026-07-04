import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { ProgressRing } from '../components/ProgressRing';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types — server-computed goal detail shape (snake_case wire format)
// ---------------------------------------------------------------------------

interface Milestone {
  id: string;
  goal_id: string;
  percent: number;
  reached: boolean;
  reached_at: string | null;
}

interface Squadmate {
  id: string;
  name: string;
  avatar_color: string;
}

interface GoalDetail {
  id: string;
  category: string;
  description: string;
  deadline: string;
  cadence: 'daily' | 'weekly' | 'custom';
  target_checkins: number;
  completed_checkins: number;
  current_streak: number;
  total_checkins: number;
  checkin_status: 'available' | 'done_today' | 'complete';
  visibility: 'public' | 'squad';
  milestones: Milestone[];
  squadmates: Squadmate[];
}

type GoalDetailRouteParams = {
  GoalDetail: { goalId: string };
};

// ---------------------------------------------------------------------------
// GoalDetailScreen
// ---------------------------------------------------------------------------

export function GoalDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<GoalDetailRouteParams, 'GoalDetail'>>();
  const { goalId } = route.params;

  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkinInflight, setCheckinInflight] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch goal detail
  // -------------------------------------------------------------------------

  const fetchGoalDetail = useCallback(async () => {
    try {
      setError(null);
      const data = (await api.goals.detail(goalId)) as GoalDetail;
      setGoal(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load goal details');
    }
  }, [goalId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchGoalDetail();
      setLoading(false);
    })();
  }, [fetchGoalDetail]);

  // -------------------------------------------------------------------------
  // Check-in handler — disabled during in-flight request
  // -------------------------------------------------------------------------

  const handleCheckin = useCallback(async () => {
    if (!goal || checkinInflight) return;

    setCheckinInflight(true);
    try {
      await api.goals.checkin(goalId);

      // Update local state on success
      setGoal((prev) => {
        if (!prev) return prev;
        const newCompleted = prev.completed_checkins + 1;
        const isComplete = newCompleted >= prev.target_checkins;
        return {
          ...prev,
          completed_checkins: newCompleted,
          current_streak: prev.current_streak + 1,
          total_checkins: prev.total_checkins + 1,
          checkin_status: isComplete ? ('complete' as const) : ('done_today' as const),
        };
      });
    } catch (err: any) {
      setError(err?.message ?? 'Check-in failed. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setCheckinInflight(false);
    }
  }, [goal, checkinInflight, goalId]);

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------

  const handleShareMilestoneCard = () => {
    navigation.navigate('MilestoneCard', { goalId });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error && !goal) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={[styles.backButtonText, { color: theme.colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.errorContent}>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={async () => {
              setLoading(true);
              await fetchGoalDetail();
              setLoading(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.textInverse }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!goal) return null;

  // -------------------------------------------------------------------------
  // Compute progress
  // -------------------------------------------------------------------------

  const progress =
    goal.target_checkins > 0 ? goal.completed_checkins / goal.target_checkins : 0;

  // Milestones at 25/50/75/100% — server provides these from milestones table
  const milestoneCheckpoints = [25, 50, 75, 100];

  // -------------------------------------------------------------------------
  // Check-in button render
  // -------------------------------------------------------------------------

  const renderCheckinButton = () => {
    switch (goal.checkin_status) {
      case 'available':
        return (
          <TouchableOpacity
            style={[
              styles.checkinButton,
              { backgroundColor: theme.colors.primary },
              checkinInflight && { opacity: 0.6 },
            ]}
            onPress={handleCheckin}
            disabled={checkinInflight}
            activeOpacity={0.7}
          >
            {checkinInflight ? (
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
          <View style={[styles.checkinButton, { backgroundColor: theme.colors.disabled }]}>
            <Text style={[styles.checkinButtonText, { color: theme.colors.textSecondary }]}>
              Done today
            </Text>
          </View>
        );

      case 'complete':
        return (
          <View style={[styles.checkinButton, { backgroundColor: theme.colors.success }]}>
            <Text style={[styles.checkinButtonText, { color: theme.colors.textInverse }]}>
              Goal complete!
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with back button */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.colors.text }]}>← Back</Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {goal.category}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Error toast (non-blocking) */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error }]}>
          <Text style={[styles.errorBannerText, { color: theme.colors.textInverse }]}>
            {error}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section — large ProgressRing */}
        <View style={styles.heroSection}>
          <ProgressRing
            progress={progress}
            size={120}
            strokeWidth={10}
            color={
              goal.checkin_status === 'complete'
                ? theme.colors.success
                : theme.colors.primary
            }
            trackColor={theme.colors.borderLight}
          />
          <Text
            style={[styles.goalDescription, { color: theme.colors.text }]}
            numberOfLines={3}
          >
            {goal.description}
          </Text>
        </View>

        {/* Stat row */}
        <View style={[styles.statRow, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {goal.completed_checkins}/{goal.target_checkins}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Progress
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {goal.current_streak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Streak
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.colors.borderLight }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {goal.total_checkins}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Check-ins
            </Text>
          </View>
        </View>

        {/* Milestone checkpoints at 25/50/75/100% */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Milestones
          </Text>
          <View style={styles.milestonesContainer}>
            {milestoneCheckpoints.map((percent) => {
              const milestone = goal.milestones.find((m) => m.percent === percent);
              const isReached = milestone?.reached ?? false;

              return (
                <View key={percent} style={styles.milestoneItem}>
                  <View
                    style={[
                      styles.milestoneCircle,
                      isReached
                        ? { backgroundColor: theme.colors.primary }
                        : {
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderColor: theme.colors.borderLight,
                          },
                    ]}
                  >
                    {isReached && (
                      <Text style={styles.milestoneCheck}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.milestoneLabel,
                      {
                        color: isReached
                          ? theme.colors.text
                          : theme.colors.textSecondary,
                      },
                    ]}
                  >
                    {percent}%
                  </Text>
                </View>
              );
            })}
          </View>
          {/* Connecting line between milestones */}
          <View style={styles.milestoneLineContainer}>
            <View
              style={[styles.milestoneLine, { backgroundColor: theme.colors.borderLight }]}
            />
          </View>
        </View>

        {/* Related squadmates */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Squadmates
          </Text>
          {goal.squadmates.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.squadmatesRow}
            >
              {goal.squadmates.map((mate) => (
                <View key={mate.id} style={styles.squadmateItem}>
                  <View
                    style={[
                      styles.squadmateAvatar,
                      { backgroundColor: mate.avatar_color || theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.squadmateInitial}>
                      {mate.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <Text
                    style={[styles.squadmateName, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {mate.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.emptySquadmates, { color: theme.colors.textSecondary }]}>
              No squadmates on this goal yet
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actionsSection}>
          {/* Check-in button */}
          {renderCheckinButton()}

          {/* Share to Milestone Card */}
          <TouchableOpacity
            style={[styles.shareButton, { borderColor: theme.colors.primary }]}
            onPress={handleShareMilestoneCard}
            activeOpacity={0.7}
          >
            <Text style={[styles.shareButtonText, { color: theme.colors.primary }]}>
              Share Milestone Card
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  goalDescription: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  milestonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  milestoneItem: {
    alignItems: 'center',
  },
  milestoneCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  milestoneCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  milestoneLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  milestoneLineContainer: {
    position: 'absolute',
    top: 48,
    left: 40,
    right: 40,
    zIndex: 0,
  },
  milestoneLine: {
    height: 2,
    width: '100%',
  },
  squadmatesRow: {
    paddingVertical: 4,
  },
  squadmateItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 56,
  },
  squadmateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  squadmateInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  squadmateName: {
    fontSize: 11,
    textAlign: 'center',
  },
  emptySquadmates: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  actionsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    gap: 12,
  },
  checkinButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
