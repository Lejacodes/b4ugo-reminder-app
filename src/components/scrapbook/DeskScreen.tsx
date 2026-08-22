import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { scrapbookPalette } from '@/constants/scrapbook';

type DeskScreenProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Use for anything taller than the sheet. */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Faint star scatter on the desk itself, behind everything else. */
function DeskDoodles() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Text style={[styles.deskStar, { top: '9%', left: '8%', fontSize: 13 }]}>★</Text>
      <Text style={[styles.deskStar, { top: '17%', right: '12%', fontSize: 9 }]}>★</Text>
      <Text style={[styles.deskStar, { bottom: '22%', left: '11%', fontSize: 10 }]}>✿</Text>
      <Text style={[styles.deskStar, { bottom: '11%', right: '9%', fontSize: 14 }]}>★</Text>
    </View>
  );
}

/**
 * The cream desk every post-opening scrapbook screen sits on.
 * Layout is left to each screen — this only supplies surface and insets.
 *
 * The bottom safe-area inset is applied as content padding rather than as a
 * SafeAreaView edge: KeyboardAvoidingView measures the keyboard from the
 * physical screen bottom, so an inset on the wrapper would be counted twice
 * and leave a gap above the keyboard.
 */
export function DeskScreen({ children, scroll = false, contentStyle }: DeskScreenProps) {
  const insets = useSafeAreaInsets();

  const padding = {
    paddingBottom: insets.bottom + (scroll ? 48 : 24),
  };

  const body = <View style={[styles.content, padding, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView style={styles.desk} edges={['top']}>
      <DeskDoodles />
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.fill}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  desk: {
    flex: 1,
    backgroundColor: scrapbookPalette.desk,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  deskStar: {
    position: 'absolute',
    color: scrapbookPalette.doodle,
    opacity: 0.24,
  },
});
