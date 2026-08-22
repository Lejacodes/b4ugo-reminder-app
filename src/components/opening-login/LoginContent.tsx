import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { palette as brand } from '@/constants/colors';
import { openingEase, openingPalette, openingTiming, STARRY_NIGHT_FONT } from '@/constants/opening';
import { minTouchTarget } from '@/constants/typography';

type LoginContentProps = {
  visible: boolean;
  reduceMotion?: boolean;
  onCreateAccount: () => void;
  onSignIn: () => void;
};

const fadeIn = {
  from: {
    opacity: 0,
    transform: [{ translateY: 10 }],
  },
  to: {
    opacity: 1,
    transform: [{ translateY: 0 }],
  },
};

/**
 * Login copy written onto the settled sheet.
 *
 * The two choices here are the whole of this window's job. Email, password,
 * and name are asked for on their own screens once the user has picked a
 * path — an account has to exist before there is anywhere to keep a name.
 */
export function LoginContent({
  visible,
  reduceMotion = false,
  onCreateAccount,
  onSignIn,
}: LoginContentProps) {
  if (!visible) return null;

  return (
    <Animated.View
      className="opening-animated"
      style={[
        styles.wrap,
        !reduceMotion && {
          animationName: fadeIn,
          animationDuration: `${openingTiming.loginFadeMs}ms`,
          animationTimingFunction: openingEase,
          animationFillMode: 'forwards',
        },
      ]}>
      <Text style={styles.hello}>hello.</Text>
      <Text style={styles.aside}>leave it here for later.</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create account"
        onPress={onCreateAccount}
        style={({ pressed }) => [styles.seal, pressed && styles.pressed]}>
          <View style={[styles.sealBacking]} />
        <Text style={styles.sealLabel}>create account</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log in"
        onPress={onSignIn}
        hitSlop={8}
        style={({ pressed }) => [styles.quiet, pressed && styles.pressed]}>
        <Text style={styles.quietLabel}>log in</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  hello: {
    fontFamily: STARRY_NIGHT_FONT,
    fontSize: 40,
    lineHeight: 48,
    color: openingPalette.ink,
  },
  aside: {
    fontFamily: STARRY_NIGHT_FONT,
    fontSize: 22,
    lineHeight: 28,
    color: openingPalette.inkSoft,
    marginBottom: 28,
  },
  seal: {
    alignSelf: 'flex-start',
    marginTop: 12,
    minHeight: minTouchTarget,
    minWidth: 128,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    transform: [{ rotate: '-2deg' }],
  },
  sealBacking: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: openingPalette.butter,
    borderWidth: 1,
    borderColor: openingPalette.ink,
    transform: [{ rotate: '1.5deg' }],
  },
  sealLabel: {
    fontFamily: STARRY_NIGHT_FONT,
    fontSize: 24,
    color: brand.cream,
    textAlign: 'center',
  },
  quiet: {
    alignSelf: 'flex-start',
    marginTop: 10,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quietLabel: {
    fontFamily: STARRY_NIGHT_FONT,
    fontSize: 20,
    color: openingPalette.inkSoft,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.78,
  },
});
