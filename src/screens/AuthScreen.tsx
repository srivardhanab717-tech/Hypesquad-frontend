import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api, OAuthPayload } from '../lib/api';
import { MOCK_AUTH } from '../config/dev';

/**
 * AuthScreen
 *
 * Full phone OTP sign-in flow:
 * 1. User enters phone number → "Send OTP" fires api.auth.requestOtp
 * 2. After OTP sent → shows 6-digit code input → "Verify" fires api.auth.verifyOtp
 * 3. On success, Supabase onAuthStateChange in AuthContext handles session + routing
 *
 * Secondary OAuth options: Google and Apple sign-in buttons.
 */

type AuthStep = 'phone' | 'otp';

export function AuthScreen() {
  console.log('[AuthScreen] MOCK_AUTH =', MOCK_AUTH);

  const { theme } = useTheme();
  const { signIn } = useAuth();

  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Phone step: request OTP ---
  const handleRequestOtp = () => {
    if (MOCK_AUTH) {
      signIn('mock');
      return;
    }
    // Real implementation (only runs when MOCK_AUTH is false)
    (async () => {
      if (!phone.trim()) {
        setError('Please enter your phone number');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        await api.auth.requestOtp(phone.trim());
        setStep('otp');
      } catch (err: any) {
        setError(err?.message ?? 'Failed to send OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  };

  // --- OTP step: verify code ---
  const handleVerifyOtp = () => {
    if (MOCK_AUTH) {
      signIn('mock');
      return;
    }
    (async () => {
      if (otpCode.length !== 6) {
        setError('Please enter the 6-digit code');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        await api.auth.verifyOtp(phone.trim(), otpCode);
      } catch (err: any) {
        setError(err?.message ?? 'Invalid code. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  };

  // --- OAuth sign-in ---
  const handleOAuth = (provider: 'google' | 'apple') => {
    if (MOCK_AUTH) {
      signIn('mock');
      return;
    }
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const payload: OAuthPayload = { id_token: '' };
        await api.auth.oauth(provider, payload);
      } catch (err: any) {
        setError(err?.message ?? `${provider} sign-in failed. Please try again.`);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={[styles.title, theme.typography.heading2, { color: theme.colors.text }]}>
          {step === 'phone' ? 'Sign in to HypeSquad' : 'Enter verification code'}
        </Text>
        <Text style={[styles.subtitle, theme.typography.body, { color: theme.colors.textSecondary }]}>
          {step === 'phone'
            ? 'We\'ll send you a one-time code'
            : `Code sent to ${phone}`}
        </Text>

        {/* Error message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.errorText, theme.typography.caption, { color: theme.colors.error }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Phone input step */}
        {step === 'phone' && (
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Phone number (e.g. +1234567890)"
              placeholderTextColor={theme.colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
                loading && { opacity: 0.6 },
              ]}
              onPress={handleRequestOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={[styles.buttonText, theme.typography.button, { color: theme.colors.textInverse }]}>
                  Send OTP
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* OTP input step */}
        {step === 'otp' && (
          <View style={styles.inputSection}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="6-digit code"
              placeholderTextColor={theme.colors.textSecondary}
              value={otpCode}
              onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              autoFocus
            />
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: theme.colors.primary },
                loading && { opacity: 0.6 },
              ]}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.textInverse} />
              ) : (
                <Text style={[styles.buttonText, theme.typography.button, { color: theme.colors.textInverse }]}>
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to phone step */}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                setStep('phone');
                setOtpCode('');
                setError(null);
              }}
              disabled={loading}
            >
              <Text style={[theme.typography.body, { color: theme.colors.primary }]}>
                Use a different number
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={[styles.dividerText, theme.typography.caption, { color: theme.colors.textSecondary }]}>
            or
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        {/* OAuth buttons */}
        <TouchableOpacity
          style={[styles.oauthButton, { borderColor: theme.colors.border }]}
          onPress={() => handleOAuth('google')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={[styles.oauthText, theme.typography.button, { color: theme.colors.text }]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.oauthButton, { borderColor: theme.colors.border }]}
          onPress={() => handleOAuth('apple')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={[styles.oauthText, theme.typography.button, { color: theme.colors.text }]}>
            Continue with Apple
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
  },
  oauthButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  oauthText: {
    textAlign: 'center',
  },
});
