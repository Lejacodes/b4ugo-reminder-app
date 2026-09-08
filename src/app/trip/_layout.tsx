import { Stack } from 'expo-router';

export default function TripsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerRight: () => null,
        animation: 'slide_from_right',
      }}
    />
  );
}
