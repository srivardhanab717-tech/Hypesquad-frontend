import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import type { PostInput } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Goal {
  id: string;
  description: string;
  category: string;
}

type PostType = 'win' | 'progress' | 'needs_hype';
type Visibility = 'public' | 'squad';
type AttachmentType = 'photo' | 'progress_snapshot' | 'milestone';

// ---------------------------------------------------------------------------
// NewPostScreen
// ---------------------------------------------------------------------------

export function NewPostScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  // Form state
  const [body, setBody] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [postType, setPostType] = useState<PostType>('progress');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentType | null>(null);

  // Data state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  // AI draft state
  const [aiLoading, setAiLoading] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch user's goals on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      setGoalsLoading(true);
      const data = (await api.goals.mine()) as Goal[];
      setGoals(data);
    } catch {
      // Silently fail — goals picker will be empty
    } finally {
      setGoalsLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // AI Draft Assist
  // ---------------------------------------------------------------------------

  async function handleAiDraft() {
    if (!selectedGoal) {
      Alert.alert('Tag a goal first', 'AI draft assist needs a goal to write about.');
      return;
    }

    try {
      setAiLoading(true);
      const result = (await api.posts.draftAssist(selectedGoal.id)) as { draft: string };
      if (result?.draft) {
        setBody(result.draft);
      }
    } catch {
      Alert.alert('Error', 'Could not generate AI draft. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Share / Submit
  // ---------------------------------------------------------------------------

  async function handleShare() {
    if (!body.trim()) return;

    const input: PostInput = {
      body: body.trim(),
      ...(selectedGoal ? { goal_id: selectedGoal.id } : {}),
      type: postType,
      ...(selectedAttachment ? { attachment_url: `placeholder://${selectedAttachment}` } : {}),
    };

    try {
      setSubmitting(true);
      await api.posts.create(input);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const postTypes: { key: PostType; label: string }[] = [
    { key: 'win', label: 'Win' },
    { key: 'progress', label: 'Progress' },
    { key: 'needs_hype', label: 'Needs Hype' },
  ];

  const visibilityOptions: { key: Visibility; label: string }[] = [
    { key: 'public', label: 'Public' },
    { key: 'squad', label: 'Squad' },
  ];

  const attachmentOptions: { key: AttachmentType; label: string }[] = [
    { key: 'photo', label: 'Photo' },
    { key: 'progress_snapshot', label: 'Progress Snapshot' },
    { key: 'milestone', label: 'Milestone' },
  ];

  const shareDisabled = !body.trim() || submitting;

  // ---------------------------------------------------------------------------
  // Styles (theme-aware)
  // ---------------------------------------------------------------------------

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerText: {
      ...theme.typography.heading2,
      color: theme.colors.text,
    },
    sectionLabel: {
      ...theme.typography.captionBold,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
      marginTop: theme.spacing.md,
    },
    composerInput: {
      ...theme.typography.body,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: theme.spacing.md,
      minHeight: 140,
      textAlignVertical: 'top' as const,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={dynamicStyles.headerText}>New Post</Text>
        <TouchableOpacity
          onPress={handleShare}
          disabled={shareDisabled}
          style={[
            styles.shareButton,
            { backgroundColor: shareDisabled ? theme.colors.disabled : theme.colors.primary },
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.colors.textInverse} />
          ) : (
            <Text style={[styles.shareButtonText, { color: theme.colors.textInverse }]}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ padding: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Text Composer */}
        <TextInput
          style={dynamicStyles.composerInput}
          placeholder="What's happening with your goals?"
          placeholderTextColor={theme.colors.textSecondary}
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={2000}
        />

        {/* AI Draft Assist Button */}
        <TouchableOpacity
          onPress={handleAiDraft}
          disabled={aiLoading}
          style={[
            styles.aiButton,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.primary,
              opacity: aiLoading ? 0.6 : 1,
            },
          ]}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.aiButtonText, { color: theme.colors.primary }]}>
              Help me write this
            </Text>
          )}
        </TouchableOpacity>

        {/* Goal Tag Selector */}
        <Text style={dynamicStyles.sectionLabel}>GOAL TAG</Text>
        {selectedGoal ? (
          <View style={[styles.goalChip, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.goalChipText, { color: theme.colors.textInverse }]}>
              {selectedGoal.description}
            </Text>
            <TouchableOpacity onPress={() => setSelectedGoal(null)}>
              <Text style={{ color: theme.colors.textInverse, marginLeft: 8 }}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowGoalPicker(!showGoalPicker)}
            style={[styles.goalPickerButton, { borderColor: theme.colors.border }]}
          >
            <Text style={{ color: theme.colors.textSecondary }}>
              {goalsLoading ? 'Loading goals...' : 'Select a goal'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Goal picker dropdown */}
        {showGoalPicker && !goalsLoading && (
          <View style={[styles.goalDropdown, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
            {goals.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary, padding: theme.spacing.sm }}>
                No goals yet
              </Text>
            ) : (
              goals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => {
                    setSelectedGoal(goal);
                    setShowGoalPicker(false);
                  }}
                  style={[styles.goalOption, { borderBottomColor: theme.colors.borderLight }]}
                >
                  <Text style={{ color: theme.colors.text }}>{goal.description}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                    {goal.category}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Post Type Selector */}
        <Text style={dynamicStyles.sectionLabel}>POST TYPE</Text>
        <View style={styles.chipRow}>
          {postTypes.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setPostType(key)}
              style={[
                styles.chip,
                {
                  backgroundColor: postType === key ? theme.colors.primary : theme.colors.surface,
                  borderColor: postType === key ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: postType === key ? theme.colors.textInverse : theme.colors.text,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Attachment Options */}
        <Text style={dynamicStyles.sectionLabel}>ATTACHMENTS</Text>
        <View style={styles.chipRow}>
          {attachmentOptions.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedAttachment(selectedAttachment === key ? null : key)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    selectedAttachment === key ? theme.colors.primary : theme.colors.surface,
                  borderColor:
                    selectedAttachment === key ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    selectedAttachment === key ? theme.colors.textInverse : theme.colors.text,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Visibility Selector */}
        <Text style={dynamicStyles.sectionLabel}>VISIBILITY</Text>
        <View style={styles.chipRow}>
          {visibilityOptions.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setVisibility(key)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    visibility === key ? theme.colors.primary : theme.colors.surface,
                  borderColor: visibility === key ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: visibility === key ? theme.colors.textInverse : theme.colors.text,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Static styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  shareButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  aiButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  goalChipText: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 200,
  },
  goalPickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  goalDropdown: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
  },
  goalOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  chipRow: {
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
});
