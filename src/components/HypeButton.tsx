import React, { useRef, useState, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';

// ---------------------------------------------------------------------------
// Particle configuration
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = 8;
const PARTICLE_RADIUS = 28;
const PARTICLE_SIZE = 6;
const ANIMATION_DURATION = 500;

interface HypeButtonProps {
  postId: string;
  initialHypeCount: number;
  initialHyped: boolean;
}

/**
 * Shared HypeButton with optimistic UI and particle-burst animation.
 * Used by PostCard (feed) and later by ReelCard (reels).
 */
export function HypeButton({
  postId,
  initialHypeCount,
  initialHyped,
}: HypeButtonProps) {
  const { theme } = useTheme();
  const [hyped, setHyped] = useState(initialHyped);
  const [hypeCount, setHypeCount] = useState(initialHypeCount);
  const [inflight, setInflight] = useState(false);

  // Particle animation value (0 → 1)
  const burstAnim = useRef(new Animated.Value(0)).current;

  const triggerBurst = useCallback(() => {
    burstAnim.setValue(0);
    Animated.timing(burstAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [burstAnim]);

  const handlePress = useCallback(async () => {
    if (hyped || inflight) return; // Already hyped or request in flight

    // 1. Optimistic update
    setHyped(true);
    setHypeCount((c) => c + 1);
    triggerBurst();
    setInflight(true);

    try {
      // 2. Fire API call
      await api.posts.hype(postId);
      // 3. Success — optimistic state already matches, no-op
    } catch {
      // 4. Failure — rollback
      setHyped(false);
      setHypeCount((c) => c - 1);
    } finally {
      setInflight(false);
    }
  }, [hyped, inflight, postId, triggerBurst]);

  // Generate particles positioned in a circle
  const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
    const angle = (2 * Math.PI * i) / PARTICLE_COUNT;
    const translateX = burstAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.cos(angle) * PARTICLE_RADIUS],
    });
    const translateY = burstAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.sin(angle) * PARTICLE_RADIUS],
    });
    const opacity = burstAnim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 1, 0],
    });
    const scale = burstAnim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 1, 0.3],
    });

    return (
      <Animated.View
        key={i}
        style={[
          styles.particle,
          {
            backgroundColor: theme.colors.primary,
            transform: [{ translateX }, { translateY }, { scale }],
            opacity,
          },
        ]}
      />
    );
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={hyped ? 'Hyped' : 'Hype'}
    >
      <View style={styles.burstContainer}>
        {particles}
        <Text
          style={[
            styles.icon,
            { color: hyped ? theme.colors.primary : theme.colors.textSecondary },
          ]}
        >
          🔥
        </Text>
      </View>
      <Text
        style={[
          styles.count,
          {
            color: hyped ? theme.colors.primary : theme.colors.textSecondary,
            ...theme.typography.captionBold,
          },
        ]}
      >
        {hypeCount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  burstContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
  },
  icon: {
    fontSize: 18,
  },
  count: {
    marginLeft: 4,
  },
});
