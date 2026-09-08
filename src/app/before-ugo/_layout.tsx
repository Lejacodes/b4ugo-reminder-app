import { Stack } from 'expo-router';

export default function BeforeUgoLayout() {
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
