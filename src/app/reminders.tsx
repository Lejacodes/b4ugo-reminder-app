import { Redirect } from 'expo-router';

/** Legacy Specific / reminders deep links land on Home. */
export default function RemindersRedirect() {
  return <Redirect href="/(tabs)" />;
}
