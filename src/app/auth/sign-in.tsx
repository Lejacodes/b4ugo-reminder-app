import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  ButterButton,
  DeskScreen,
  Handwriting,
  PaperField,
  PaperPanel,
  PlaceholderAuthNotice,
  QuietLink,
  SlipNote,
} from '@/components/scrapbook';
import {
  AuthError,
  MAX_PASSWORD_LENGTH,
  toAuthError,
  validateSignIn,
  type AuthErrorCode,
} from '@/lib/auth';
import { useAuth } from '@/store/AuthProvider';

/** RFC 5321 caps an address at 254 characters. */
const MAX_EMAIL_LENGTH = 254;

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, isSubmitting } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<AuthErrorCode | null>(null);

  const passwordRef = useRef<TextInput | null>(null);

  const message = problem ? new AuthError(problem).message : null;

  /** Clears the slip as soon as the user starts fixing what it complained about. */
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (problem) setProblem(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setProblem(null);

    const invalid = validateSignIn(email, password);
    if (invalid) {
      setProblem(invalid);
      return;
    }

    try {
      await signIn(email, password);
      // Routing is handled by the session guard once the status flips.
    } catch (caught) {
      setProblem(toAuthError(caught).code);
    }
  };

  return (
    <DeskScreen scroll>
      <View style={styles.header}>
        <Handwriting variant="display" accessibilityRole="header">
          welcome back.
        </Handwriting>
        <Handwriting variant="aside" tone="soft">
          everything&apos;s where you left it.
        </Handwriting>
      </View>

      <PaperPanel tilt="1.1deg" tape="top-left">
        <SlipNote message={message} />

        <PaperField
          label="email"
          placeholder="you@example.com"
          value={email}
          onChangeText={edit(setEmail)}
          invalid={problem !== null}
          editable={!isSubmitting}
          maxLength={MAX_EMAIL_LENGTH}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <PaperField
          label="password"
          inputRef={passwordRef}
          value={password}
          onChangeText={edit(setPassword)}
          invalid={problem !== null && problem !== 'invalid-email'}
          editable={!isSubmitting}
          maxLength={MAX_PASSWORD_LENGTH}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <View style={styles.actions}>
          <ButterButton
            label="come in"
            accessibilityLabel="Log in"
            busy={isSubmitting}
            onPress={handleSubmit}
          />
        </View>
      </PaperPanel>

      <View style={styles.footer}>
        <Handwriting variant="aside" tone="soft">
          first time here?
        </Handwriting>
        <QuietLink
          label="create an account"
          accessibilityLabel="Go to create account"
          disabled={isSubmitting}
          onPress={() => router.replace('/auth/create-account')}
        />
      </View>

      <PlaceholderAuthNotice />
    </DeskScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 12,
    marginBottom: 22,
    paddingLeft: 4,
  },
  actions: {
    marginTop: 10,
  },
  footer: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 4,
  },
});
