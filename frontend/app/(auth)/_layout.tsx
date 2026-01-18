import { Stack } from 'expo-router';
import React from 'react';
import { COLORS } from '../../constants/theme';

export default function AuthLayout() {
  return (
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
        name="login"
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="register"
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="forgot-password"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}