import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import { OpeningLogin } from '@/components/opening-login';
import { markOpeningEntered } from '@/lib/opening-session';
import { useAuth } from '@/store/AuthProvider';

export default function OpeningScreen() {
  const router = useRouter();
  const { status } = useAuth();

  const handleSequenceComplete = useCallback(() => {
    if (status === 'signed-in') markOpeningEntered();
  }, [status]);

  const go = (path: '/auth/create-account' | '/auth/sign-in') => {
    markOpeningEntered();
    router.replace(path);
  };

  // Returning sessions never play the paper sequence. Splash stays up until
  // the session guard replaces this route with tabs or onboarding.
  if (status === 'restoring' || status === 'signed-in') {
    return null;
  }

  return (
    <OpeningLogin
      onCreateAccount={() => go('/auth/create-account')}
      onSignIn={() => go('/auth/sign-in')}
      onSequenceComplete={handleSequenceComplete}
      showLogin={status === 'signed-out'}
    />
  );
}
