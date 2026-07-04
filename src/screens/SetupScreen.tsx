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
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  '#FF6B35',
  '#E53935',
  '#8E24AA',
  '#3949AB',
  '#00ACC1',
  '#43A047',
  '#F9A825',
  '#6D4C41',
];

const INTEREST_OPTIONS = [
  'Fitness',
  'Career',
  'Learning',
  'Creative',
  'Finance',
  'Wellness',
  'Reading',
  'Startup',
];

type Visibility = 'public' | 'squad';

// ---------------------------------------------------------------------------
// SetupScreen
// ---------------------------------------------------------------------------

export function SetupScreen() {
  const { theme } = useTheme();
  const { completeSetup } = useAuth();

  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [interests, setInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length > 0;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.profile.updateMe({
        name: name.trim(),
        avatar_color: avatarColor,
        interests,
        default_visibility: visibility,
      });
      completeSetup();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const colors = theme.colors;
  const typo = theme.typography;
  const sp = theme.spacing;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: sp.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Text style={[typo.heading1, { color: colors.text, marginBottom: sp.sm }]}>
        Set up your profile
      </Text>
      <Text
        style={[
          typo.body,
          { color: colors.textSecondary, marginBottom: sp.xl },
        ]}
      >
        Tell us a bit about yourself so we can personalise your experience.
      </Text>

      {/* Name Input */}
      <Text style={[typo.bodyBold, { color: colors.text, marginBottom: sp.xs }]}>
        Name *
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
        placeholder="Your name"
        placeholderTextColor={colors.disabled}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        editable={!isLoading}
      />

      {/* Avatar Colour Picker */}
      <Text style={[typo.bodyBold, { color: colors.text, marginBottom: sp.sm }]}>
        Avatar colour
      </Text>
      <View style={[styles.colorRow, { marginBottom: sp.lg }]}>
        {AVATAR_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => setAvatarColor(color)}
            disabled={isLoading}
            style={[
              styles.colorCircle,
              { backgroundColor: color },
              avatarColor === color && {
                borderWidth: 3,
                borderColor: colors.text,
              },
            ]}
          />
        ))}
      </View>

      {/* Interest Chips */}
      <Text style={[typo.bodyBold, { color: colors.text, marginBottom: sp.sm }]}>
        Interests
      </Text>
      <View style={[styles.chipGrid, { marginBottom: sp.lg }]}>
        {INTEREST_OPTIONS.map((interest) => {
          const selected = interests.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              onPress={() => toggleInterest(interest)}
              disabled={isLoading}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : colors.surface,
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
                {interest}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Default Visibility Toggle */}
      <Text style={[typo.bodyBold, { color: colors.text, marginBottom: sp.sm }]}>
        Default visibility
      </Text>
      <View style={[styles.visibilityRow, { marginBottom: sp.xl }]}>
        <TouchableOpacity
          onPress={() => setVisibility('public')}
          disabled={isLoading}
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
          disabled={isLoading}
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

      {/* Error State */}
      {error && (
        <View style={[styles.errorContainer, { marginBottom: sp.md }]}>
          <Text style={[typo.body, { color: colors.error }]}>{error}</Text>
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

      {/* Continue Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!isValid || isLoading}
        style={[
          styles.button,
          {
            backgroundColor: isValid && !isLoading ? colors.primary : colors.disabled,
            paddingVertical: sp.md,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={[typo.button, { color: colors.textInverse }]}>
            Continue
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
