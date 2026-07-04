import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const navigation = useNavigation<any>();

  // Local toggle states — persisted immediately via API on change
  const [pushEnabled, setPushEnabled] = useState(true);
  const [visibility, setVisibility] = useState<'public' | 'squad'>('public');
  const [aiTipsEnabled, setAiTipsEnabled] = useState(true);

  // --- Toggle handlers (persist immediately, no save button) ---

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    toggleTheme();
    api.settings.update({ theme: newTheme });
  };

  const handlePushToggle = (value: boolean) => {
    setPushEnabled(value);
    api.settings.update({ push_enabled: value });
  };

  const handleVisibilityToggle = (value: boolean) => {
    const newVisibility = value ? 'squad' : 'public';
    setVisibility(newVisibility);
    api.settings.update({ visibility: newVisibility });
  };

  const handleAiTipsToggle = (value: boolean) => {
    setAiTipsEnabled(value);
    api.settings.update({ ai_tips_enabled: value });
  };

  // --- Navigation handlers ---

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handlePrivacy = () => {
    // Placeholder — privacy sub-page not yet built
    Alert.alert('Privacy', 'Privacy settings coming soon.');
  };

  const handleInvite = async () => {
    try {
      await Share.share({
        message:
          'Join me on HypeSquad — the accountability app that actually works! Download now.',
      });
    } catch (_e) {
      // User cancelled or share failed silently
    }
  };

  const handleAbout = () => {
    Alert.alert('About', 'HypeSquad v1.0.0\nBuilt with love for accountability.');
  };

  const handleSignOut = () => {
    signOut();
  };

  const handleProUpgrade = () => {
    // Navigate to ProUpgrade flow (placeholder)
    Alert.alert('Pro Upgrade', 'Subscription flow coming soon.');
  };

  const colors = theme.colors;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Pro Upgrade Card */}
      <TouchableOpacity
        style={[styles.proCard, { backgroundColor: colors.primary }]}
        onPress={handleProUpgrade}
        activeOpacity={0.8}
      >
        <Text style={[styles.proTitle, { color: colors.textInverse }]}>
          Upgrade to Pro
        </Text>
        <Text style={[styles.proSubtitle, { color: colors.textInverse }]}>
          Unlock AI coaching, unlimited squads, and more
        </Text>
      </TouchableOpacity>

      {/* Toggles Section */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Preferences
        </Text>

        {/* Theme Toggle */}
        <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={handleThemeToggle}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
          />
        </View>

        {/* Push Notifications Toggle */}
        <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            Push Notifications
          </Text>
          <Switch
            value={pushEnabled}
            onValueChange={handlePushToggle}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={pushEnabled ? colors.primary : '#f4f3f4'}
          />
        </View>

        {/* Visibility Toggle */}
        <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.rowLabelGroup}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              Squad-Only Visibility
            </Text>
            <Text style={[styles.rowCaption, { color: colors.textSecondary }]}>
              {visibility === 'squad' ? 'Only squad members can see you' : 'Visible to everyone'}
            </Text>
          </View>
          <Switch
            value={visibility === 'squad'}
            onValueChange={handleVisibilityToggle}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={visibility === 'squad' ? colors.primary : '#f4f3f4'}
          />
        </View>

        {/* AI Tips Toggle */}
        <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            AI Tips
          </Text>
          <Switch
            value={aiTipsEnabled}
            onValueChange={handleAiTipsToggle}
            trackColor={{ false: colors.disabled, true: colors.primaryLight }}
            thumbColor={aiTipsEnabled ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Navigation Rows Section */}
      <View style={[styles.section, { borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Account
        </Text>

        <TouchableOpacity
          style={[styles.navRow, { borderBottomColor: colors.borderLight }]}
          onPress={handleEditProfile}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            Edit Profile
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>
            ›
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navRow, { borderBottomColor: colors.borderLight }]}
          onPress={handlePrivacy}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>Privacy</Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>
            ›
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navRow, { borderBottomColor: colors.borderLight }]}
          onPress={handleInvite}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            Invite Friends
          </Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>
            ›
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navRow, { borderBottomColor: colors.borderLight }]}
          onPress={handleAbout}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>About</Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>
            ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: colors.error }]}
        onPress={handleSignOut}
      >
        <Text style={[styles.signOutText, { color: colors.error }]}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  proCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  proTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  proSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabelGroup: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowCaption: {
    fontSize: 12,
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  signOutButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
