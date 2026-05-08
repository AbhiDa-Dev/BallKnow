/**
 * BallKnow Main App Component
 * Entry point with bottom tab navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import LeaderboardScreen from './src/screens/LeaderboardScreen';
import GameEditorScreen from './src/screens/GameEditorScreen';
import LiveGameTrackerScreen from './src/screens/LiveGameTrackerScreen';

const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
    borderTopWidth: 1,
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#FFB81C',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: styles.tabBar,
          headerStyle: {
            backgroundColor: '#1a1a1a',
            borderBottomColor: '#333',
            borderBottomWidth: 1,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{
            title: 'Ball Knowledge',
            tabBarLabel: 'Leaderboard',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="podium" color={color} size={size} />
            ),
            headerShown: true,
          }}
        />
        <Tab.Screen
          name="LiveTracker"
          component={LiveGameTrackerScreen}
          options={{
            title: 'Live Tracker',
            tabBarLabel: 'Live Tracker',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="basketball" color={color} size={size} />
            ),
            headerShown: true,
          }}
        />
        <Tab.Screen
          name="GameEditor"
          component={GameEditorScreen}
          options={{
            title: 'Log Game',
            tabBarLabel: 'Log Game',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="pencil" color={color} size={size} />
            ),
            headerShown: true,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
