import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendingTag {
  id: string;
  name: string;
}

interface PersonResult {
  id: string;
  name: string;
  avatar_color: string;
  handle?: string;
}

interface GoalResult {
  id: string;
  description: string;
  category: string;
  owner_name: string;
}

interface SquadResult {
  id: string;
  emoji: string;
  name: string;
  member_count: number;
}

interface SearchResponse {
  people: PersonResult[];
  goals: GoalResult[];
  squads: SquadResult[];
}

interface DiscoverData {
  trending_tags: TrendingTag[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// SearchScreen
// ---------------------------------------------------------------------------

export function SearchScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------
  // Load trending tags for empty state
  // ---------------------------

  useEffect(() => {
    (async () => {
      try {
        const res = (await api.discover()) as DiscoverData;
        setTrendingTags(res.trending_tags ?? []);
      } catch {
        // Non-critical, leave empty
      }
    })();
  }, []);

  // Auto-focus the input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // ---------------------------
  // Search with debounce
  // ---------------------------

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = (await api.search(q.trim())) as SearchResponse;
      setResults(res);
    } catch {
      setResults({ people: [], goals: [], squads: [] });
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (!text.trim()) {
        setResults(null);
        setSearching(false);
        return;
      }
      searchTimeout.current = setTimeout(() => {
        doSearch(text);
      }, 400);
    },
    [doSearch],
  );

  // ---------------------------
  // Navigation
  // ---------------------------

  const handlePressPerson = useCallback(
    (person: PersonResult) => {
      navigation.push('Profile', { userId: person.id });
    },
    [navigation],
  );

  const handlePressGoal = useCallback(
    (goal: GoalResult) => {
      navigation.push('GoalDetail', { goalId: goal.id });
    },
    [navigation],
  );

  const handlePressSquad = useCallback(
    (squad: SquadResult) => {
      navigation.push('SquadBrowser', { squadId: squad.id });
    },
    [navigation],
  );

  // ---------------------------
  // Render: Empty state (trending tags)
  // ---------------------------

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: theme.colors.text, ...theme.typography.heading3 }]}>
        Trending
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsRow}
      >
        {trendingTags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            style={[styles.tagChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handleChangeText(`#${tag.name}`)}
          >
            <Text style={[styles.tagText, { color: theme.colors.text, ...theme.typography.caption }]}>
              #{tag.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {trendingTags.length === 0 && (
        <Text style={[styles.emptyHint, { color: theme.colors.textSecondary, ...theme.typography.body }]}>
          Start typing to search people, goals, and squads
        </Text>
      )}
    </View>
  );

  // ---------------------------
  // Render: Search results grouped
  // ---------------------------

  const buildSections = () => {
    if (!results) return [];
    const sections: { title: string; data: any[]; type: string }[] = [];
    if (results.people.length > 0) {
      sections.push({ title: 'People', data: results.people, type: 'people' });
    }
    if (results.goals.length > 0) {
      sections.push({ title: 'Goals', data: results.goals, type: 'goals' });
    }
    if (results.squads.length > 0) {
      sections.push({ title: 'Squads', data: results.squads, type: 'squads' });
    }
    return sections;
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.textSecondary, ...theme.typography.captionBold }]}>
        {section.title}
      </Text>
    </View>
  );

  const renderItem = ({ item, section }: { item: any; section: { type: string } }) => {
    if (section.type === 'people') {
      const person = item as PersonResult;
      return (
        <TouchableOpacity
          style={[styles.resultRow, { borderBottomColor: theme.colors.borderLight }]}
          onPress={() => handlePressPerson(person)}
        >
          <View style={[styles.personAvatar, { backgroundColor: person.avatar_color || theme.colors.primary }]}>
            <Text style={styles.personAvatarText}>{person.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={[styles.resultPrimary, { color: theme.colors.text, ...theme.typography.bodyBold }]}>
              {person.name}
            </Text>
            {person.handle && (
              <Text style={[styles.resultSecondary, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
                @{person.handle}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    if (section.type === 'goals') {
      const goal = item as GoalResult;
      return (
        <TouchableOpacity
          style={[styles.resultRow, { borderBottomColor: theme.colors.borderLight }]}
          onPress={() => handlePressGoal(goal)}
        >
          <View style={[styles.goalIcon, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.goalIconText}>🎯</Text>
          </View>
          <View style={styles.resultTextContainer}>
            <Text style={[styles.resultPrimary, { color: theme.colors.text, ...theme.typography.bodyBold }]}>
              {goal.description}
            </Text>
            <Text style={[styles.resultSecondary, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
              {goal.category} · {goal.owner_name}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (section.type === 'squads') {
      const squad = item as SquadResult;
      return (
        <TouchableOpacity
          style={[styles.resultRow, { borderBottomColor: theme.colors.borderLight }]}
          onPress={() => handlePressSquad(squad)}
        >
          <Text style={styles.squadEmoji}>{squad.emoji}</Text>
          <View style={styles.resultTextContainer}>
            <Text style={[styles.resultPrimary, { color: theme.colors.text, ...theme.typography.bodyBold }]}>
              {squad.name}
            </Text>
            <Text style={[styles.resultSecondary, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
              {squad.member_count} member{squad.member_count !== 1 ? 's' : ''}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderResultsEmpty = () => {
    if (searching) return null;
    if (!results) return null;
    // All sections empty — show "no results"
    if (results.people.length === 0 && results.goals.length === 0 && results.squads.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={[styles.noResultsText, { color: theme.colors.textSecondary, ...theme.typography.body }]}>
            No results for "{query}"
          </Text>
        </View>
      );
    }
    return null;
  };

  // ---------------------------
  // Main render
  // ---------------------------

  const sections = buildSections();
  const showResults = query.trim().length > 0 && results !== null;
  const showEmpty = query.trim().length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search input */}
      <View style={[styles.searchContainer, { borderBottomColor: theme.colors.border }]}>
        <TextInput
          ref={inputRef}
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Search people, goals, squads..."
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={handleChangeText}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setQuery('');
              setResults(null);
            }}
          >
            <Text style={[styles.clearText, { color: theme.colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading indicator */}
      {searching && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}

      {/* Empty state: trending tags (never blank) */}
      {showEmpty && renderEmptyState()}

      {/* Results */}
      {showResults && sections.length > 0 && (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.id ?? index}`}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.resultsContent}
        />
      )}

      {/* No results state */}
      {showResults && sections.length === 0 && !searching && renderResultsEmpty()}
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
  // Search input
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  clearText: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Loading
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  // Empty state
  emptyContainer: {
    padding: 16,
  },
  emptyTitle: {
    marginBottom: 12,
  },
  tagsRow: {
    paddingBottom: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  tagText: {},
  emptyHint: {
    marginTop: 24,
    textAlign: 'center',
  },
  // Results
  resultsContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeaderText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultPrimary: {},
  resultSecondary: {
    marginTop: 2,
  },
  // People
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Goals
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalIconText: {
    fontSize: 20,
  },
  // Squads
  squadEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  // No results
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  noResultsText: {
    textAlign: 'center',
  },
});
