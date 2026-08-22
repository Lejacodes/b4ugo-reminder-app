import type { AIRequest, AIResponse } from './types';

export interface AIProvider {
  complete(request: AIRequest): Promise<AIResponse>;
}
