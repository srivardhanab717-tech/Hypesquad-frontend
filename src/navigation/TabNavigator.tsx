import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { GoalCreationScreen } from '../screens/GoalCreationScreen';
import { GoalDashboardScreen } from '../screens/GoalDashboardScreen';
import { GoalDetailScreen } from '../screens/GoalDetailScreen';
import { HomeFeedScreen } from '../screens/HomeFeedScreen';
import { AICoachScreen } from '../screens/AICoachScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { NewPostScreen } from '../screens/NewPostScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FollowListScreen } from '../screens/FollowListScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SquadChatScreen } from '../screens/SquadChatScreen';
import { BodyDoubleScreen } from '../screens/BodyDoubleScreen';
import { SquadBrowserScreen } from '../screens/SquadBrowserScreen';
import { CreateSquadScreen } from '../screens/CreateSquadScreen';
import { RecordReelScreen } from '../screens/RecordReelScreen';
import { ReelsFeedScreen } from '../screens/ReelsFeedScreen';
import { MilestoneCardScreen } from '../screens/MilestoneCardScreen';
import { BookingCheckoutScreen } from '../screens/BookingCheckoutScreen';
import { ProUpgradeScreen } from '../screens/ProUpgradeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { CoachMarketplaceScreen } from '../screens/CoachMarketplaceScreen';

// ---------------------------------------------------------------------------
// Placeholder screen components for push targets not yet built
// ---------------------------------------------------------------------------

function PlaceholderComponent({ route }: { route: { name: string } }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>{route.name}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Per-tab native stack navigators (allow pushing child screens)
// ---------------------------------------------------------------------------

const HomeStack = createNativeStackNavigator();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeFeed" component={HomeFeedScreen} />
      {/* Push targets from HomeFeedScreen */}
      <HomeStack.Screen name="GoalDetail" component={GoalDetailScreen} />
      <HomeStack.Screen name="Profile" component={PlaceholderComponent} />
      <HomeStack.Screen
        name="NewPost"
        component={NewPostScreen}
        options={{ presentation: 'modal' }}
      />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen
        name="ReelsFeed"
        component={ReelsFeedScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="RecordReel"
        component={RecordReelScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen name="Discover" component={DiscoverScreen} />
      <HomeStack.Screen name="Search" component={SearchScreen} />
      <HomeStack.Screen
        name="BodyDouble"
        component={BodyDoubleScreen}
        options={{
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

const GoalsStack = createNativeStackNavigator();
function GoalsStackNavigator() {
  return (
    <GoalsStack.Navigator screenOptions={{ headerShown: false }}>
      <GoalsStack.Screen name="GoalDashboard" component={GoalDashboardScreen} />
      <GoalsStack.Screen name="GoalCreation" component={GoalCreationScreen} />
      <GoalsStack.Screen name="GoalDetail" component={GoalDetailScreen} />
      <GoalsStack.Screen name="MilestoneCard" component={MilestoneCardScreen} />
    </GoalsStack.Navigator>
  );
}

const CoachStack = createNativeStackNavigator();
function CoachStackNavigator() {
  return (
    <CoachStack.Navigator screenOptions={{ headerShown: false }}>
      <CoachStack.Screen name="AICoach" component={AICoachScreen} />
      <CoachStack.Screen name="CoachMarketplace" component={CoachMarketplaceScreen} />
      <CoachStack.Screen name="BookingCheckout" component={BookingCheckoutScreen} />
    </CoachStack.Navigator>
  );
}

const SquadsStack = createNativeStackNavigator();
function SquadsStackNavigator() {
  return (
    <SquadsStack.Navigator screenOptions={{ headerShown: false }}>
      <SquadsStack.Screen name="SquadBrowser" component={SquadBrowserScreen} />
      <SquadsStack.Screen name="CreateSquad" component={CreateSquadScreen} />
      <SquadsStack.Screen
        name="SquadChat"
        component={SquadChatScreen}
        options={{ headerShown: false }}
      />
    </SquadsStack.Navigator>
  );
}

const MeStack = createNativeStackNavigator();
function MeStackNavigator() {
  return (
    <MeStack.Navigator screenOptions={{ headerShown: false }}>
      <MeStack.Screen name="Profile" component={ProfileScreen} />
      <MeStack.Screen name="FollowList" component={FollowListScreen} />
      <MeStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <MeStack.Screen name="Settings" component={SettingsScreen} />
      <MeStack.Screen name="EditProfile" component={PlaceholderComponent} />
      <MeStack.Screen name="ProUpgrade" component={ProUpgradeScreen} />
    </MeStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Bottom Tab Navigator — 5 tabs
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Goals" component={GoalsStackNavigator} />
      <Tab.Screen name="Coach" component={CoachStackNavigator} />
      <Tab.Screen name="Squads" component={SquadsStackNavigator} />
      <Tab.Screen name="Me" component={MeStackNavigator} />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});
