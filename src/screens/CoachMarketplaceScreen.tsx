import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Coach {
  id: string;
  name: string;
  type: 'ai' | 'human';
  specialty: string;
  rating: number;
  price: number;
}

// ---------------------------------------------------------------------------
// CoachMarketplaceScreen
// ---------------------------------------------------------------------------

export function CoachMarketplaceScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = (await api.coaches.list()) as Coach[];
      setCoaches(data ?? []);
    } catch {
      setError(true);
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = useCallback(() => {
    navigation.navigate('AICoach');
  }, [navigation]);

  const handleBookPress = useCallback(
    (coach: Coach) => {
      navigation.navigate('BookingCheckout', {
        coachId: coach.id,
        coachName: coach.name,
        price: coach.price,
      });
    },
    [navigation],
  );

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const renderStars = (rating: number): string => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const renderCoachCard = ({ item }: { item: Coach }) => {
    const isAI = item.type === 'ai';

    return (
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {/* Top Row: Name + Badge */}
        <View style={styles.cardHeader}>
          <Text style={[styles.coachName, { color: theme.colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: isAI ? theme.colors.info : theme.colors.success },
            ]}
          >
            <Text style={styles.badgeText}>{isAI ? 'AI' : 'Human'}</Text>
          </View>
        </View>

        {/* Specialty */}
        <Text style={[styles.specialty, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {item.specialty}
        </Text>

        {/* Rating + Price Row */}
        <View style={styles.metaRow}>
          <Text style={[styles.rating, { color: theme.colors.warning }]}>
            {renderStars(item.rating)} {item.rating.toFixed(1)}
          </Text>
          <Text style={[styles.price, { color: theme.colors.text }]}>
            {isAI ? 'Free' : `₹${item.price}`}
          </Text>
        </View>

        {/* Action Button */}
        {isAI ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleChatPress}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.textInverse }]}>
              Chat
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleBookPress(item)}
          >
            <Text style={[styles.actionButtonText, { color: theme.colors.textInverse }]}>
              Book
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No coaches available</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Check back later for coaching options.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading coaches...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyTitle, { color: theme.colors.error }]}>
          Failed to load coaches
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={fetchCoaches}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.textInverse }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Coach Marketplace</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Coach List */}
      <FlatList
        data={coaches}
        keyExtractor={(item) => item.id}
        renderItem={renderCoachCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 50,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coachName: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  specialty: {
    fontSize: 14,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rating: {
    fontSize: 13,
    fontWeight: '500',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
