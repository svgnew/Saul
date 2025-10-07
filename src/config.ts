import type { AppConfig } from './types.js';

/**
 * Claude AI model configuration
 */
export const MODEL = 'claude-sonnet-4-5-20250929';

/**
 * Maximum tokens for API requests 
 */
export const MAX_TOKENS = 64 * 1000;

/**
 * Maximum tokens for filename generation
 */
export const FILENAME_MAX_TOKENS = 100;

/**
 * Get application configuration
 */
export function getConfig(): AppConfig {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  return {
    apiKey,
    model: MODEL,
    maxTokens: MAX_TOKENS,
  };
}
