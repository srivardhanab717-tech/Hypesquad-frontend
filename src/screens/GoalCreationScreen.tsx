import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api, GoalInput } from '../lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'Fitness',
  'Career',
  'Learning',
  'Creative',
  'Finance',
  'Wellness',
  'Reading',
  'Startup',
];

const CADENCE_OPTIONS: Array<{ label: string; value: GoalInput['cadence'] }> = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Custom', value: 'custom' },
];

type Visibility = 'public' | 'squad';

interface Milestone {
  title: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// GoalCreationScreen
// ---------------------------------------------------------------------------

export function GoalCreationScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();

  // Form state
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [cadence, setCadence] = useState<GoalInput['cadence']>('daily');
  const [targetCheckins, setTargetCheckins] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');

  // AI milestone state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState<string | null>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const isValid =
    category.length > 0 &&
    description.trim().length > 0 &&
    deadline.trim().length > 0 &&
    targetCheckins.trim().length > 0 &&
    Number(targetCheckins) > 0;

  // ---------------------------------------------------------------------------
  // AI Milestone Plan
  // ---------------------------------------------------------------------------

  const handleGetMilestones = async () => {
    if (!isValid) {
      Alert.alert(
        'Incomplete Form',
        'Please fill in all required fields before generating milestones.',
      );
      return;
    }

    setMilestonesLoading(true);
    setMilestonesError(null);
    setMilestones([]);

    try {
      // Create the goal first (as draft), then fetch milestone plan
      const goalPayload: GoalInput = {
        category,
        description: description.trim(),
        deadline: deadline.trim(),
        cadence,
        target_checkins: Number(targetCheckins),
        visibility,
      };

      const created = (await api.goals.create(goalPayload)) as { id: string };
      const plan = (await api.goals.milestonePlan(created.id)) as {
        milestones: Milestone[];
      };

      // Display exactly 3 checkpoints
      const checkpoints = (plan.milestones || []).slice(0, 3);
      setMilestones(checkpoints);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate milestones';
      setMilestonesError(message);
    } finally {
      setMilestonesLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Submit Goal
  // ---------------------------------------------------------------------------

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const goalPayload: GoalInput = {
        category,
        description: description.trim(),
        deadline: deadline.trim(),
        cadence,
        target_checkins: Number(targetCheckins),
        visibility,
      };

      await api.goals.create(goalPayload);

      // Show confirmation briefly, then navigate
      setShowConfirmation(true);
      setTimeout(() => {
        setShowConfirmation(false);
        navigation.navigate('GoalDashboard');
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create goal';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const colors = theme.colors;
  const typo = theme.typography;
  const sp = theme.spacing;

  // Confirmation overlay
  if (showConfirmation) {
    return (
      <View
        style={[
          styles.confirmationContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[typo.heading1, { color: colors.success }]}>
          Goal Created!
        </Text>
        <Text
          style={[
            typo.body,
            { color: colors.textSecondary, marginTop: sp.sm },
          ]}
        >
          Redirecting to your dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: sp.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Text
        style={[typo.heading1, { color: colors.text, marginBottom: sp.sm }]}
      >
        New Commitment
      </Text>
      <Text
        style={[
          typo.body,
          { color: colors.textSecondary, marginBottom: sp.xl },
        ]}
      >
        Set a goal and let your squad hold you accountable.
      </Text>

      {/* Category Selector */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.sm }]}
      >
        Category *
      </Text>
      <View style={[styles.chipGrid, { marginBottom: sp.lg }]}>
        {CATEGORIES.map((cat) => {
          const selected = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              disabled={isSubmitting}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typo.caption,
                  {
                    color: selected ? colors.textInverse : colors.text,
                    fontWeight: selected ? '600' : '400',
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Description Input */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.xs }]}
      >
        Description *
      </Text>
      <TextInput
        style={[
          styles.input,
          styles.multilineInput,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.surface,
            paddingHorizontal: sp.md,
            paddingVertical: sp.sm + 4,
            marginBottom: sp.lg,
          },
        ]}
        placeholder="What do you want to achieve?"
        placeholderTextColor={colors.disabled}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        editable={!isSubmitting}
      />

      {/* Deadline Input */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.xs }]}
      >
        Deadline *
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.surface,
            paddingHorizontal: sp.md,
            paddingVertical: sp.sm + 4,
            marginBottom: sp.lg,
          },
        ]}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.disabled}
        value={deadline}
        onChangeText={setDeadline}
        editable={!isSubmitting}
        keyboardType={Platform.OS === 'ios' ? 'default' : 'default'}
      />

      {/* Cadence Selector */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.sm }]}
      >
        Cadence *
      </Text>
      <View style={[styles.cadenceRow, { marginBottom: sp.lg }]}>
        {CADENCE_OPTIONS.map((opt) => {
          const selected = cadence === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setCadence(opt.value)}
              disabled={isSubmitting}
              style={[
                styles.cadenceOption,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typo.button,
                  {
                    color: selected ? colors.textInverse : colors.text,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Target Check-in Count */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.xs }]}
      >
        Target Check-ins *
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.surface,
            paddingHorizontal: sp.md,
            paddingVertical: sp.sm + 4,
            marginBottom: sp.lg,
          },
        ]}
        placeholder="e.g. 30"
        placeholderTextColor={colors.disabled}
        value={targetCheckins}
        onChangeText={setTargetCheckins}
        keyboardType="number-pad"
        editable={!isSubmitting}
      />

      {/* Visibility Toggle */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.sm }]}
      >
        Visibility
      </Text>
      <View style={[styles.visibilityRow, { marginBottom: sp.xl }]}>
        <TouchableOpacity
          onPress={() => setVisibility('public')}
          disabled={isSubmitting}
          style={[
            styles.visibilityOption,
            {
              backgroundColor:
                visibility === 'public' ? colors.primary : colors.surface,
              borderColor:
                visibility === 'public' ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              typo.button,
              {
                color:
                  visibility === 'public' ? colors.textInverse : colors.text,
              },
            ]}
          >
            Public
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVisibility('squad')}
          disabled={isSubmitting}
          style={[
            styles.visibilityOption,
            {
              backgroundColor:
                visibility === 'squad' ? colors.primary : colors.surface,
              borderColor:
                visibility === 'squad' ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              typo.button,
              {
                color:
                  visibility === 'squad' ? colors.textInverse : colors.text,
              },
            ]}
          >
            Squad
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Milestone Plan Button */}
      <TouchableOpacity
        onPress={handleGetMilestones}
        disabled={milestonesLoading || isSubmitting}
        style={[
          styles.milestoneButton,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.primary,
            opacity: milestonesLoading || isSubmitting ? 0.6 : 1,
          },
        ]}
      >
        {milestonesLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[typo.button, { color: colors.primary }]}>
            AI Milestone Plan
          </Text>
        )}
      </TouchableOpacity>

      {/* Milestones Error */}
      {milestonesError && (
        <Text
          style={[
            typo.body,
            { color: colors.error, marginTop: sp.sm, textAlign: 'center' },
          ]}
        >
          {milestonesError}
        </Text>
      )}

      {/* Milestones Preview — 3 Checkpoints */}
      {milestones.length > 0 && (
        <View style={[styles.milestonesContainer, { marginTop: sp.md }]}>
          <Text
            style={[
              typo.heading3,
              { color: colors.text, marginBottom: sp.sm },
            ]}
          >
            AI-Suggested Checkpoints
          </Text>
          {milestones.map((milestone, index) => (
            <View
              key={index}
              style={[
                styles.milestoneCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <View style={[styles.milestoneNumber, { backgroundColor: colors.primary }]}>
                <Text style={[typo.captionBold, { color: colors.textInverse }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.milestoneContent}>
                <Text style={[typo.bodyBold, { color: colors.text }]}>
                  {milestone.title}
                </Text>
                {milestone.description && (
                  <Text
                    style={[
                      typo.caption,
                      { color: colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    {milestone.description}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Submit Error */}
      {submitError && (
        <View style={[styles.errorContainer, { marginTop: sp.md }]}>
          <Text style={[typo.body, { color: colors.error }]}>
            {submitError}
          </Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text
              style={[
                typo.bodyBold,
                { color: colors.primary, marginTop: sp.xs },
              ]}
            >
              Tap to retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!isValid || isSubmitting}
        style={[
          styles.submitButton,
          {
            backgroundColor:
              isValid && !isSubmitting ? colors.primary : colors.disabled,
            paddingVertical: sp.md,
            marginTop: sp.xl,
          },
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={[typo.button, { color: colors.textInverse }]}>
            Create Goal
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  confirmationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  cadenceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cadenceOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  milestoneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  milestonesContainer: {
    marginBottom: 8,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  milestoneNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  errorContainer: {
    alignItems: 'center',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
