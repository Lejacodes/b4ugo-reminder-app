import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerRight: () => null,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    />
  );
}
