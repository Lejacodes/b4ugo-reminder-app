import { useRouter } from 'expo-router';

import { OpeningLogin } from '@/components/opening-login';
import { markOpeningEntered } from '@/lib/opening-session';

export default function OpeningScreen() {
  const router = useRouter();

  const go = (path: '/auth/create-account' | '/auth/sign-in') => {
    // Lets the guard stop sending the user back here for the rest of the launch.
    markOpeningEntered();
    router.replace(path);
  };

  return (
    <OpeningLogin
      onCreateAccount={() => go('/auth/create-account')}
      onSignIn={() => go('/auth/sign-in')}
    />
  );
}
