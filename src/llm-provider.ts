/**
 * LLM Provider abstraction layer
 * This allows easy switching between different LLM providers
 */

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}

export interface StreamEvent {
  type: 'text' | 'usage';
  text?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface LLMProvider {
  /**
   * Stream a completion from the LLM
   */
  streamCompletion(messages: LLMMessage[]): AsyncIterable<StreamEvent>;

  /**
   * Calculate cost for the given token usage
   */
  calculateCost(inputTokens: number, outputTokens: number): string;
}
