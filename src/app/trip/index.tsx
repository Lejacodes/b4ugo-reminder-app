import { Redirect } from 'expo-router';

/** Stack entry for `/trip` — the tab owns the landing page. */
export default function TripIndexRedirect() {
  return <Redirect href="/(tabs)/trips" />;
}
