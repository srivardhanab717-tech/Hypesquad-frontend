import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MilestoneCardRouteParams = {
  MilestoneCard: { goalId: string; milestonePercent?: number };
};

interface MilestoneCardData {
  goal_id: string;
  milestone_percent: number;
  user_name: string;
  streak: number;
  achievement: string;
}

// ---------------------------------------------------------------------------
// Gradient presets for theme/gradient switcher
// ---------------------------------------------------------------------------

interface GradientPreset {
  id: string;
  name: string;
  colors: [string, string];
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'sunset', name: 'Sunset', colors: ['#FF6B35', '#FF2D87'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0077B6', '#00B4D8'] },
  { id: 'forest', name: 'Forest', colors: ['#2D6A4F', '#74C69D'] },
  { id: 'purple', name: 'Purple', colors: ['#7B2CBF', '#E0AAFF'] },
  { id: 'midnight', name: 'Midnight', colors: ['#1A1A2E', '#16213E'] },
];

// ---------------------------------------------------------------------------
// MilestoneCardScreen
// ---------------------------------------------------------------------------

export function MilestoneCardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MilestoneCardRouteParams, 'MilestoneCard'>>();
  const { goalId, milestonePercent } = route.params;

  const [cardData, setCardData] = useState<MilestoneCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGradient, setSelectedGradient] = useState<GradientPreset>(
    GRADIENT_PRESETS[0],
  );

  // -------------------------------------------------------------------------
  // Fetch card data from API
  // -------------------------------------------------------------------------

  const fetchCardData = useCallback(async () => {
    try {
      setError(null);
      const data = (await api.milestoneCards({
        goal_id: goalId,
        milestone_percent: milestonePercent ?? 50,
      })) as MilestoneCardData;
      setCardData(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to generate milestone card');
    }
  }, [goalId, milestonePercent]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchCardData();
      setLoading(false);
    })();
  }, [fetchCardData]);

  // -------------------------------------------------------------------------
  // Share handler — uses native share sheet
  // -------------------------------------------------------------------------

  const handleShare = useCallback(async () => {
    if (!cardData) return;

    const message = `${cardData.achievement} - ${cardData.user_name} on HypeSquad | ${cardData.streak} day streak!`;

    try {
      await Share.share({
        message,
        title: 'My HypeSquad Milestone',
      });
    } catch {
      // User cancelled or share failed — non-blocking
    }
  }, [cardData]);

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const handleGoBack = () => {
    navigation.goBack();
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Milestone Card
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}
          >
            Generating your card...
          </Text>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error && !cardData) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Milestone Card
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContent}>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Something went wrong
          </Text>
          <Text
            style={[styles.errorMessage, { color: theme.colors.textSecondary }]}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={async () => {
              setLoading(true);
              await fetchCardData();
              setLoading(false);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.retryButtonText, { color: theme.colors.textInverse }]}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!cardData) return null;

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Milestone Card
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Card preview */}
      <View style={styles.cardPreviewContainer}>
        <View
          style={[
            styles.cardPreview,
            { backgroundColor: selectedGradient.colors[0] },
          ]}
        >
          {/* Gradient overlay effect using a second color block */}
          <View
            style={[
              styles.cardGradientOverlay,
              { backgroundColor: selectedGradient.colors[1], opacity: 0.5 },
            ]}
          />

          {/* Card content */}
          <View style={styles.cardContent}>
            {/* Brand mark */}
            <Text style={styles.brandMark}>HypeSquad</Text>

            {/* Achievement info */}
            <Text style={styles.achievementText}>{cardData.achievement}</Text>

            {/* Milestone percentage */}
            <View style={styles.milestonePercentContainer}>
              <Text style={styles.milestonePercentText}>
                {cardData.milestone_percent}%
              </Text>
              <Text style={styles.milestonePercentLabel}>milestone reached!</Text>
            </View>

            {/* Streak */}
            <View style={styles.streakContainer}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>
                {cardData.streak} day streak
              </Text>
            </View>

            {/* User name */}
            <Text style={styles.userName}>{cardData.user_name}</Text>
          </View>
        </View>
      </View>

      {/* Theme/Gradient switcher */}
      <View style={styles.gradientSwitcherSection}>
        <Text
          style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
        >
          Choose a theme
        </Text>
        <View style={styles.gradientRow}>
          {GRADIENT_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.gradientButton,
                { backgroundColor: preset.colors[0] },
                selectedGradient.id === preset.id && styles.gradientButtonSelected,
              ]}
              onPress={() => setSelectedGradient(preset)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.gradientButtonInner,
                  { backgroundColor: preset.colors[1] },
                ]}
              />
              {selectedGradient.id === preset.id && (
                <View style={styles.gradientCheckContainer}>
                  <Text style={styles.gradientCheck}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Share button */}
      <View style={styles.shareSection}>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.shareButtonText, { color: theme.colors.textInverse }]}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>
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
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
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
  cardPreviewContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  cardPreview: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    zIndex: 1,
  },
  brandMark: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  achievementText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  milestonePercentContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  milestonePercentText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  milestonePercentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  gradientSwitcherSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gradientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  gradientButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientButtonInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    opacity: 0.7,
  },
  gradientButtonSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gradientCheckContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientCheck: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  shareSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  shareButton: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
