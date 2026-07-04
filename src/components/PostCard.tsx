import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { HypeButton } from './HypeButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostData {
  id: string;
  author_name: string;
  author_avatar_color: string;
  goal_name: string;
  timestamp: string;
  type: 'win' | 'progress' | 'needs_hype';
  body: string;
  hype_count: number;
  hyped: boolean;
  comment_count: number;
}

interface PostCardProps {
  post: PostData;
  onPressAuthor?: (post: PostData) => void;
  onPressGoal?: (post: PostData) => void;
}

// ---------------------------------------------------------------------------
// Badge colours
// ---------------------------------------------------------------------------

const BADGE_COLORS: Record<PostData['type'], { bg: string; text: string }> = {
  win: { bg: '#E8F5E9', text: '#2E7D32' },
  progress: { bg: '#E3F2FD', text: '#1565C0' },
  needs_hype: { bg: '#FFF3E0', text: '#E65100' },
};

const BADGE_LABELS: Record<PostData['type'], string> = {
  win: '🏆 Win',
  progress: '📈 Progress',
  needs_hype: '🙏 Needs Hype',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PostCard({ post, onPressAuthor, onPressGoal }: PostCardProps) {
  const { theme } = useTheme();
  const badgeStyle = BADGE_COLORS[post.type];

  const timeAgo = formatTimeAgo(post.timestamp);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.borderLight,
        },
      ]}
    >
      {/* Header: avatar + author + timestamp */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onPressAuthor?.(post)}
          style={[styles.avatar, { backgroundColor: post.author_avatar_color || theme.colors.primary }]}
        >
          <Text style={styles.avatarText}>
            {post.author_name.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerText}>
          <TouchableOpacity onPress={() => onPressAuthor?.(post)}>
            <Text style={[styles.authorName, { color: theme.colors.text, ...theme.typography.bodyBold }]}>
              {post.author_name}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.timestamp, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
            {timeAgo}
          </Text>
        </View>

        {/* Type badge */}
        <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
          <Text style={[styles.badgeText, { color: badgeStyle.text, ...theme.typography.caption }]}>
            {BADGE_LABELS[post.type]}
          </Text>
        </View>
      </View>

      {/* Goal tag */}
      {post.goal_name ? (
        <TouchableOpacity onPress={() => onPressGoal?.(post)}>
          <Text
            style={[
              styles.goalTag,
              { color: theme.colors.primary, ...theme.typography.caption },
            ]}
          >
            🎯 {post.goal_name}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Body */}
      <Text style={[styles.body, { color: theme.colors.text, ...theme.typography.body }]}>
        {post.body}
      </Text>

      {/* Footer: hype + comments + save */}
      <View style={styles.footer}>
        <HypeButton
          postId={post.id}
          initialHypeCount={post.hype_count}
          initialHyped={post.hyped}
        />

        <View style={styles.footerRight}>
          <Text style={[styles.commentCount, { color: theme.colors.textSecondary, ...theme.typography.caption }]}>
            💬 {post.comment_count}
          </Text>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={[styles.saveIcon, { color: theme.colors.textSecondary }]}>🔖</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return `${Math.floor(diffDay / 7)}w`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {},
  timestamp: {
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {},
  goalTag: {
    marginBottom: 6,
  },
  body: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    marginRight: 12,
  },
  saveButton: {
    padding: 4,
  },
  saveIcon: {
    fontSize: 16,
  },
});
