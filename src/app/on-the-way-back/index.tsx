import { Redirect } from 'expo-router';

/** Deep links and notifications still use /on-the-way-back. */
export default function OnTheWayBackRedirect() {
  return <Redirect href="/(tabs)/on-the-way-back" />;
}
