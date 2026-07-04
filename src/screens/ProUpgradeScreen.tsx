import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Pro plan features (static display data)
// ---------------------------------------------------------------------------

const PRO_FEATURES = [
  'Unlimited AI Coach conversations',
  'Priority human coach matching',
  'Advanced analytics & insights',
  'Exclusive squad badges',
  'Ad-free experience',
  'Custom milestone card themes',
];

const PRO_PLAN = {
  name: 'Pro',
  price: 499,
  period: 'month',
};

// ---------------------------------------------------------------------------
// ProUpgradeScreen
// ---------------------------------------------------------------------------

export function ProUpgradeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate Razorpay checkout flow (in production, would open Razorpay SDK)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulated payment token (in production, comes from Razorpay response)
      const paymentToken = `rzp_sim_${Date.now()}`;

      // Call backend to activate subscription
      await api.settings.upgradeSubscription({
        plan: PRO_PLAN.name,
        payment_token: paymentToken,
      });

      setConfirmed(true);
    } catch (err: any) {
      setError(err.message ?? 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Confirmation view ---
  if (confirmed) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.confirmationContainer}>
          <Text style={[styles.checkMark, { color: theme.colors.success }]}>
            ✓
          </Text>
          <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
            Welcome to Pro!
          </Text>
          <Text
            style={[
              styles.confirmSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Your subscription is now active. Enjoy all Pro features!
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Main upgrade view ---
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[styles.backButton, { color: theme.colors.primary }]}>
          ← Back
        </Text>
      </TouchableOpacity>

      {/* Plan header */}
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          HypeSquad Pro
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Unlock your full potential
        </Text>
      </View>

      {/* Price card */}
      <View
        style={[styles.priceCard, { backgroundColor: theme.colors.surface }]}
      >
        <Text style={[styles.priceValue, { color: theme.colors.text }]}>
          ₹{PRO_PLAN.price}
        </Text>
        <Text style={[styles.pricePeriod, { color: theme.colors.textSecondary }]}>
          per {PRO_PLAN.period}
        </Text>
      </View>

      {/* Features list */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        What you get
      </Text>
      <View style={styles.featuresList}>
        {PRO_FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Text style={[styles.featureCheck, { color: theme.colors.success }]}>
              ✓
            </Text>
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* Error message */}
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {/* Upgrade button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: loading
              ? theme.colors.disabled
              : theme.colors.primary,
          },
        ]}
        onPress={handleUpgrade}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.textInverse} />
        ) : (
          <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
            Upgrade Now — ₹{PRO_PLAN.price}/{PRO_PLAN.period}
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
    padding: 24,
    paddingTop: 56,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  priceCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 40,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureCheck: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  checkMark: {
    fontSize: 64,
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
});
