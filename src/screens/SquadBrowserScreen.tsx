import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Squad {
  id: string;
  emoji: string;
  name: string;
  member_count: number;
  category?: string;
}

// ---------------------------------------------------------------------------
// SquadBrowserScreen
// ---------------------------------------------------------------------------

export function SquadBrowserScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const typo = theme.typography;
  const sp = theme.spacing;

  // State
  const [mySquads, setMySquads] = useState<Squad[]>([]);
  const [suggestedSquads, setSuggestedSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [mine, suggested] = await Promise.all([
        api.squads.mine(),
        api.squads.suggested(),
      ]);
      setMySquads(mine as Squad[]);
      setSuggestedSquads(suggested as Squad[]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load squads';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ---------------------------------------------------------------------------
  // Join handler (optimistic UI)
  // ---------------------------------------------------------------------------

  const handleJoin = async (squadId: string) => {
    // Optimistic: mark as joined immediately
    setJoinedIds((prev) => new Set(prev).add(squadId));

    try {
      await api.squads.join(squadId);
    } catch {
      // Revert on failure
      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.delete(squadId);
        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderMySquadItem = ({ item }: { item: Squad }) => (
    <TouchableOpacity
      style={[
        styles.squadCard,
        { backgroundColor: colors.surface, borderColor: colors.borderLight },
      ]}
      onPress={() => navigation.navigate('SquadChat', { squad_id: item.id })}
    >
      <Text style={styles.squadEmoji}>{item.emoji}</Text>
      <View style={styles.squadInfo}>
        <Text style={[typo.bodyBold, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[typo.caption, { color: colors.textSecondary }]}>
          {item.member_count} {item.member_count === 1 ? 'member' : 'members'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestedItem = ({ item }: { item: Squad }) => {
    const isJoined = joinedIds.has(item.id);

    return (
      <View
        style={[
          styles.squadCard,
          { backgroundColor: colors.surface, borderColor: colors.borderLight },
        ]}
      >
        <Text style={styles.squadEmoji}>{item.emoji}</Text>
        <View style={styles.squadInfo}>
          <Text
            style={[typo.bodyBold, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={[typo.caption, { color: colors.textSecondary }]}>
            {item.member_count}{' '}
            {item.member_count === 1 ? 'member' : 'members'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleJoin(item.id)}
          disabled={isJoined}
          style={[
            styles.joinButton,
            {
              backgroundColor: isJoined ? colors.surface : colors.primary,
              borderColor: isJoined ? colors.border : colors.primary,
            },
          ]}
        >
          <Text
            style={[
              typo.captionBold,
              { color: isJoined ? colors.textSecondary : colors.textInverse },
            ]}
          >
            {isJoined ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[typo.body, { color: colors.error, marginBottom: sp.md }]}>
          {error}
        </Text>
        <TouchableOpacity onPress={fetchData}>
          <Text style={[typo.bodyBold, { color: colors.primary }]}>
            Tap to retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[]}
        renderItem={null}
        keyExtractor={() => 'header'}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View style={{ padding: sp.lg, paddingTop: 60 }}>
            {/* Header */}
            <Text
              style={[typo.heading1, { color: colors.text, marginBottom: sp.lg }]}
            >
              Squads
            </Text>

            {/* Create a Squad CTA */}
            <TouchableOpacity
              style={[
                styles.ctaButton,
                { backgroundColor: colors.primary, marginBottom: sp.xl },
              ]}
              onPress={() => navigation.navigate('CreateSquad')}
            >
              <Text style={[typo.button, { color: colors.textInverse }]}>
                + Create a Squad
              </Text>
            </TouchableOpacity>

            {/* My Squads Section */}
            <Text
              style={[
                typo.heading3,
                { color: colors.text, marginBottom: sp.md },
              ]}
            >
              My Squads
            </Text>
            {mySquads.length === 0 ? (
              <Text
                style={[
                  typo.body,
                  { color: colors.textSecondary, marginBottom: sp.xl },
                ]}
              >
                You haven't joined any squads yet.
              </Text>
            ) : (
              <View style={{ marginBottom: sp.xl }}>
                {mySquads.map((squad) => (
                  <React.Fragment key={squad.id}>
                    {renderMySquadItem({ item: squad })}
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Suggested Squads Section */}
            <Text
              style={[
                typo.heading3,
                { color: colors.text, marginBottom: sp.md },
              ]}
            >
              Suggested
            </Text>
            {suggestedSquads.length === 0 ? (
              <Text
                style={[typo.body, { color: colors.textSecondary }]}
              >
                No suggestions available right now.
              </Text>
            ) : (
              <View>
                {suggestedSquads.map((squad) => (
                  <React.Fragment key={squad.id}>
                    {renderSuggestedItem({ item: squad })}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        }
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  squadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  squadEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  squadInfo: {
    flex: 1,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
});
