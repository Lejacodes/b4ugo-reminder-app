import { StyleSheet, Text, View } from 'react-native';

import { readableFont, readableType } from '@/constants/scrapbook';
import type { ScrapbookPalette } from '@/constants/scrapbook';

type ChatBubbleProps = {
  role: 'user' | 'assistant';
  content: string;
  colors: ScrapbookPalette;
};

export function ChatBubble({ role, content, colors }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
          isUser
            ? { backgroundColor: colors.butter, borderColor: colors.butterDeep }
            : { backgroundColor: colors.paper, borderColor: colors.line },
        ]}>
        <Text
          style={[
            styles.chatText,
            readableFont,
            { color: colors.ink, fontFamily: readableFont.fontFamily },
          ]}>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 8,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleUser: {
    borderBottomRightRadius: 6,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: 6,
  },
  chatText: {
    ...readableFont,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  },
});
