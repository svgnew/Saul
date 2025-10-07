import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMMessage, StreamEvent } from '../llm-provider.js';
import { getConfig } from '../config.js';

/**
 * Claude (Anthropic) LLM Provider implementation
 */
export class ClaudeProvider implements LLMProvider {
  private client: Anthropic | null = null;
  private model: string = '';
  private maxTokens: number = 0;

  private async ensureInitialized(): Promise<void> {
    if (!this.client) {
      const config = await getConfig();
      this.client = new Anthropic({ apiKey: config.apiKey });
      this.model = config.model;
      this.maxTokens = config.maxTokens;
    }
  }

  async *streamCompletion(messages: LLMMessage[]): AsyncIterable<StreamEvent> {
    await this.ensureInitialized();

    // Convert our generic message format to Claude's format
    const anthropicMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const stream = await this.client!.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      stream: true,
      messages: anthropicMessages as any,
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          type: 'text',
          text: event.delta.text,
        };
      } else if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens;
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens;
        yield {
          type: 'usage',
          inputTokens,
          outputTokens,
        };
      }
    }

    // Yield final usage
    yield {
      type: 'usage',
      inputTokens,
      outputTokens,
    };
  }

  calculateCost(inputTokens: number, outputTokens: number): string {
    // Claude Sonnet 4.5 pricing: $3/M input, $15/M output
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;
    const total = inputCost + outputCost;
    return `$${total.toFixed(4)}`;
  }
}
