import type { AIMessage } from './types';

/** Session chat history. Not a second memory database. */
export class ChatSession {
  private messages: AIMessage[] = [];

  all(): AIMessage[] {
    return [...this.messages];
  }

  visible(): AIMessage[] {
    return this.messages.filter(
      (item) =>
        (item.role === 'user' || item.role === 'assistant') &&
        item.content.trim().length > 0,
    );
  }

  replace(messages: AIMessage[]): void {
    this.messages = [...messages];
  }

  clear(): void {
    this.messages = [];
  }
}

export function isVisibleChatMessage(item: AIMessage): boolean {
  return (
    (item.role === 'user' || item.role === 'assistant') && item.content.trim().length > 0
  );
}
