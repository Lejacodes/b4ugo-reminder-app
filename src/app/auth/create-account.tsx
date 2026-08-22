import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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
import { readableType, scrapbookPalette, TEXT_FONT } from '@/constants/scrapbook';
import {
  AuthError,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  toAuthError,
  validateCreateAccount,
  type AuthErrorCode,
} from '@/lib/auth';
import { useAuth } from '@/store/AuthProvider';

const EMAIL_PROBLEMS: AuthErrorCode[] = ['invalid-email', 'email-taken'];
const PASSWORD_PROBLEMS: AuthErrorCode[] = ['weak-password', 'password-mismatch'];

/** RFC 5321 caps an address at 254 characters. */
const MAX_EMAIL_LENGTH = 254;

export default function CreateAccountScreen() {
  const router = useRouter();
  const { createAccount, isSubmitting } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [problem, setProblem] = useState<AuthErrorCode | null>(null);

  const passwordRef = useRef<TextInput | null>(null);
  const confirmRef = useRef<TextInput | null>(null);

  const message = problem ? new AuthError(problem).message : null;

  /** Clears the slip as soon as the user starts fixing what it complained about. */
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (problem) setProblem(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setProblem(null);

    const invalid = validateCreateAccount(email, password, confirmPassword);
    if (invalid) {
      setProblem(invalid);
      return;
    }

    try {
      await createAccount(email, password);
      // Routing is handled by the session guard once the status flips.
    } catch (caught) {
      setProblem(toAuthError(caught).code);
    }
  };

  return (
    <DeskScreen scroll>
      <View style={styles.header}>
        <Handwriting variant="display" accessibilityRole="header">
          new here?
        </Handwriting>
        <Handwriting variant="aside" tone="soft">
          let&apos;s make you a shelf of your own.
        </Handwriting>
      </View>

      <PaperPanel tilt="-1.2deg" tape="top-right">
        <SlipNote message={message} />

        <PaperField
          label="email"
          placeholder="you@example.com"
          value={email}
          onChangeText={edit(setEmail)}
          invalid={problem !== null && EMAIL_PROBLEMS.includes(problem)}
          editable={!isSubmitting}
          maxLength={MAX_EMAIL_LENGTH}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <PaperField
          label="password"
          inputRef={passwordRef}
          hint={`at least ${MIN_PASSWORD_LENGTH} characters`}
          value={password}
          onChangeText={edit(setPassword)}
          invalid={problem !== null && PASSWORD_PROBLEMS.includes(problem)}
          editable={!isSubmitting}
          maxLength={MAX_PASSWORD_LENGTH}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />

        <PaperField
          label="password again"
          inputRef={confirmRef}
          hint="type it once more so we know it's right"
          value={confirmPassword}
          onChangeText={edit(setConfirmPassword)}
          invalid={problem === 'password-mismatch'}
          editable={!isSubmitting}
          maxLength={MAX_PASSWORD_LENGTH}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <View style={styles.actions}>
          <ButterButton
            label="make my account"
            accessibilityLabel="Create account"
            busy={isSubmitting}
            onPress={handleSubmit}
          />
        </View>

        <Text style={styles.fineprint}>
          We keep your email address so you can get back in. Your password is handled by the
          sign-in service and is never stored on this device.
        </Text>
      </PaperPanel>

      <View style={styles.footer}>
        <Handwriting variant="aside" tone="soft">
          already have one?
        </Handwriting>
        <QuietLink
          label="log in instead"
          accessibilityLabel="Go to log in"
          disabled={isSubmitting}
          onPress={() => router.replace('/auth/sign-in')}
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
  fineprint: {
    marginTop: 20,
    fontFamily: TEXT_FONT,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
    color: scrapbookPalette.inkSoft,
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
