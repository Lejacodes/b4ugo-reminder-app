import { AI_GENTLE_HERE_MESSAGE, AI_UNAVAILABLE_MESSAGE } from './ai-prompts';
import type { AIProvider } from './ai-provider';
import { interpretLocally, formatToolResult } from './fallback-provider';
import { protectNecessitiesFromPacking, validateToolCall } from './ai-tools';
import { AI_TOOL_SCHEMAS } from './tool-schemas';
import type { AIContextSnapshot, AIMessage, AIResponse, AIToolCall, AIToolName } from './types';

export type ToolExecutor = (call: AIToolCall) => Promise<unknown>;

export type ChatTurnResult = {
  messages: AIMessage[];
  assistantMessage: string;
  unavailable: boolean;
};

function toolId(call: AIToolCall, index: number): string {
  return call.id?.trim() || `call_${index + 1}`;
}

export function composeReplyFromTools(
  first: AIResponse,
  results: Array<{ name: AIToolName; payload: unknown }>,
): string {
  const extras = results
    .map((item) => {
      if (item.payload && typeof item.payload === 'object' && 'error' in item.payload) {
        return String((item.payload as { error: unknown }).error);
      }
      return formatToolResult(item.name, item.payload);
    })
    .filter(Boolean);
  return [first.message, ...extras].filter(Boolean).join('\n') || AI_GENTLE_HERE_MESSAGE;
}

export async function runValidatedTool(
  call: AIToolCall,
  execute: ToolExecutor,
): Promise<unknown> {
  const protectedCall = protectNecessitiesFromPacking(call);
  const validated = protectedCall ?? validateToolCall(call);
  if (!validated.ok) {
    return { error: validated.message, reason: validated.reason };
  }
  return execute({ name: validated.name, args: validated.args, id: call.id });
}

/**
 * One user turn: provider → optional tools → validate/execute → provider again.
 * Tools never touch Supabase themselves; `execute` uses existing stores.
 */
export async function runChatTurn(input: {
  provider: AIProvider;
  history: AIMessage[];
  userText: string;
  context: AIContextSnapshot;
  execute: ToolExecutor;
  maxRounds?: number;
}): Promise<ChatTurnResult> {
  const userMessage: AIMessage = { role: 'user', content: input.userText.trim() };
  let messages: AIMessage[] = [...input.history, userMessage];
  const maxRounds = input.maxRounds ?? 4;

  let first: AIResponse | null = null;
  let lastResults: Array<{ name: AIToolName; payload: unknown }> = [];

  for (let round = 0; round <= maxRounds; round += 1) {
    const reply = await input.provider.complete({
      messages,
      context: input.context,
      tools: AI_TOOL_SCHEMAS,
    });

    if (reply.unavailable) {
      return {
        messages: [...messages, { role: 'assistant', content: AI_UNAVAILABLE_MESSAGE }],
        assistantMessage: AI_UNAVAILABLE_MESSAGE,
        unavailable: true,
      };
    }

    if (!first) first = reply;

    if (!reply.toolCalls.length) {
      if (round === 0) {
        const local = interpretLocally(input.userText.trim(), input.context);
        if (local.toolCalls.length) {
          const results: Array<{ name: AIToolName; payload: unknown }> = [];
          for (const call of local.toolCalls) {
            const payload = await runValidatedTool(call, input.execute);
            results.push({ name: call.name, payload });
          }
          const assistantMessage = composeReplyFromTools(local, results);
          return {
            messages: [...messages, { role: 'assistant', content: assistantMessage }],
            assistantMessage,
            unavailable: false,
          };
        }
      }
      const content = reply.message.trim() || first.message.trim() || AI_GENTLE_HERE_MESSAGE;
      return {
        messages: [...messages, { role: 'assistant', content }],
        assistantMessage: content,
        unavailable: false,
      };
    }

    const assistantWithTools: AIMessage = {
      role: 'assistant',
      content: reply.message,
      toolCalls: reply.toolCalls,
    };
    messages = [...messages, assistantWithTools];

    const results: Array<{ name: AIToolName; payload: unknown }> = [];
    for (const [index, call] of reply.toolCalls.entries()) {
      const payload = await runValidatedTool(call, input.execute);
      results.push({ name: call.name, payload });
      lastResults = results;
      messages = [
        ...messages,
        {
          role: 'tool',
          name: call.name,
          toolCallId: toolId(call, index),
          content: JSON.stringify(payload ?? null),
        },
      ];
    }
  }

  const fallback = first ? composeReplyFromTools(first, lastResults) : AI_GENTLE_HERE_MESSAGE;
  return {
    messages: [...messages, { role: 'assistant', content: fallback }],
    assistantMessage: fallback,
    unavailable: false,
  };
}
