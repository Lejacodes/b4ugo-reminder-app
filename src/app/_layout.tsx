import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { STARRY_NIGHT_FONT } from '@/constants/opening';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionGuard } from '@/hooks/use-session-guard';
import { AuthProvider, useAuth } from '@/store/AuthProvider';
import { PreferencesProvider } from '@/store/PreferencesProvider';

import 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { status } = useAuth();
  useSessionGuard();

  // Stay on the splash until the stored session has been checked, so a
  // returning user never sees the opening window flash past on the way to Home.
  useEffect(() => {
    if (status !== 'restoring') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="opening" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="auth" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="onboarding"
          options={{ gestureEnabled: false, animation: 'fade' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [STARRY_NIGHT_FONT]: require('../font/starrynight.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PreferencesProvider>
          <RootNavigator />
        </PreferencesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
