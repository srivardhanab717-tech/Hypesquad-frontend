import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api, SquadInput } from '../lib/api';

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

const EMOJI_GRID = [
  '🔥', '💪', '🚀', '🎯', '📚', '💡', '🏆', '⚡',
  '🌟', '🎨', '💰', '🧘', '🏃', '🎸', '📈', '🤝',
  '✨', '🌈', '🦾', '🧠', '❤️', '🏅', '🎓', '💎',
];

type Visibility = 'public' | 'private';

// ---------------------------------------------------------------------------
// CreateSquadScreen
// ---------------------------------------------------------------------------

export function CreateSquadScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const typo = theme.typography;
  const sp = theme.spacing;

  // Form state
  const [emoji, setEmoji] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const isValid = name.trim().length > 0;

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const input: SquadInput = {
        emoji: emoji || '🔥',
        name: name.trim(),
        category: category || 'General',
        visibility,
      };

      await api.squads.create(input);

      // On success: navigate back to SquadBrowser (channels created server-side)
      navigation.goBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create squad';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
        Create a Squad
      </Text>
      <Text
        style={[
          typo.body,
          { color: colors.textSecondary, marginBottom: sp.xl },
        ]}
      >
        Build your accountability crew.
      </Text>

      {/* Emoji Picker */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.sm }]}
      >
        Pick an Emoji
      </Text>
      <View style={[styles.emojiGrid, { marginBottom: sp.lg }]}>
        {EMOJI_GRID.map((e) => {
          const selected = emoji === e;
          return (
            <TouchableOpacity
              key={e}
              onPress={() => setEmoji(e)}
              disabled={isSubmitting}
              style={[
                styles.emojiCell,
                {
                  backgroundColor: selected
                    ? colors.primaryLight
                    : colors.surface,
                  borderColor: selected ? colors.primary : 'transparent',
                },
              ]}
            >
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Name Input */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.xs }]}
      >
        Squad Name *
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
        placeholder="e.g. Morning Runners"
        placeholderTextColor={colors.disabled}
        value={name}
        onChangeText={setName}
        editable={!isSubmitting}
        maxLength={50}
      />

      {/* Category Selector */}
      <Text
        style={[typo.bodyBold, { color: colors.text, marginBottom: sp.sm }]}
      >
        Category
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

      {/* Visibility Toggle: public / private */}
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
          onPress={() => setVisibility('private')}
          disabled={isSubmitting}
          style={[
            styles.visibilityOption,
            {
              backgroundColor:
                visibility === 'private' ? colors.primary : colors.surface,
              borderColor:
                visibility === 'private' ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              typo.button,
              {
                color:
                  visibility === 'private' ? colors.textInverse : colors.text,
              },
            ]}
          >
            Private
          </Text>
        </TouchableOpacity>
      </View>

      {/* Submit Error */}
      {submitError && (
        <View style={styles.errorContainer}>
          <Text
            style={[
              typo.body,
              { color: colors.error, marginBottom: sp.sm, textAlign: 'center' },
            ]}
          >
            {submitError}
          </Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={[typo.bodyBold, { color: colors.primary }]}>
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
            marginTop: sp.lg,
          },
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={[typo.button, { color: colors.textInverse }]}>
            Create Squad
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
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
  errorContainer: {
    alignItems: 'center',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
