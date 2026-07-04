import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { api, ReelInput } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Goal {
  id: string;
  description: string;
  category: string;
  streak?: number;
}

type Duration = 15 | 30 | 60;

// ---------------------------------------------------------------------------
// RecordReelScreen
// ---------------------------------------------------------------------------

export function RecordReelScreen() {
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

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [goalsLoading, setGoalsLoading] = useState(true);

  // Duration state
  const [duration, setDuration] = useState<Duration>(15);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordingComplete, setRecordingComplete] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);

  // Animation for recording ring
  const ringAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------
  // Load user goals
  // ---------------------------

  useEffect(() => {
    async function loadGoals() {
      try {
        const res = (await api.goals.mine()) as Goal[];
        setGoals(res);
        if (res.length > 0) {
          setSelectedGoal(res[0]);
        }
      } catch {
        // Silently handle — empty state will show
      } finally {
        setGoalsLoading(false);
      }
    }
    loadGoals();
  }, []);

  // ---------------------------
  // Streak value (from selected goal)
  // ---------------------------

  const currentStreak = selectedGoal?.streak ?? 0;

  // ---------------------------
  // Recording logic
  // ---------------------------

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setElapsedTime(0);
    setRecordingComplete(false);

    // Start ring fill animation
    ringAnim.setValue(0);
    Animated.timing(ringAnim, {
      toValue: 1,
      duration: duration * 1000,
      useNativeDriver: false,
    }).start();

    // Start elapsed timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed >= duration) {
        // Duration reached — stop recording
        stopRecording();
      } else {
        setElapsedTime(elapsed);
      }
    }, 200);
  }, [duration, ringAnim]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    ringAnim.stopAnimation();
    setRecordingComplete(true);
  }, [ringAnim]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-post on recording complete
  useEffect(() => {
    if (recordingComplete && selectedGoal) {
      handleUpload();
    }
  }, [recordingComplete]);

  // ---------------------------
  // Upload handler
  // ---------------------------

  const handleUpload = useCallback(
    async (videoUrl?: string) => {
      if (!selectedGoal) return;

      setUploading(true);
      try {
        const input: ReelInput = {
          goal_id: selectedGoal.id,
          video_url: videoUrl || 'recorded://local-video',
          duration,
        };
        await api.reels.upload(input);
        Alert.alert('Success', 'Reel posted!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch {
        Alert.alert('Error', 'Failed to upload reel. Please try again.');
      } finally {
        setUploading(false);
        setRecordingComplete(false);
      }
    },
    [selectedGoal, duration, navigation],
  );

  // ---------------------------
  // Gallery fallback
  // ---------------------------

  const handleGalleryUpload = useCallback(() => {
    // Gallery picker is out of scope — simulate selecting a file
    handleUpload('gallery://selected-video');
  }, [handleUpload]);

  // ---------------------------
  // Press handlers for record button
  // ---------------------------

  const handlePressIn = useCallback(() => {
    if (!isRecording && !uploading) {
      startRecording();
    }
  }, [isRecording, uploading, startRecording]);

  const handlePressOut = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // ---------------------------
  // Render helpers
  // ---------------------------

  const renderGoalPicker = () => (
    <Modal
      visible={goalPickerVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setGoalPickerVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Select Goal
          </Text>
          <FlatList
            data={goals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.goalItem,
                  {
                    backgroundColor:
                      item.id === selectedGoal?.id
                        ? theme.colors.primaryLight + '30'
                        : 'transparent',
                    borderBottomColor: theme.colors.borderLight,
                  },
                ]}
                onPress={() => {
                  setSelectedGoal(item);
                  setGoalPickerVisible(false);
                }}
              >
                <Text style={[styles.goalItemText, { color: theme.colors.text }]}>
                  {item.description}
                </Text>
                <Text style={[styles.goalCategory, { color: theme.colors.textSecondary }]}>
                  {item.category}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyGoals, { color: theme.colors.textSecondary }]}>
                No goals yet. Create one first!
              </Text>
            }
          />
          <TouchableOpacity
            style={[styles.modalCloseBtn, { backgroundColor: theme.colors.surface }]}
            onPress={() => setGoalPickerVisible(false)}
          >
            <Text style={[styles.modalCloseBtnText, { color: theme.colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 1],
  });

  // ---------------------------
  // Main render
  // ---------------------------

  if (uploading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.uploadingText, { color: theme.colors.text }]}>
            Uploading reel...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Header: Close + Goal Switcher + Streak Reminder */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.goalSwitcher, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          onPress={() => setGoalPickerVisible(true)}
          disabled={goalsLoading}
        >
          <Text style={styles.goalSwitcherText} numberOfLines={1}>
            {goalsLoading
              ? 'Loading...'
              : selectedGoal
              ? selectedGoal.description
              : 'Select a goal'}
          </Text>
          <Text style={styles.goalSwitcherArrow}>▾</Text>
        </TouchableOpacity>

        {/* Streak Reminder */}
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {currentStreak} day streak</Text>
        </View>
      </View>

      {/* Camera viewfinder (placeholder) */}
      <View style={styles.cameraArea}>
        <Text style={styles.cameraPlaceholder}>Camera</Text>
        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.redDot} />
            <Text style={styles.elapsedText}>
              {elapsedTime}s / {duration}s
            </Text>
          </View>
        )}
      </View>

      {/* Duration selector */}
      <View style={styles.durationRow}>
        {([15, 30, 60] as Duration[]).map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.durationButton,
              {
                backgroundColor:
                  d === duration ? theme.colors.primary : 'rgba(255,255,255,0.15)',
              },
            ]}
            onPress={() => setDuration(d)}
            disabled={isRecording}
          >
            <Text
              style={[
                styles.durationText,
                { color: d === duration ? '#FFFFFF' : '#CCCCCC' },
              ]}
            >
              {d}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Camera controls row */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>🔄</Text>
          <Text style={styles.controlLabel}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>⏱️</Text>
          <Text style={styles.controlLabel}>Timer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>🎵</Text>
          <Text style={styles.controlLabel}>Music</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>✨</Text>
          <Text style={styles.controlLabel}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Record button + Gallery fallback */}
      <View style={styles.bottomControls}>
        {/* Gallery fallback */}
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handleGalleryUpload}
          disabled={isRecording}
        >
          <Text style={styles.galleryIcon}>🖼️</Text>
          <Text style={styles.galleryLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Record button */}
        <View style={styles.recordButtonContainer}>
          {/* Animated ring behind button */}
          {isRecording && (
            <Animated.View
              style={[
                styles.recordRingAnim,
                {
                  transform: [{ scale: ringScale }],
                  opacity: ringOpacity,
                  borderColor: theme.colors.primary,
                },
              ]}
            />
          )}
          <TouchableOpacity
            style={[
              styles.recordButton,
              {
                backgroundColor: isRecording ? '#FF0000' : '#FFFFFF',
                borderColor: isRecording ? '#FF0000' : theme.colors.primary,
              },
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            {isRecording ? (
              <View style={styles.recordSquare} />
            ) : (
              <View style={[styles.recordInner, { backgroundColor: theme.colors.primary }]} />
            )}
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {isRecording ? 'Release to stop' : 'Hold to record'}
          </Text>
        </View>

        {/* Spacer for alignment */}
        <View style={styles.galleryButton} />
      </View>

      {/* Goal picker modal */}
      {renderGoalPicker()}
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
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  goalSwitcher: {
    flex: 1,
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalSwitcherText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  goalSwitcherArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
  },
  streakBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(255,107,53,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  streakText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '700',
  },

  // Camera area
  cameraArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
  },
  cameraPlaceholder: {
    color: '#666666',
    fontSize: 24,
    fontWeight: '600',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF0000',
    marginRight: 6,
  },
  elapsedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Duration selector
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Camera controls
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 8,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 22,
  },
  controlLabel: {
    color: '#CCCCCC',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },

  // Bottom controls
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 12,
  },
  galleryButton: {
    alignItems: 'center',
    width: 60,
  },
  galleryIcon: {
    fontSize: 24,
  },
  galleryLabel: {
    color: '#CCCCCC',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },

  // Record button
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordRingAnim: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  recordSquare: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  recordHint: {
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },

  // Goal picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  goalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  goalItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  goalCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyGoals: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },
  modalCloseBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
