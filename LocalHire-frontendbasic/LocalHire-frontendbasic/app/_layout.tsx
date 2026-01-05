import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';
import { StatusBar } from 'react-native';
import { COLORS } from '../constants/theme';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={COLORS.white}
          translucent={false}
        />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: {
              backgroundColor: COLORS.white,
            },
          }}
        >
        <Stack.Screen 
          name="index"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen 
          name="(auth)"
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen 
          name="(worker)"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen 
          name="(employer)"
          options={{
            animation: 'fade',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  </AuthProvider>
  );
}