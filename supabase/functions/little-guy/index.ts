/**
 * Little Guy → Gemini 2.5 Flash-Lite.
 *
 * Secret (Supabase dashboard → Edge Functions → Secrets, or `supabase secrets set`):
 *   GEMINI_API_KEY=...
 *
 * Optional:
 *   GEMINI_MODEL=gemini-2.5-flash-lite
 *
 * The Expo client never sees this key. This function does not read or write
 * user tables. Approved tools run on the device through the existing stores.
 */

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

type IncomingMessage = {
  role?: string;
  content?: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: Array<{
    id?: string;
    name?: string;
    args?: Record<string, unknown>;
    thoughtSignature?: string;
  }>;
};

type IncomingTool = {
  name?: string;
  description?: string;
  parameters?: Record<string, unknown>;
};

type IncomingBody = {
  system?: string;
  messages?: IncomingMessage[];
  context?: unknown;
  rag?: string;
  tools?: IncomingTool[];
};

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

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function geminiType(value: unknown): string {
  return (typeof value === 'string' ? value : 'string').toUpperCase();
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

function toGeminiContents(messages: IncomingMessage[]) {
  const contents: Array<{ role: 'user' | 'model'; parts: GeminiPart[] }> = [];

  for (const item of messages) {
    if (item.role === 'tool') {
      let response: Record<string, unknown> = { result: item.content ?? '' };
      try {
        const parsed = JSON.parse(item.content ?? '') as unknown;
        response =
          parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : { result: parsed };
      } catch {
        response = { result: item.content ?? '' };
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
      if (item.content?.trim()) parts.push({ text: item.content });
      for (const call of item.toolCalls ?? []) {
        if (!call.name) continue;
        const part: GeminiPart = { functionCall: { name: call.name, args: call.args ?? {} } };
        if (call.thoughtSignature) part.thoughtSignature = call.thoughtSignature;
        parts.push(part);
      }
      if (parts.length) contents.push({ role: 'model', parts });
      continue;
    }

    if (item.content?.trim()) {
      contents.push({ role: 'user', parts: [{ text: item.content }] });
    }
  }

  return contents.length ? contents : [{ role: 'user', parts: [{ text: 'hey' }] }];
}

function parseGemini(data: {
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
}) {
  if (data.promptFeedback?.blockReason) {
    return { message: '', toolCalls: [] as Array<{ name: string; args: Record<string, unknown> }> };
  }
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  let message = '';
  const toolCalls: Array<{
    name: string;
    args: Record<string, unknown>;
    thoughtSignature?: string;
  }> = [];
  for (const part of parts) {
    if (part.thought) continue;
    if (typeof part.text === 'string' && part.text.trim()) message += part.text;
    if (part.functionCall?.name) {
      toolCalls.push({
        name: part.functionCall.name,
        args:
          part.functionCall.args && typeof part.functionCall.args === 'object'
            ? part.functionCall.args
            : {},
        thoughtSignature: partThoughtSignature(part),
      });
    }
  }
  return { message: message.trim(), toolCalls };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (request.method !== 'POST') {
    return json(405, { message: 'method not allowed', toolCalls: [] });
  }

  const auth = request.headers.get('Authorization');
  if (!auth) {
    return json(401, { message: 'sign in first', toolCalls: [] });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
  const model = Deno.env.get('GEMINI_MODEL')?.trim() || DEFAULT_MODEL;
  if (!apiKey) {
    return json(503, {
      message: "hmm, i can't reach my little brain right now ♡",
      toolCalls: [],
    });
  }

  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
  } catch {
    return json(400, { message: 'bad request', toolCalls: [] });
  }

  const contextNote =
    typeof body.rag === 'string' && body.rag.trim()
      ? `\n\n${body.rag.trim()}`
      : body.context == null
        ? ''
        : `\n\nCurrent B4UGO snapshot. Do not invent beyond this:\n${JSON.stringify(body.context)}`;

  const payload = {
    system_instruction: {
      parts: [{ text: `${body.system ?? ''}${contextNote}` }],
    },
    contents: toGeminiContents(body.messages ?? []),
    tools: (body.tools ?? []).length
      ? [
          {
            functionDeclarations: (body.tools ?? [])
              .filter((tool) => typeof tool.name === 'string' && tool.name.length > 0)
              .map((tool) => ({
                name: tool.name,
                description: tool.description ?? '',
                parameters: toGeminiSchema(tool.parameters ?? { type: 'object', properties: {} }),
              })),
          },
        ]
      : undefined,
    tool_config: {
      function_calling_config: { mode: 'AUTO' },
    },
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 512,
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      console.error('Gemini error', response.status, detail.slice(0, 400));
      return json(503, {
        message: "hmm, i can't reach my little brain right now ♡",
        toolCalls: [],
      });
    }
    const parsed = parseGemini((await response.json()) as never);
    if (!parsed.message && !parsed.toolCalls.length) {
      return json(503, {
        message: "hmm, i can't reach my little brain right now ♡",
        toolCalls: [],
      });
    }
    return json(200, parsed);
  } catch {
    return json(503, {
      message: "hmm, i can't reach my little brain right now ♡",
      toolCalls: [],
    });
  }
});
