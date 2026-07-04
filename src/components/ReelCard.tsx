import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { HypeButton } from './HypeButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReelData {
  id: string;
  author_name: string;
  author_avatar_color: string;
  goal_name: string;
  caption: string;
  hype_count: number;
  hyped: boolean;
  comment_count: number;
}

interface ReelCardProps {
  reel: ReelData;
  onPressComment?: (reel: ReelData) => void;
  onPressShare?: (reel: ReelData) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// ReelCard — full-screen vertical video card
//
// Distinctly DIFFERENT from PostCard (compact feed list-item).
// Shares HypeButton sub-component for optimistic hype behavior.
// ---------------------------------------------------------------------------

export function ReelCard({ reel, onPressComment, onPressShare }: ReelCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { height: SCREEN_HEIGHT }]}>
      {/* Video background placeholder — dark gradient/color (actual video out of scope) */}
      <View style={styles.videoBackground} />

      {/* Side action buttons — vertical column on right */}
      <View style={styles.sideActions}>
        {/* Author avatar */}
        <View
          style={[
            styles.authorAvatar,
            { backgroundColor: reel.author_avatar_color || theme.colors.primary },
          ]}
        >
          <Text style={styles.authorAvatarText}>
            {reel.author_name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Hype button (shared component) */}
        <View style={styles.sideAction}>
          <HypeButton
            postId={reel.id}
            initialHypeCount={reel.hype_count}
            initialHyped={reel.hyped}
          />
        </View>

        {/* Comment count */}
        <TouchableOpacity
          style={styles.sideAction}
          onPress={() => onPressComment?.(reel)}
          accessibilityLabel="Comments"
        >
          <Text style={styles.sideActionIcon}>💬</Text>
          <Text style={[styles.sideActionCount, { color: '#FFFFFF' }]}>
            {reel.comment_count}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          style={styles.sideAction}
          onPress={() => onPressShare?.(reel)}
          accessibilityLabel="Share"
        >
          <Text style={styles.sideActionIcon}>🔗</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom overlay: author name, linked goal, caption */}
      <View style={styles.bottomOverlay}>
        <Text style={[styles.authorName, { color: '#FFFFFF' }]}>
          {reel.author_name}
        </Text>
        {reel.goal_name ? (
          <Text style={[styles.goalName, { color: theme.colors.primary }]}>
            🎯 {reel.goal_name}
          </Text>
        ) : null}
        {reel.caption ? (
          <Text style={[styles.caption, { color: '#FFFFFF' }]} numberOfLines={3}>
            {reel.caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A2E',
    // Dark gradient placeholder for video content
  },
  sideActions: {
    position: 'absolute',
    right: 12,
    bottom: 160,
    alignItems: 'center',
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  authorAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sideAction: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sideActionIcon: {
    fontSize: 28,
  },
  sideActionCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
