import type { AIProvider } from './ai-provider';
import type { AIRequest, AIResponse } from './types';

/**
 * Prefer the real model. If the backend cannot be reached, use the local fallback
 * so the app never crashes.
 */
export class ResilientAIProvider implements AIProvider {
  constructor(
    private readonly primary: AIProvider,
    private readonly fallback: AIProvider,
  ) {}

  async complete(request: AIRequest): Promise<AIResponse> {
    try {
      const reply = await this.primary.complete(request);
      if (!reply.unavailable) return reply;
    } catch {
      // fall through
    }
    return this.fallback.complete(request);
  }
}
