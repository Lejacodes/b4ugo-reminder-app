import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
import { readableType, readableFont } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
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
  const colors = useScrapbookPalette();
  const { createAccount, isSubmitting } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [problem, setProblem] = useState<AuthErrorCode | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [consentProblem, setConsentProblem] = useState(false);

  const passwordRef = useRef<TextInput | null>(null);
  const confirmRef = useRef<TextInput | null>(null);

  const message = consentProblem
    ? 'Please agree to the Terms to create an account.'
    : problem
      ? new AuthError(problem).message
      : null;

  /** Clears the slip as soon as the user starts fixing what it complained about. */
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (problem) setProblem(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setProblem(null);
    setConsentProblem(false);

    if (!acceptedTerms) {
      setConsentProblem(true);
      return;
    }

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
        <Text style={[styles.subtitle, { color: colors.inkSoft }]}>
          let&apos;s make you a shelf of your own.
        </Text>
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

        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Agree to the Terms and conditions"
          accessibilityState={{ checked: acceptedTerms }}
          onPress={() => {
            setAcceptedTerms((current) => !current);
            setConsentProblem(false);
          }}
          style={({ pressed }) => [styles.consentRow, pressed && styles.pressed]}>
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.ink, backgroundColor: acceptedTerms ? colors.butter : colors.paper },
            ]}>
            <Text style={[styles.checkmark, { color: colors.inkOnMatcha }]}>
              {acceptedTerms ? '✓' : ''}
            </Text>
          </View>
          <Text style={[styles.consentText, { color: colors.ink }]}>
            I agree to the Terms and conditions.
          </Text>
        </Pressable>
        <View style={styles.legalLinks}>
          <QuietLink
            label="read terms"
            accessibilityLabel="Read terms and conditions"
            onPress={() => router.push('/legal/terms')}
          />
          <QuietLink
            label="read privacy notice"
            accessibilityLabel="Read privacy notice"
            onPress={() => router.push('/legal/privacy')}
          />
        </View>

        <View style={styles.actions}>
          <ButterButton
            label="make my account"
            accessibilityLabel="Create account"
            busy={isSubmitting}
            onPress={handleSubmit}
          />
        </View>

        <Text style={[styles.fineprint, { color: colors.inkSoft }]}>
          We keep your email address so you can get back in. Your password is handled by the
          sign-in service and is never stored on this device.
        </Text>
      </PaperPanel>

      <View style={styles.footer}>
        <Text style={[styles.subtitle, { color: colors.inkSoft }]}>already have one?</Text>
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
  subtitle: {
    ...readableFont,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    marginTop: 6,
  },
  actions: {
    marginTop: 10,
  },
  consentRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    ...readableFont,
    fontWeight: '700',
  },
  consentText: {
    flex: 1,
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: 20,
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  fineprint: {
    marginTop: 20,
    ...readableFont,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
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
