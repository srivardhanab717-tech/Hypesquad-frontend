import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Theme } from '../theme/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Channel {
  id: string;
  name: string;
}

type SquadChatRouteParams = {
  SquadChat: {
    squadId: string;
    channels: Channel[];
  };
};

interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  user_name: string;
  body: string;
  type: 'text' | 'checkin';
  // Check-in card specific fields (present when type === 'checkin')
  goal_name?: string;
  streak?: number;
  progress_percent?: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SquadChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SquadChatRouteParams, 'SquadChat'>>();
  const { theme } = useTheme();
  const styles = makeStyles(theme);

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

  const { squadId, channels } = route.params;

  // Default to the first channel (general)
  const [activeChannelId, setActiveChannelId] = useState<string>(channels[0]?.id ?? '');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);

  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentUserId = useRef<string | null>(null);

  // Get current user ID for own-vs-other styling
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      currentUserId.current = data.session?.user?.id ?? null;
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch message history for a channel
  // ---------------------------------------------------------------------------
  const fetchMessages = useCallback(async (channelId: string) => {
    setLoading(true);
    try {
      const data = (await api.channels.messages(channelId)) as ChatMessage[];
      setMessagesMap((prev) => ({ ...prev, [channelId]: data ?? [] }));
    } catch {
      // On failure, set empty so we don't keep showing stale loading
      setMessagesMap((prev) => ({ ...prev, [channelId]: prev[channelId] ?? [] }));
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Realtime subscription management
  // ---------------------------------------------------------------------------
  const subscribe = useCallback(
    (channelId: string) => {
      // Unsubscribe previous if exists
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      const channelName = `squad:${squadId}:channel:${channelId}`;
      const channel = supabase.channel(channelName);

      channel
        .on('broadcast', { event: 'new_message' }, (payload) => {
          const newMsg = payload.payload as ChatMessage;
          setMessagesMap((prev) => {
            const existing = prev[channelId] ?? [];
            // Avoid duplicates
            if (existing.some((m) => m.id === newMsg.id)) return prev;
            return { ...prev, [channelId]: [newMsg, ...existing] };
          });
        })
        .subscribe();

      subscriptionRef.current = channel;
    },
    [squadId],
  );

  // ---------------------------------------------------------------------------
  // On mount / channel switch: fetch history + subscribe
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!activeChannelId) return;

    // Only fetch if we haven't cached this channel yet
    if (!messagesMap[activeChannelId]) {
      fetchMessages(activeChannelId);
    } else {
      setLoading(false);
    }

    subscribe(activeChannelId);

    return () => {
      // Cleanup on unmount
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [activeChannelId, subscribe, fetchMessages]);

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  const handleSend = async () => {
    const text = composerText.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await api.channels.send(activeChannelId, text);
      setComposerText('');
    } catch {
      // Silent fail for now — could show toast
    } finally {
      setSending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Channel switch
  // ---------------------------------------------------------------------------
  const handleChannelSwitch = (channelId: string) => {
    if (channelId === activeChannelId) return;
    setActiveChannelId(channelId);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const activeMessages = messagesMap[activeChannelId] ?? [];

  const isOwnMessage = (msg: ChatMessage) => msg.user_id === currentUserId.current;

  const renderCheckInCard = (msg: ChatMessage) => (
    <View style={styles.checkinCard}>
      <View style={styles.checkinHeader}>
        <Text style={styles.checkinBadge}>✓ CHECK-IN</Text>
        <Text style={styles.checkinUserName}>{msg.user_name}</Text>
      </View>
      {msg.goal_name && (
        <Text style={styles.checkinGoal}>{msg.goal_name}</Text>
      )}
      <View style={styles.checkinStats}>
        {msg.streak != null && (
          <Text style={styles.checkinStat}>🔥 {msg.streak} day streak</Text>
        )}
        {msg.progress_percent != null && (
          <Text style={styles.checkinStat}>📈 {msg.progress_percent}% complete</Text>
        )}
      </View>
      {msg.body ? <Text style={styles.checkinBody}>{msg.body}</Text> : null}
      <Text style={styles.timestamp}>
        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const renderTextMessage = (msg: ChatMessage) => {
    const own = isOwnMessage(msg);
    return (
      <View style={[styles.messageBubble, own ? styles.ownBubble : styles.otherBubble]}>
        {!own && <Text style={styles.senderName}>{msg.user_name}</Text>}
        <Text style={[styles.messageText, own ? styles.ownMessageText : styles.otherMessageText]}>
          {msg.body}
        </Text>
        <Text style={[styles.timestamp, own && styles.ownTimestamp]}>
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'checkin') {
      return <View style={styles.messageContainer}>{renderCheckInCard(item)}</View>;
    }
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage(item) ? styles.ownContainer : styles.otherContainer,
        ]}
      >
        {renderTextMessage(item)}
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Squad Chat
        </Text>
        <Pressable
          onPress={() => (navigation as any).navigate('AICoach')}
          style={styles.aiCoachButton}
        >
          <Text style={styles.aiCoachText}>🤖</Text>
        </Pressable>
      </View>

      {/* Channel Switcher */}
      <View style={styles.channelSwitcher}>
        {channels.map((ch) => (
          <Pressable
            key={ch.id}
            style={[
              styles.channelTab,
              ch.id === activeChannelId && styles.channelTabActive,
            ]}
            onPress={() => handleChannelSwitch(ch.id)}
          >
            <Text
              style={[
                styles.channelTabText,
                ch.id === activeChannelId && styles.channelTabTextActive,
              ]}
            >
              # {ch.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Be the first to say something!</Text>
        </View>
      ) : (
        <FlatList
          data={activeMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textSecondary}
          value={composerText}
          onChangeText={setComposerText}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendButton, (!composerText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!composerText.trim() || sending}
        >
          <Text style={styles.sendButtonText}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 56 : 16,
      paddingBottom: 12,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
    },
    backText: {
      fontSize: 22,
      color: theme.colors.text,
    },
    headerTitle: {
      flex: 1,
      ...theme.typography.heading3,
      color: theme.colors.text,
    },
    aiCoachButton: {
      padding: theme.spacing.sm,
      marginLeft: theme.spacing.sm,
    },
    aiCoachText: {
      fontSize: 22,
    },

    // Channel Switcher
    channelSwitcher: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    channelTab: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs + 2,
      borderRadius: 16,
      marginRight: theme.spacing.sm,
      backgroundColor: theme.colors.borderLight,
    },
    channelTabActive: {
      backgroundColor: theme.colors.primary,
    },
    channelTabText: {
      ...theme.typography.captionBold,
      color: theme.colors.textSecondary,
    },
    channelTabTextActive: {
      color: theme.colors.textInverse,
    },

    // Loading / Empty
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      ...theme.typography.heading3,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    emptySubtext: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },

    // Messages
    messagesList: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    messageContainer: {
      marginVertical: theme.spacing.xs,
    },
    ownContainer: {
      alignItems: 'flex-end',
    },
    otherContainer: {
      alignItems: 'flex-start',
    },

    // Text Message Bubbles
    messageBubble: {
      maxWidth: '80%',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      borderRadius: 16,
    },
    ownBubble: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    },
    otherBubble: {
      backgroundColor: theme.colors.surfaceElevated,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    senderName: {
      ...theme.typography.captionBold,
      color: theme.colors.primary,
      marginBottom: 2,
    },
    messageText: {
      ...theme.typography.body,
    },
    ownMessageText: {
      color: theme.colors.textInverse,
    },
    otherMessageText: {
      color: theme.colors.text,
    },
    timestamp: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    ownTimestamp: {
      color: 'rgba(255, 255, 255, 0.7)',
    },

    // Check-in Card
    checkinCard: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: 12,
      padding: theme.spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.success,
      borderWidth: 1,
      borderColor: theme.colors.border,
      width: '90%',
      alignSelf: 'center',
    },
    checkinHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    checkinBadge: {
      ...theme.typography.captionBold,
      color: theme.colors.success,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      overflow: 'hidden',
      marginRight: theme.spacing.sm,
    },
    checkinUserName: {
      ...theme.typography.captionBold,
      color: theme.colors.text,
    },
    checkinGoal: {
      ...theme.typography.bodyBold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    checkinStats: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xs,
    },
    checkinStat: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    checkinBody: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },

    // Composer
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    composerInput: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      ...theme.typography.body,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: theme.spacing.sm,
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.disabled,
    },
    sendButtonText: {
      color: theme.colors.textInverse,
      fontSize: 20,
      fontWeight: '700',
    },
  });
}
