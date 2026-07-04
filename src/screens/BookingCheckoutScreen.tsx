import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Mocked available time slots (would come from a real API in production)
// ---------------------------------------------------------------------------

const MOCK_SLOTS = [
  'Mon 10:00 AM',
  'Mon 2:00 PM',
  'Tue 11:00 AM',
  'Wed 9:00 AM',
  'Wed 3:00 PM',
  'Thu 10:00 AM',
  'Fri 1:00 PM',
];

// ---------------------------------------------------------------------------
// BookingCheckoutScreen
// ---------------------------------------------------------------------------

export function BookingCheckoutScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const coachId: string = route.params?.coachId ?? '';
  const coachName: string = route.params?.coachName ?? '';
  const price: number = route.params?.price ?? 0;

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handlePayAndBook = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate Razorpay checkout flow (in production, would open Razorpay SDK)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Payment succeeded — now book with backend
      await api.coaches.book(coachId, {
        slot: selectedSlot,
        notes: notes.trim() || undefined,
      });

      setConfirmed(true);
    } catch (err: any) {
      setError(err.message ?? 'Booking failed. Please try again.');
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
            Booking Confirmed!
          </Text>
          <Text
            style={[
              styles.confirmSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Your session with {coachName} is scheduled for {selectedSlot}.
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

  // --- Main checkout view ---
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[styles.backButton, { color: theme.colors.primary }]}>
          ← Back
        </Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.colors.text }]}>
        Book a Session
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        with {coachName}
      </Text>

      {/* Price display */}
      <View
        style={[styles.priceCard, { backgroundColor: theme.colors.surface }]}
      >
        <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>
          Session Price
        </Text>
        <Text style={[styles.priceValue, { color: theme.colors.text }]}>
          ₹{price}
        </Text>
      </View>

      {/* Time slot selector */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Select a Time Slot
      </Text>
      <View style={styles.slotsGrid}>
        {MOCK_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot}
            style={[
              styles.slotChip,
              {
                backgroundColor:
                  selectedSlot === slot
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor:
                  selectedSlot === slot
                    ? theme.colors.primary
                    : theme.colors.border,
              },
            ]}
            onPress={() => setSelectedSlot(slot)}
          >
            <Text
              style={[
                styles.slotText,
                {
                  color:
                    selectedSlot === slot
                      ? theme.colors.textInverse
                      : theme.colors.text,
                },
              ]}
            >
              {slot}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes input */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Notes (optional)
      </Text>
      <TextInput
        style={[
          styles.notesInput,
          {
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          },
        ]}
        placeholder="Any topics or goals for this session..."
        placeholderTextColor={theme.colors.textSecondary}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {/* Error message */}
      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      {/* Pay button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: loading
              ? theme.colors.disabled
              : theme.colors.primary,
          },
        ]}
        onPress={handlePayAndBook}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.textInverse} />
        ) : (
          <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
            Pay with Razorpay — ₹{price}
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
    marginBottom: 24,
  },
  priceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
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
