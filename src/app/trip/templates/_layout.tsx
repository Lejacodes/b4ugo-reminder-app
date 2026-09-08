import { Stack } from 'expo-router';

export default function TemplatesLayout() {
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
