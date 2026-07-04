import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

/**
 * Request notification permissions, get the Expo push token,
 * and register it with the backend.
 *
 * - If the user denies permission: does nothing, doesn't block app usage.
 * - Errors are silently caught so the app never crashes due to push registration.
 */
export async function registerPushToken(): Promise<void> {
  try {
    // Must be a physical device for push tokens
    if (!Device.isDevice) {
      return;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permission denied, silently bail — don't block app usage
    if (finalStatus !== 'granted') {
      return;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Determine platform
    const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';

    // Register with backend
    await api.devices.register(token, platform);
  } catch {
    // Silent catch — push registration failure should never crash the app
  }
}
