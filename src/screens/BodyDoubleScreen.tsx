import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Vibration,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import type { Theme } from '../theme/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Participant {
  user_id: string;
  name: string;
  avatar_color: string;
  status: 'focusing' | 'idle';
}

type BodyDoubleScreenProps = NativeStackScreenProps<any, 'BodyDouble'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMER_SECONDS = 25 * 60; // 25 minutes

// ---------------------------------------------------------------------------
// BodyDoubleScreen
// ---------------------------------------------------------------------------

export function BodyDoubleScreen({ navigation, route }: BodyDoubleScreenProps) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  // Room ID from route params or default
  const roomId = (route.params as any)?.roomId ?? 'default-room';

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

  // ---------------------------------------------------------------------------
  // Presence state
  // ---------------------------------------------------------------------------
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // ---------------------------------------------------------------------------
  // Pomodoro timer state (client-local, ephemeral)
  // ---------------------------------------------------------------------------
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TIMER_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Pomodoro timer logic
  // ---------------------------------------------------------------------------

  const startTimer = useCallback(() => {
    if (timeRemaining <= 0) return;
    setIsRunning(true);
  }, [timeRemaining]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(DEFAULT_TIMER_SECONDS);
  }, []);

  // Timer tick effect using useRef + setInterval pattern
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer complete
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Visual/audio cue on completion
            Vibration.vibrate([0, 500, 200, 500]);
            Alert.alert('Time\'s up!', 'Your Pomodoro session is complete. Take a break!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // ---------------------------------------------------------------------------
  // Realtime presence
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const channel = supabase.channel(`bodydouble:${roomId}`, {
      config: { presence: { key: 'user_id' } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const users: Participant[] = [];
        for (const key of Object.keys(presenceState)) {
          const presences = presenceState[key] as any[];
          if (presences.length > 0) {
            const p = presences[0];
            users.push({
              user_id: p.user_id ?? key,
              name: p.name ?? 'Anonymous',
              avatar_color: p.avatar_color ?? '#FF6B35',
              status: p.status ?? 'focusing',
            });
          }
        }
        setParticipants(users);
        setIsConnecting(false);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Handled by sync above
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Handled by sync above
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track own presence
          await channel.track({
            user_id: 'self', // Will be replaced by actual user_id from auth
            name: 'You',
            avatar_color: '#FF6B35',
            status: 'focusing',
          });
          setIsConnecting(false);
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount — never leave dangling subscriptions
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId]);

  // ---------------------------------------------------------------------------
  // Invite handler
  // ---------------------------------------------------------------------------

  const handleInvite = useCallback(async () => {
    try {
      await Share.share({
        message: `Join my Body Double session on HypeSquad! Room: ${roomId}`,
      });
    } catch (_err) {
      // User cancelled or share failed — no action needed
    }
  }, [roomId]);

  // ---------------------------------------------------------------------------
  // Format time helper
  // ---------------------------------------------------------------------------

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // Render participant tile
  // ---------------------------------------------------------------------------

  const renderParticipant = ({ item }: { item: Participant }) => (
    <View style={styles.participantTile}>
      <View style={[styles.avatar, { backgroundColor: item.avatar_color }]}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.participantName} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.status === 'focusing' ? theme.colors.success : theme.colors.disabled },
          ]}
        />
        <Text style={styles.statusText}>
          {item.status === 'focusing' ? 'Focusing' : 'Idle'}
        </Text>
      </View>
    </View>
  );

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isConnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Connecting to room...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Header with back button and invite */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Body Double</Text>
        <TouchableOpacity onPress={handleInvite} style={styles.inviteButton}>
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Pomodoro Timer */}
      <View style={styles.timerSection}>
        <View style={styles.timerCircle}>
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
        </View>
        <View style={styles.timerControls}>
          {!isRunning ? (
            <TouchableOpacity
              onPress={startTimer}
              style={[styles.timerButton, styles.startButton]}
              disabled={timeRemaining <= 0}
            >
              <Text style={styles.timerButtonText}>
                {timeRemaining <= 0 ? 'Done' : 'Start'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pauseTimer} style={[styles.timerButton, styles.pauseButton]}>
              <Text style={styles.timerButtonText}>Pause</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={resetTimer} style={[styles.timerButton, styles.resetButton]}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Participant tiles */}
      <View style={styles.participantsSection}>
        <Text style={styles.sectionTitle}>
          In this room ({participants.length})
        </Text>
        <FlatList
          data={participants}
          keyExtractor={(item) => item.user_id}
          renderItem={renderParticipant}
          numColumns={2}
          columnWrapperStyle={styles.participantRow}
          contentContainerStyle={styles.participantList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No one else is here yet. Invite someone!</Text>
          }
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 56,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      paddingVertical: theme.spacing.sm,
      paddingRight: theme.spacing.md,
    },
    backButtonText: {
      ...theme.typography.bodyBold,
      color: theme.colors.primary,
    },
    headerTitle: {
      ...theme.typography.heading3,
      color: theme.colors.text,
    },
    inviteButton: {
      paddingVertical: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
    },
    inviteButtonText: {
      ...theme.typography.bodyBold,
      color: theme.colors.primary,
    },
    timerSection: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    timerCircle: {
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 6,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    timerText: {
      fontSize: 40,
      fontWeight: '700',
      color: theme.colors.text,
    },
    timerControls: {
      flexDirection: 'row',
      gap: 12,
    },
    timerButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
    },
    startButton: {
      backgroundColor: theme.colors.primary,
    },
    pauseButton: {
      backgroundColor: theme.colors.warning,
    },
    resetButton: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    timerButtonText: {
      ...theme.typography.button,
      color: theme.colors.textInverse,
    },
    resetButtonText: {
      ...theme.typography.button,
      color: theme.colors.text,
    },
    participantsSection: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.heading3,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    participantList: {
      paddingBottom: theme.spacing.lg,
    },
    participantRow: {
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    participantTile: {
      width: '48%',
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    participantName: {
      ...theme.typography.bodyBold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusText: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    emptyText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingVertical: theme.spacing.xl,
    },
  });
}
