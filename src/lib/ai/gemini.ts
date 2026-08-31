import { formatContextForModel } from './rag-context';
import type { AIMessage, AIContextSnapshot, AIResponse, AIToolCall, AIToolName, AIToolSchema } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash-lite';
export const GEMINI_GENERATE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

type GeminiPart = {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  thought_signature?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: { name?: string; response?: Record<string, unknown> };
};

function partThoughtSignature(part: GeminiPart): string | undefined {
  if (typeof part.thoughtSignature === 'string' && part.thoughtSignature.length > 0) {
    return part.thoughtSignature;
  }
  if (typeof part.thought_signature === 'string' && part.thought_signature.length > 0) {
    return part.thought_signature;
  }
  return undefined;
}

type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

export type GeminiRequest = {
  system_instruction: { parts: Array<{ text: string }> };
  contents: GeminiContent[];
  tools?: Array<{ functionDeclarations: unknown[] }>;
  tool_config?: {
    function_calling_config: { mode: 'AUTO' | 'ANY' | 'NONE' };
  };
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
};

function geminiType(value: unknown): string {
  const raw = typeof value === 'string' ? value : 'string';
  return raw.toUpperCase();
}

function toGeminiSchema(parameters: Record<string, unknown>): Record<string, unknown> {
  const properties = (parameters.properties ?? {}) as Record<string, Record<string, unknown>>;
  const converted: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(properties)) {
    converted[key] = {
      type: geminiType(field.type ?? 'string'),
      description: typeof field.description === 'string' ? field.description : '',
      ...(Array.isArray(field.enum) ? { enum: field.enum } : {}),
    };
  }
  return {
    type: 'OBJECT',
    properties: converted,
    ...(Array.isArray(parameters.required) ? { required: parameters.required } : {}),
  };
}

export function toGeminiTools(tools: AIToolSchema[]) {
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: toGeminiSchema(tool.parameters),
      })),
    },
  ];
}

export function toGeminiContents(messages: AIMessage[]): GeminiContent[] {
  const contents: GeminiContent[] = [];

  for (const item of messages) {
    if (item.role === 'tool') {
      let response: Record<string, unknown> = { result: item.content };
      try {
        const parsed = JSON.parse(item.content) as unknown;
        response =
          parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : { result: parsed };
      } catch {
        response = { result: item.content };
      }
      const part: GeminiPart = {
        functionResponse: { name: item.name ?? 'tool', response },
      };
      const last = contents[contents.length - 1];
      if (last?.role === 'user' && last.parts.every((entry) => entry.functionResponse)) {
        last.parts.push(part);
      } else {
        contents.push({ role: 'user', parts: [part] });
      }
      continue;
    }

    if (item.role === 'assistant') {
      const parts: GeminiPart[] = [];
      if (item.content.trim()) parts.push({ text: item.content });
      for (const call of item.toolCalls ?? []) {
        const part: GeminiPart = { functionCall: { name: call.name, args: call.args ?? {} } };
        if (call.thoughtSignature) part.thoughtSignature = call.thoughtSignature;
        parts.push(part);
      }
      if (parts.length) contents.push({ role: 'model', parts });
      continue;
    }

    if (item.content.trim()) {
      contents.push({ role: 'user', parts: [{ text: item.content }] });
    }
  }

  return contents.length ? contents : [{ role: 'user', parts: [{ text: 'hey' }] }];
}

export function buildGeminiRequest(input: {
  system: string;
  context: AIContextSnapshot;
  messages: AIMessage[];
  tools: AIToolSchema[];
}): GeminiRequest {
  const contextNote = `\n\n${formatContextForModel(input.context)}`;
  return {
    system_instruction: { parts: [{ text: `${input.system}${contextNote}` }] },
    contents: toGeminiContents(input.messages),
    tools: input.tools.length ? toGeminiTools(input.tools) : undefined,
    tool_config: {
      function_calling_config: { mode: 'AUTO' },
    },
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 512,
    },
  };
}

export function parseGeminiResponse(data: unknown): AIResponse {
  if (!data || typeof data !== 'object') {
    return { message: '', toolCalls: [], unavailable: true };
  }
  const record = data as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: GeminiPart[] };
    }>;
  };
  if (record.promptFeedback?.blockReason) {
    return { message: '', toolCalls: [], unavailable: true };
  }
  const parts = record.candidates?.[0]?.content?.parts ?? [];
  let message = '';
  const toolCalls: AIToolCall[] = [];
  for (const part of parts) {
    if (part.thought) continue;
    if (typeof part.text === 'string' && part.text.trim()) {
      message += part.text;
    }
    const name = part.functionCall?.name;
    if (name) {
      toolCalls.push({
        name: name as AIToolName,
        args: part.functionCall?.args && typeof part.functionCall.args === 'object' ? part.functionCall.args : {},
        thoughtSignature: partThoughtSignature(part),
      });
    }
  }
  message = message.trim();
  if (!message && !toolCalls.length) {
    return { message: '', toolCalls: [], unavailable: true };
  }
  return { message, toolCalls, unavailable: false };
}
