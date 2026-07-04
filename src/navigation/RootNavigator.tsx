import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { TabNavigator } from './TabNavigator';
import { SetupScreen } from '../screens/SetupScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';

// ---------------------------------------------------------------------------
// Auth Stack: OnboardingScreen → AuthScreen (OTP)
// ---------------------------------------------------------------------------

const AuthStack = createNativeStackNavigator();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Auth" component={AuthScreen} />
    </AuthStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Setup Stack (single screen, but uses a stack for consistency)
// ---------------------------------------------------------------------------

const SetupStack = createNativeStackNavigator();

function SetupStackNavigator() {
  return (
    <SetupStack.Navigator screenOptions={{ headerShown: false }}>
      <SetupStack.Screen name="Setup" component={SetupScreen} />
    </SetupStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Root Navigator — auth gate logic
// ---------------------------------------------------------------------------

const RootStack = createNativeStackNavigator();

export function RootNavigator() {
  const { isAuthenticated, needsSetup } = useAuth();

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="AuthStack" component={AuthStackNavigator} />
      ) : needsSetup ? (
        <RootStack.Screen name="SetupStack" component={SetupStackNavigator} />
      ) : (
        <RootStack.Screen name="MainTabs" component={TabNavigator} />
      )}
    </RootStack.Navigator>
  );
}
