import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface ProgressRingProps {
  /** Progress value between 0 and 1 */
  progress: number;
  /** Diameter of the ring in pixels */
  size?: number;
  /** Width of the ring stroke */
  strokeWidth?: number;
  /** Color of the filled portion */
  color?: string;
  /** Color of the unfilled track */
  trackColor?: string;
  /** Whether to animate changes */
  animated?: boolean;
}

/**
 * ProgressRing — circular progress indicator.
 *
 * Uses an Animated approach with a rotating half-circle clipping technique
 * (no SVG dependency required). Shows percentage in the center.
 *
 * Shared component — used in GoalDashboardScreen and GoalDetailScreen.
 */
export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  color = '#FF6B35',
  trackColor = '#E0E0E0',
  animated = true,
}: ProgressRingProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: clampedProgress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(clampedProgress);
    }
  }, [progress, animated, animatedProgress]);

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const halfSize = size / 2;
  const percentage = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  // First half rotation (0-180 degrees for 0-50% progress)
  const firstHalfRotation = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
  });

  // Second half rotation (0-180 degrees for 50-100% progress)
  const secondHalfRotation = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  // Opacity for second half (visible only after 50%)
  const secondHalfOpacity = animatedProgress.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Track (background circle) */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius + strokeWidth / 2,
            borderWidth: strokeWidth,
            borderColor: trackColor,
          },
        ]}
      />

      {/* First half (right side, rotates from top-right) */}
      <View
        style={[
          styles.halfClip,
          {
            width: halfSize,
            height: size,
            left: halfSize,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.halfCircle,
            {
              width: halfSize,
              height: size,
              borderTopRightRadius: halfSize,
              borderBottomRightRadius: halfSize,
              borderWidth: strokeWidth,
              borderLeftWidth: 0,
              borderColor: color,
              transform: [
                { translateX: -halfSize / 2 },
                { rotate: firstHalfRotation },
                { translateX: halfSize / 2 },
              ],
            },
          ]}
        />
      </View>

      {/* Second half (left side, rotates from top-left) */}
      <Animated.View
        style={[
          styles.halfClip,
          {
            width: halfSize,
            height: size,
            left: 0,
            opacity: secondHalfOpacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.halfCircle,
            {
              width: halfSize,
              height: size,
              borderTopLeftRadius: halfSize,
              borderBottomLeftRadius: halfSize,
              borderWidth: strokeWidth,
              borderRightWidth: 0,
              borderColor: color,
              transform: [
                { translateX: halfSize / 2 },
                { rotate: secondHalfRotation },
                { translateX: -halfSize / 2 },
              ],
            },
          ]}
        />
      </Animated.View>

      {/* Center text */}
      <View
        style={[
          styles.center,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
            top: strokeWidth,
            left: strokeWidth,
          },
        ]}
      >
        <Text
          style={[
            styles.percentageText,
            { fontSize: size * 0.22 },
          ]}
        >
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  circle: {
    position: 'absolute',
  },
  halfClip: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
