import { useState, type RefObject } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { readableType, readableFont } from '@/constants/scrapbook';
import { minTouchTarget } from '@/constants/typography';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';

type PaperFieldProps = Omit<TextInputProps, 'style'> & {
  /** Written above the line. Omit when the surrounding copy already says it. */
  label?: string;
  /** Always-visible rule or example, in the readable face. */
  hint?: string;
  inputRef?: RefObject<TextInput | null>;
  /** Marks the field as the one the current error refers to. */
  invalid?: boolean;
  /** Kept for callers; both variants use the readable system face. */
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
  variant: _variant = 'data',
  ...inputProps
}: PaperFieldProps) {
  const palette = useScrapbookPalette();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const { secureTextEntry, editable = true, ...rest } = inputProps;
  const masked = Boolean(secureTextEntry);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: palette.inkSoft }]}>{label}</Text> : null}

      <View
        style={[
          styles.line,
          { borderBottomColor: palette.line },
          focused && { borderBottomColor: palette.butterDeep, borderBottomWidth: 2, paddingBottom: 0 },
          invalid && { borderBottomColor: palette.blushDeep, borderBottomWidth: 2, paddingBottom: 0 },
          !editable && styles.lineDisabled,
        ]}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          placeholderTextColor={palette.inkSoft}
          autoCorrect={false}
          spellCheck={false}
          {...rest}
          editable={editable}
          secureTextEntry={masked && !revealed}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          style={[
            styles.input,
            { color: palette.ink },
            inputProps.multiline && styles.inputMultiline,
          ]}
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
            <Text style={[styles.revealLabel, { color: palette.inkSoft }]}>
              {revealed ? 'hide' : 'show'}
            </Text>
          </Pressable>
        )}
      </View>

      {hint ? <Text style={[styles.hint, { color: palette.inkSoft }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  label: {
    ...readableFont,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    fontWeight: '500',
    marginBottom: 2,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    // Reserve the focused/invalid border weight so the line never shifts.
    paddingBottom: 1,
  },
  lineDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    ...readableFont,
    fontSize: readableType.input.fontSize,
    minHeight: minTouchTarget,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 10,
    textAlignVertical: 'top',
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
    ...readableFont,
    fontSize: readableType.helper.fontSize,
    textDecorationLine: 'underline',
  },
  hint: {
    ...readableFont,
    fontSize: readableType.helper.fontSize,
    lineHeight: readableType.helper.lineHeight,
    marginTop: 5,
    paddingHorizontal: 2,
  },
});
