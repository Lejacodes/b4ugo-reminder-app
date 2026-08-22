import { Redirect } from 'expo-router';

/**
 * Onboarding starts at the name card. Anyone who lands on the bare
 * /onboarding path is a signed-in user who hasn't finished setup yet.
 */
export default function OnboardingEntryScreen() {
  return <Redirect href="/onboarding/name" />;
}
