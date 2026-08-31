import '@/lib/location/geofence-task';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { STARRY_NIGHT_FONT } from '@/constants/opening';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionGuard } from '@/hooks/use-session-guard';
import { AppearanceProvider } from '@/store/AppearanceProvider';
import { AuthProvider } from '@/store/AuthProvider';
import { ContextIntelligenceProvider } from '@/store/ContextIntelligenceProvider';
import { PushNotificationProvider } from '@/store/PushNotificationProvider';
import { LittleGuyProvider } from '@/store/LittleGuyProvider';
import { PlaceProvider } from '@/store/PlaceProvider';
import { PreferencesProvider } from '@/store/PreferencesProvider';
import { ReminderProvider } from '@/store/ReminderProvider';
import { TripProvider } from '@/store/TripProvider';

import 'react-native-gesture-handler';

export const unstable_settings = {
  initialRouteName: 'opening',
};

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const colorScheme = useColorScheme();
  useSessionGuard();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="opening" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="auth" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ freezeOnBlur: false }} />
        <Stack.Screen name="before-ugo" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="on-the-way-back" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="trip" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="little-guy" options={{ animation: 'slide_from_right' }} />
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
          <AppearanceProvider>
            <ReminderProvider>
              <TripProvider>
                <PlaceProvider>
                  <LittleGuyProvider>
                    <ContextIntelligenceProvider>
                      <PushNotificationProvider>
                        <RootNavigator />
                      </PushNotificationProvider>
                    </ContextIntelligenceProvider>
                  </LittleGuyProvider>
                </PlaceProvider>
              </TripProvider>
            </ReminderProvider>
          </AppearanceProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
