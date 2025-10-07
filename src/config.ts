import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as clack from '@clack/prompts';
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
 * Get path to global config file
 */
function getConfigPath(): string {
  const homeDir = os.homedir();
  const configDir = path.join(homeDir, '.config', 'svg-saul');
  return path.join(configDir, 'config.json');
}

/**
 * Load API key from global config
 */
function loadApiKeyFromConfig(): string | null {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.apiKey || null;
    }
  } catch (error) {
    // Silently fail if config doesn't exist or is invalid
  }
  return null;
}

/**
 * Save API key to global config
 */
function saveApiKeyToConfig(apiKey: string): void {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);

  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Save config
  fs.writeFileSync(configPath, JSON.stringify({ apiKey }, null, 2), 'utf-8');
}

/**
 * Prompt user for API key
 */
async function promptForApiKey(): Promise<string> {
  const apiKey = await clack.password({
    message: 'Enter your Anthropic API key:',
    validate: (value) => {
      if (!value || value.length === 0) {
        return 'API key is required';
      }
      if (!value.startsWith('sk-ant-')) {
        return 'Invalid API key format (should start with sk-ant-)';
      }
    },
  });

  if (clack.isCancel(apiKey)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  return apiKey as string;
}

/**
 * Get application configuration
 */
export async function getConfig(): Promise<AppConfig> {
  // Try environment variable first
  let apiKey = process.env.ANTHROPIC_API_KEY;

  // Try loading from config file
  if (!apiKey) {
    apiKey = loadApiKeyFromConfig() || undefined;
  }

  // Prompt user if still not found
  if (!apiKey) {
    clack.log.warn('No API key found.');
    clack.log.info('You can either:');
    clack.log.info('  1. Set ANTHROPIC_API_KEY environment variable');
    clack.log.info('  2. Enter it below (will be saved to ~/.config/svg-saul/config.json)');
    clack.log.info('  Get your API key from: https://console.anthropic.com/settings/keys');
    apiKey = await promptForApiKey();

    // Save to config for future use
    saveApiKeyToConfig(apiKey);
    clack.log.success('API key saved to ~/.config/svg-saul/config.json');
  }

  return {
    apiKey,
    model: MODEL,
    maxTokens: MAX_TOKENS,
  };
}
