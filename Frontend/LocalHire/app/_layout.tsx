import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(worker)" />
        <Stack.Screen name="(employer)" />
      </Stack>
    </SafeAreaProvider>
  );
}