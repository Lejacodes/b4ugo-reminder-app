import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { OpeningLogin } from '@/components/opening-login';
import { markOpeningEntered } from '@/lib/opening-session';
import { useAuth } from '@/store/AuthProvider';

export default function OpeningScreen() {
  const router = useRouter();
  const { status } = useAuth();
  const [sequenceDone, setSequenceDone] = useState(false);

  const handleSequenceComplete = useCallback(() => {
    setSequenceDone(true);
  }, []);

  useEffect(() => {
    if (!sequenceDone) return;
    if (status === 'signed-in') {
      markOpeningEntered();
    }
  }, [sequenceDone, status]);

  const go = (path: '/auth/create-account' | '/auth/sign-in') => {
    markOpeningEntered();
    router.replace(path);
  };

  return (
    <OpeningLogin
      onCreateAccount={() => go('/auth/create-account')}
      onSignIn={() => go('/auth/sign-in')}
      onSequenceComplete={handleSequenceComplete}
      showLogin={status === 'signed-out'}
    />
  );
}
