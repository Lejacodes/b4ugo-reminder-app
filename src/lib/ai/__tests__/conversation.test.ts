import { chatReply, isCasualTalk, looksLikeAction } from '@/lib/ai/conversation';
import type { AIContextSnapshot } from '@/lib/ai/types';

const empty: AIContextSnapshot = {
  today: '2026-08-22',
  reminders: [],
  necessities: [],
  trips: [],
  places: [],
  intentions: [],
  weather: null,
  activeDestination: null,
};

describe('conversation classification', () => {
  it('treats greetings and feelings as talk, not actions', () => {
    expect(isCasualTalk('hiiii')).toBe(true);
    expect(isCasualTalk('how are you?')).toBe(true);
    expect(isCasualTalk("i'm tired")).toBe(true);
    expect(looksLikeAction('remind me to buy sunscreen tomorrow')).toBe(true);
    expect(isCasualTalk('remind me to buy sunscreen tomorrow')).toBe(false);
  });

  it('answers like little guy and never emits tools', () => {
    expect(chatReply('hiii', empty)?.message).toBe('hiii ♡');
    expect(chatReply('what are you doing?', empty)?.message).toMatch(/little plans/i);
    expect(chatReply('thank you', empty)?.toolCalls).toEqual([]);
    expect(chatReply('remind me to buy milk', empty)).toBeNull();
    expect(chatReply('hi little guy', empty)?.message).toBe('hiiii ♡');
    expect(chatReply('ugh i have so much to do', empty)?.message).toMatch(/a lot/i);
    expect(chatReply('ugh i have so much to do', empty)?.toolCalls).toEqual([]);
  });

  it('mentions the constellation only when there is something to keep', () => {
    const busy = chatReply('how are you?', {
      ...empty,
      reminders: [
        { id: 'r1', title: 'sunscreen', category: 'specific', status: 'open', place: null, dueAt: null },
      ],
    });
    expect(busy?.message).toMatch(/constellation/i);
  });
});
