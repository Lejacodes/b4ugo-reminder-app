import { Stack } from 'expo-router';

export default function OpeningLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
      }}
    />
  );
}
