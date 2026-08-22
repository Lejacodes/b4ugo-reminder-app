import { getSupabase } from '@/lib/supabase/client';

import { AI_UNAVAILABLE_MESSAGE, LITTLE_GUY_SYSTEM_PROMPT } from './ai-prompts';
import type { AIProvider } from './ai-provider';
import { AI_TOOL_SCHEMAS } from './tool-schemas';
import type { AIRequest, AIResponse, AIToolCall, AIToolName } from './types';

const TOOL_NAMES = new Set(AI_TOOL_SCHEMAS.map((item) => item.name));

export type RemoteTarget =
  | { kind: 'http'; url: string }
  | { kind: 'supabase-function'; name: string };

export function parseRemoteTarget(value: string): RemoteTarget | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === 'supabase' || trimmed === 'function:little-guy' || trimmed === 'little-guy') {
    return { kind: 'supabase-function', name: 'little-guy' };
  }
  if (/^https?:\/\//i.test(trimmed)) return { kind: 'http', url: trimmed };
  return null;
}

function asToolCalls(value: unknown): AIToolCall[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    const name = typeof record.name === 'string' ? record.name : '';
    if (!TOOL_NAMES.has(name as AIToolName)) return [];
    const args =
      record.args && typeof record.args === 'object'
        ? (record.args as Record<string, unknown>)
        : record.arguments && typeof record.arguments === 'object'
          ? (record.arguments as Record<string, unknown>)
          : {};
    return [
      {
        id: typeof record.id === 'string' ? record.id : undefined,
        name: name as AIToolName,
        args,
      },
    ];
  });
}

export function parseRemotePayload(data: unknown): AIResponse {
  if (!data || typeof data !== 'object') {
    return { message: AI_UNAVAILABLE_MESSAGE, toolCalls: [], unavailable: true };
  }
  const record = data as Record<string, unknown>;
  const message = typeof record.message === 'string' ? record.message.trim() : '';
  const toolCalls = asToolCalls(record.toolCalls ?? record.tool_calls);
  if (!message && !toolCalls.length) {
    return { message: AI_UNAVAILABLE_MESSAGE, toolCalls: [], unavailable: true };
  }
  return { message, toolCalls, unavailable: false };
}

async function postHttp(url: string, request: AIRequest): Promise<AIResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: LITTLE_GUY_SYSTEM_PROMPT,
        messages: request.messages,
        context: request.context,
        tools: request.tools ?? AI_TOOL_SCHEMAS,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return { message: AI_UNAVAILABLE_MESSAGE, toolCalls: [], unavailable: true };
    }
    return parseRemotePayload(await response.json());
  } catch {
    return { message: AI_UNAVAILABLE_MESSAGE, toolCalls: [], unavailable: true };
  } finally {
    clearTimeout(timer);
  }
}

async function invokeFunction(name: string, request: AIRequest): Promise<AIResponse> {
  const supabase = getSupabase();
  if (!supabase) {
    return { message: AI_UNAVAILABLE_MESSAGE, toolCalls: [], unavailable: true };
  }
  const { data, error } = await supabase.functions.invoke(name, {
    body: {
      system: LITTLE_GUY_SYSTEM_PROMPT,
      messages: request.messages,
      context: request.context,
      tools: request.tools ?? AI_TOOL_SCHEMAS,
    },
  });
  if (error) {
    return { message: AI_UNAVAILABLE_MESSAGE, toolCalls: [], unavailable: true };
  }
  return parseRemotePayload(data);
}

/**
 * Talks to a backend that holds the model key.
 * The Expo client never sends or stores an LLM secret.
 */
export class RemoteLLMProvider implements AIProvider {
  constructor(private readonly target: RemoteTarget) {}

  async complete(request: AIRequest): Promise<AIResponse> {
    if (this.target.kind === 'supabase-function') {
      return invokeFunction(this.target.name, request);
    }
    return postHttp(this.target.url, request);
  }
}
