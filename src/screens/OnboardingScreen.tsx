import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

/**
 * OnboardingScreen
 *
 * First screen shown to unauthenticated users.
 * Shows the HypeSquad brand, tagline, waitlist count, and a single CTA
 * to proceed to the AuthScreen (phone OTP sign-in).
 */
export function OnboardingScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Logo / Brand */}
      <View style={styles.brandContainer}>
        <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.logoText, { color: theme.colors.textInverse }]}>H</Text>
        </View>
        <Text style={[styles.appName, theme.typography.heading1, { color: theme.colors.text }]}>
          HypeSquad
        </Text>
      </View>

      {/* Tagline */}
      <Text style={[styles.tagline, theme.typography.body, { color: theme.colors.textSecondary }]}>
        not Instagram, not LinkedIn
      </Text>

      {/* Waitlist count */}
      <View style={[styles.waitlistBadge, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.waitlistText, theme.typography.captionBold, { color: theme.colors.primary }]}>
          12,400+ on the waitlist
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Auth')}
        activeOpacity={0.8}
      >
        <Text style={[styles.ctaText, theme.typography.button, { color: theme.colors.textInverse }]}>
          Get Started
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
  },
  appName: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    marginBottom: 24,
  },
  waitlistBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 48,
  },
  waitlistText: {
    textAlign: 'center',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: {
    textAlign: 'center',
  },
});
