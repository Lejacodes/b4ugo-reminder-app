/**
 * Local Little Guy → Gemini proxy for development.
 * Reads GEMINI_API_KEY from .env so you don't need Supabase for AI during dev.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const PORT = Number(process.env.LITTLE_GUY_PORT ?? 8787);
const HOST = process.env.LITTLE_GUY_HOST ?? '127.0.0.1';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = { ...loadEnv(ENV_PATH), ...process.env };
const apiKey = env.GEMINI_API_KEY?.trim();
const model = env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';

function geminiType(value) {
  return (typeof value === 'string' ? value : 'string').toUpperCase();
}

function toGeminiSchema(parameters = {}) {
  const properties = parameters.properties ?? {};
  const converted = {};
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

function partThoughtSignature(part) {
  if (typeof part.thoughtSignature === 'string' && part.thoughtSignature.length > 0) {
    return part.thoughtSignature;
  }
  if (typeof part.thought_signature === 'string' && part.thought_signature.length > 0) {
    return part.thought_signature;
  }
  return undefined;
}

function toGeminiContents(messages = []) {
  const contents = [];
  for (const item of messages) {
    if (item.role === 'tool') {
      let response = { result: item.content ?? '' };
      try {
        const parsed = JSON.parse(item.content ?? '');
        response =
          parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed
            : { result: parsed };
      } catch {
        response = { result: item.content ?? '' };
      }
      const part = { functionResponse: { name: item.name ?? 'tool', response } };
      const last = contents[contents.length - 1];
      if (last?.role === 'user' && last.parts.every((entry) => entry.functionResponse)) {
        last.parts.push(part);
      } else {
        contents.push({ role: 'user', parts: [part] });
      }
      continue;
    }
    if (item.role === 'assistant') {
      const parts = [];
      if (item.content?.trim()) parts.push({ text: item.content });
      for (const call of item.toolCalls ?? []) {
        if (!call.name) continue;
        const part = { functionCall: { name: call.name, args: call.args ?? {} } };
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

function parseGemini(data) {
  if (data.promptFeedback?.blockReason) return { message: '', toolCalls: [] };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  let message = '';
  const toolCalls = [];
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

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
  });
  res.end(JSON.stringify(body));
}

async function handlePost(req, res) {
  if (!apiKey) {
    return json(res, 503, {
      message: "hmm, i can't reach my little brain right now ♡",
      toolCalls: [],
    });
  }

  let body = '';
  for await (const chunk of req) body += chunk;
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return json(res, 400, { message: 'bad request', toolCalls: [] });
  }

  const contextNote =
    typeof parsed.rag === 'string' && parsed.rag.trim()
      ? `\n\n${parsed.rag.trim()}`
      : parsed.context == null
        ? ''
        : `\n\nCurrent BLUGO snapshot. Do not invent beyond this:\n${JSON.stringify(parsed.context)}`;

  const payload = {
    system_instruction: {
      parts: [{ text: `${parsed.system ?? ''}${contextNote}` }],
    },
    contents: toGeminiContents(parsed.messages ?? []),
    tools: (parsed.tools ?? []).length
      ? [
          {
            functionDeclarations: (parsed.tools ?? [])
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
      console.error('Gemini error', response.status, detail.slice(0, 300));
      return json(res, 503, {
        message: "hmm, i can't reach my little brain right now ♡",
        toolCalls: [],
      });
    }
    const result = parseGemini(await response.json());
    if (!result.message && !result.toolCalls.length) {
      return json(res, 503, {
        message: "hmm, i can't reach my little brain right now ♡",
        toolCalls: [],
      });
    }
    return json(res, 200, result);
  } catch (error) {
    console.error('Gemini fetch failed', error);
    return json(res, 503, {
      message: "hmm, i can't reach my little brain right now ♡",
      toolCalls: [],
    });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    });
    res.end();
    return;
  }
  if (req.method === 'POST') {
    void handlePost(req, res);
    return;
  }
  json(res, 405, { message: 'method not allowed', toolCalls: [] });
});

server.listen(PORT, HOST, () => {
  if (!apiKey) {
    console.warn(`Little Guy dev server on http://${HOST}:${PORT} — missing GEMINI_API_KEY in .env`);
    return;
  }
  console.log(`Little Guy dev server on http://${HOST}:${PORT} (Gemini ${model})`);
});
