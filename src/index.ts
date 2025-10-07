#!/usr/bin/env node

import 'dotenv/config';
import * as clack from '@clack/prompts';
import { stdin, stdout } from 'process';
import { generateSVG } from './svg-generator.js';
import { saveFiles } from './file-handler.js';
import { showMenu } from './menu.js';

const isTTY = stdin.isTTY;

/**
 * Get image description from user input or stdin
 * @returns Image description string
 */
async function getInputDescription(): Promise<string> {
  if (isTTY) {
    // Interactive mode - prompt user
    const description = await clack.text({
      message: 'Describe the image you want to create:',
      placeholder: 'e.g., a red house with a blue roof',
      validate: (value) => {
        if (!value) return 'Please provide a description';
      },
    });

    if (clack.isCancel(description)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    return description as string;
  } else {
    // Piped mode - read from stdin
    return new Promise((resolve, reject) => {
      let data = '';
      stdin.setEncoding('utf-8');

      stdin.on('data', (chunk) => {
        data += chunk;
      });

      stdin.on('end', () => {
        resolve(data.trim());
      });

      stdin.on('error', reject);
    });
  }
}

/**
 * Main application entry point
 */
export async function main(): Promise<void> {
  clack.intro('Saul - SVG Generator Agent');

  const description = await getInputDescription();

  if (!description) {
    clack.log.error('No description provided');
    process.exit(1);
  }

  const s = clack.spinner();
  s.start('Generating SVG...');

  try {
    const { svg, filename } = await generateSVG(description, s);

    s.message('Saving file...');
    const { svgPath, filenameWithTimestamp } = await saveFiles(svg, filename);

    s.stop(`Generated and saved: ${svgPath}`);

    if (isTTY) {
      // Interactive mode - show menu
      await showMenu(svgPath, svg, filenameWithTimestamp);
    } else {
      // Piped mode - output paths and exit
      stdout.write(`${svgPath}\n`);
    }
  } catch (error) {
    s.stop('Failed to generate SVG');
    clack.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the application
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
