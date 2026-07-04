import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { EmptyState } from '../components/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendingTag {
  id: string;
  name: string;
}

interface SuggestedSquad {
  id: string;
  emoji: string;
  name: string;
  member_count: number;
}

interface DiscoverData {
  banner: { title: string; subtitle: string } | null;
  trending_tags: TrendingTag[];
  suggested_squads: SuggestedSquad[];
}

// ---------------------------------------------------------------------------
// DiscoverScreen
// ---------------------------------------------------------------------------

export function DiscoverScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [data, setData] = useState<DiscoverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [joinedSquads, setJoinedSquads] = useState<Set<string>>(new Set());

  // ---------------------------
  // Data fetching
  // ---------------------------

  const loadDiscover = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = (await api.discover()) as DiscoverData;
      setData(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscover();
  }, [loadDiscover]);

  // ---------------------------
  // Actions
  // ---------------------------

  const handleJoinSquad = useCallback(async (squadId: string) => {
    // Optimistic UI: mark as joined immediately
    setJoinedSquads((prev) => new Set(prev).add(squadId));
    try {
      await api.squads.join(squadId);
    } catch {
      // Revert on failure
      setJoinedSquads((prev) => {
        const next = new Set(prev);
        next.delete(squadId);
        return next;
      });
    }
  }, []);

  const handleSearchTap = useCallback(() => {
    navigation.push('Search');
  }, [navigation]);

  // ---------------------------
  // Render helpers
  // ---------------------------

  const renderBanner = () => {
    if (!data?.banner) return null;
    return (
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: theme.colors.primary }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.bannerIcon]}>🤖</Text>
        <View style={styles.bannerTextContainer}>
          <Text style={[styles.bannerTitle, { color: theme.colors.textInverse }]}>
            {data.banner.title || 'AI Coach'}
          </Text>
          <Text style={[styles.bannerSubtitle, { color: theme.colors.textInverse }]}>
            {data.banner.subtitle || 'Get personalized guidance for your goals'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchBar = () => (
    <TouchableOpacity
      style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={handleSearchTap}
      activeOpacity={0.7}
    >
      <Text style={[styles.searchPlaceholder, { color: theme.colors.textSecondary }]}>
        Search people, goals, squads...
      </Text>
    </TouchableOpacity>
  );

  const renderTrendingTags = () => {
    if (!data?.trending_tags?.length) return null;
    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text, ...theme.typography.heading3 }]}>
          Trending
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsRow}
        >
          {data.trending_tags.map((tag) => (
            <View
              key={tag.id}
              style={[styles.tagChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <Text style={[styles.tagText, { color: theme.colors.text, ...theme.typography.caption }]}>
                #{tag.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSquadItem = ({ item }: { item: SuggestedSquad }) => {
    const isJoined = joinedSquads.has(item.id);
    return (
      <View style={[styles.squadRow, { borderBottomColor: theme.colors.borderLight }]}>
        <Text style={styles.squadEmoji}>{item.emoji}</Text>
        <View style={styles.squadInfo}>
          <Text style={[styles.squadName, { color: theme.colors.text, ...theme.typography.bodyBold }]}>
            {item.name}
          </Text>
          <Text style={[styles.squadMembers, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
            {item.member_count} member{item.member_count !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.joinButton,
            {
              backgroundColor: isJoined ? theme.colors.surface : theme.colors.primary,
              borderColor: isJoined ? theme.colors.border : theme.colors.primary,
            },
          ]}
          onPress={() => !isJoined && handleJoinSquad(item.id)}
          disabled={isJoined}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.joinButtonText,
              {
                color: isJoined ? theme.colors.textSecondary : theme.colors.textInverse,
                ...theme.typography.captionBold,
              },
            ]}
          >
            {isJoined ? 'Joined' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderListHeader = () => (
    <View>
      {renderSearchBar()}
      {renderBanner()}
      {renderTrendingTags()}
      {data?.suggested_squads?.length ? (
        <Text
          style={[
            styles.sectionTitle,
            styles.suggestedTitle,
            { color: theme.colors.text, ...theme.typography.heading3 },
          ]}
        >
          Suggested Squads
        </Text>
      ) : null}
    </View>
  );

  // ---------------------------
  // Main render
  // ---------------------------

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <EmptyState icon="⚠️" title="Something went wrong" subtitle="Tap to retry" />
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={loadDiscover}>
          <Text style={[styles.retryText, { color: theme.colors.textInverse }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={data?.suggested_squads ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderSquadItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <EmptyState icon="🔍" title="No suggested squads" subtitle="Check back later!" />
        }
        contentContainerStyle={styles.listContent}
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
  },
  listContent: {
    paddingBottom: 24,
  },
  // Search bar
  searchBar: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchPlaceholder: {
    fontSize: 15,
  },
  // Banner
  banner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    opacity: 0.9,
  },
  // Sections
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  suggestedTitle: {
    marginTop: 8,
  },
  // Tags
  tagsRow: {
    paddingHorizontal: 16,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  tagText: {},
  // Squad row
  squadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  squadEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  squadInfo: {
    flex: 1,
  },
  squadName: {},
  squadMembers: {
    marginTop: 2,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  joinButtonText: {},
  // Retry
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
