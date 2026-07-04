import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { ReelCard, ReelData } from '../components/ReelCard';
import { EmptyState } from '../components/EmptyState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReelsFeedResponse {
  reels: ReelData[];
  next_cursor: string | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// ReelsFeedScreen — full-screen vertical snap-scroll
//
// Tab bar is hidden on this screen (immersive flow).
// Explicit close/back button provided.
// ---------------------------------------------------------------------------

export function ReelsFeedScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  // ---------------------------------------------------------------------------
  // Hide tab bar on this screen (immersive flow)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  // Feed state
  const [reels, setReels] = useState<ReelData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMore = useRef(true);

  // ---------------------------
  // Data fetching
  // ---------------------------

  const fetchReels = useCallback(async (cursorParam?: string) => {
    try {
      const res = (await api.reels.feed(cursorParam)) as ReelsFeedResponse;
      return res;
    } catch {
      return { reels: [], next_cursor: null };
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const res = await fetchReels();
    setReels(res.reels);
    setCursor(res.next_cursor);
    hasMore.current = !!res.next_cursor;
    setLoading(false);
  }, [fetchReels]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore.current || !cursor) return;
    setLoadingMore(true);
    const res = await fetchReels(cursor);
    setReels((prev) => [...prev, ...res.reels]);
    setCursor(res.next_cursor);
    hasMore.current = !!res.next_cursor;
    setLoadingMore(false);
  }, [cursor, fetchReels, loadingMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ---------------------------
  // Navigation
  // ---------------------------

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleRecordNew = useCallback(() => {
    navigation.push('RecordReel');
  }, [navigation]);

  // ---------------------------
  // Render helpers
  // ---------------------------

  const renderItem = useCallback(
    ({ item }: { item: ReelData }) => <ReelCard reel={item} />,
    [],
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={[styles.footerLoader, { height: SCREEN_HEIGHT }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={[styles.emptyContainer, { height: SCREEN_HEIGHT }]}>
        <EmptyState
          icon="🎬"
          title="No reels yet"
          subtitle="Be the first to share a reel with your squad!"
        />
      </View>
    );
  };

  // ---------------------------
  // Loading state
  // ---------------------------

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ---------------------------
  // Main render
  // ---------------------------

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Vertical snap-scroll reel feed */}
      <FlatList
        data={reels}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />

      {/* Close/back button (top-left) — since tab bar is hidden */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {/* Record new reel FAB (bottom-center) */}
      <TouchableOpacity
        style={[styles.recordFab, { backgroundColor: theme.colors.primary }]}
        onPress={handleRecordNew}
        accessibilityLabel="Record new reel"
        accessibilityRole="button"
      >
        <Text style={styles.recordFabIcon}>⏺</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 54,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  recordFab: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recordFabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
});
