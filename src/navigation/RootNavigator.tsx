import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';

// ---------------------------------------------------------------------------
// Root Navigator — always shows MainTabs (auth bypassed for testing)
// ---------------------------------------------------------------------------

const RootStack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
    </RootStack.Navigator>
  );
}
