import { isSupabaseConfigured } from '@/lib/supabase/client';

import type { AIProvider } from './ai-provider';
import { FallbackAIProvider } from './fallback-provider';
import { parseRemoteTarget, RemoteLLMProvider, type RemoteTarget } from './remote-provider';
import { ResilientAIProvider } from './resilient-provider';

export function resolveRemoteTarget(
  url = process.env.EXPO_PUBLIC_AI_API_URL ?? '',
  supabaseReady = isSupabaseConfigured(),
): RemoteTarget | null {
  const explicit = parseRemoteTarget(url);
  if (explicit) return explicit;
  if (supabaseReady) return { kind: 'supabase-function', name: 'little-guy' };
  return null;
}

export function isRemoteAIConfigured(): boolean {
  return resolveRemoteTarget() != null;
}

export function createAIClient(): AIProvider {
  const fallback = new FallbackAIProvider();
  const target = resolveRemoteTarget();
  if (!target) return fallback;
  return new ResilientAIProvider(new RemoteLLMProvider(target), fallback);
}

export const aiClient: AIProvider = createAIClient();
