import { useState, type RefObject } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import {
  DISPLAY_FONT,
  readableType,
  scrapbookPalette,
  scrapbookType,
  TEXT_FONT,
} from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';

type PaperFieldProps = Omit<TextInputProps, 'style'> & {
  /** Written above the line. Omit when the surrounding copy already says it. */
  label?: string;
  /** Always-visible rule or example, in the readable face. */
  hint?: string;
  inputRef?: RefObject<TextInput | null>;
  /** Marks the field as the one the current error refers to. */
  invalid?: boolean;
  /**
   * `data` (default) sets the typed value in the system sans — correct for
   * emails, passwords, and anything that has to be read exactly.
   * `handwritten` keeps Starry Night, for short expressive answers like a name.
   */
  variant?: 'data' | 'handwritten';
};

/**
 * A line ruled on the paper with a handwritten label above it.
 *
 * Passwords are held only in the caller's transient form state; nothing here
 * caches, echoes, or reports a value. `spellCheck` and `autoCorrect` stay off
 * on every field so no keyboard learns an address or a password.
 */
export function PaperField({
  label,
  hint,
  inputRef,
  invalid = false,
  variant = 'data',
  ...inputProps
}: PaperFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const { secureTextEntry, editable = true, ...rest } = inputProps;
  const masked = Boolean(secureTextEntry);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.line,
          focused && styles.lineFocused,
          invalid && styles.lineInvalid,
          !editable && styles.lineDisabled,
        ]}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          placeholderTextColor={scrapbookPalette.inkSoft}
          autoCorrect={false}
          spellCheck={false}
          {...rest}
          editable={editable}
          secureTextEntry={masked && !revealed}
          style={[styles.input, variant === 'handwritten' && styles.inputHandwritten]}
        />

        {masked && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            accessibilityState={{ expanded: revealed }}
            disabled={!editable}
            onPress={() => setRevealed((current) => !current)}
            hitSlop={10}
            style={({ pressed }) => [styles.reveal, pressed && styles.revealPressed]}>
            <Text style={styles.revealLabel}>{revealed ? 'hide' : 'show'}</Text>
          </Pressable>
        )}
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  label: {
    fontFamily: DISPLAY_FONT,
    fontSize: scrapbookType.aside.fontSize,
    lineHeight: scrapbookType.aside.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginBottom: 2,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: scrapbookPalette.line,
    // Reserve the focused/invalid border weight so the line never shifts.
    paddingBottom: 1,
  },
  lineFocused: {
    borderBottomColor: scrapbookPalette.butterDeep,
    borderBottomWidth: 2,
    paddingBottom: 0,
  },
  lineInvalid: {
    borderBottomColor: scrapbookPalette.blushDeep,
    borderBottomWidth: 2,
    paddingBottom: 0,
  },
  lineDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontFamily: TEXT_FONT,
    fontSize: readableType.input.fontSize,
    color: scrapbookPalette.ink,
    minHeight: minTouchTarget,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  inputHandwritten: {
    fontFamily: DISPLAY_FONT,
    fontSize: scrapbookType.body.fontSize,
  },
  reveal: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 2,
  },
  revealPressed: {
    opacity: 0.6,
  },
  revealLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.helper.fontSize,
    color: scrapbookPalette.inkSoft,
    textDecorationLine: 'underline',
  },
  hint: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.helper.fontSize,
    lineHeight: readableType.helper.lineHeight,
    color: scrapbookPalette.inkSoft,
    marginTop: 5,
    paddingHorizontal: 2,
  },
});
