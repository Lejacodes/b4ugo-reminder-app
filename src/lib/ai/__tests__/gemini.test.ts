import { buildGeminiRequest, parseGeminiResponse } from '@/lib/ai/gemini';
import { AI_TOOL_SCHEMAS } from '@/lib/ai/tool-schemas';
import type { AIContextSnapshot } from '@/lib/ai/types';

const context: AIContextSnapshot = {
  today: '2026-08-22',
  reminders: [],
  necessities: [],
  trips: [],
  places: [],
  intentions: [],
  weather: null,
  activeDestination: null,
};

describe('Gemini protocol', () => {
  it('sends system prompt, history, snapshot, and tool declarations', () => {
    const request = buildGeminiRequest({
      system: 'you are little guy',
      context,
      messages: [
        { role: 'user', content: 'remind me tomorrow' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [{ name: 'createReminder', args: { title: 'sunscreen', dueAt: '2026-08-23' } }],
        },
        { role: 'tool', name: 'createReminder', toolCallId: 'call_1', content: '{"saved":true}' },
      ],
      tools: AI_TOOL_SCHEMAS,
    });

    expect(request.system_instruction.parts[0].text).toContain('you are little guy');
    expect(request.system_instruction.parts[0].text).toContain('2026-08-22');
    expect(request.contents[0]).toEqual({ role: 'user', parts: [{ text: 'remind me tomorrow' }] });
    expect(request.contents[1].role).toBe('model');
    expect(request.contents[1].parts[0].functionCall?.name).toBe('createReminder');
    expect(request.contents[2].parts[0].functionResponse).toEqual({
      name: 'createReminder',
      response: { saved: true },
    });
    expect(request.tools?.[0].functionDeclarations.some((item) => (item as { name: string }).name === 'createReminder')).toBe(
      true,
    );
  });

  it('reads Gemini text and function calls, ignoring thought parts', () => {
    const reply = parseGeminiResponse({
      candidates: [
        {
          content: {
            parts: [
              { thought: true, text: 'planning' },
              { text: 'sure, i will keep that.' },
              { functionCall: { name: 'createReminder', args: { title: 'sunscreen' } } },
            ],
          },
        },
      ],
    });
    expect(reply.unavailable).toBe(false);
    expect(reply.message).toBe('sure, i will keep that.');
    expect(reply.toolCalls).toEqual([{ name: 'createReminder', args: { title: 'sunscreen' } }]);
  });

  it('marks blocked or empty Gemini payloads as unavailable', () => {
    expect(parseGeminiResponse({ promptFeedback: { blockReason: 'SAFETY' } }).unavailable).toBe(true);
    expect(parseGeminiResponse({ candidates: [{ content: { parts: [] } }] }).unavailable).toBe(true);
  });
});
