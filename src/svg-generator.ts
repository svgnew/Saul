import terminalImage from 'terminal-image';
import type { GenerateSVGResult } from './types.js';
import type { LLMProvider, LLMMessage } from './llm-provider.js';
import { ClaudeProvider } from './providers/claude.js';
import { cleanSVGMarkup, sanitizeFilename } from './utils.js';
import { svgToPNG } from './file-handler.js';

/**
 * Get the LLM provider instance
 * Change this to use a different provider
 */
function getLLMProvider(): LLMProvider {
  return new ClaudeProvider();
}

/**
 * Format streaming progress message
 */
function formatProgress(startTime: number, tokenCount: number, label = 'Generating SVG'): string {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';
  return `${label}... ${dim}${elapsed}s · ${tokenCount} tokens${reset}`;
}

/**
 * Generate SVG from natural language description
 * @param description - Natural language description of the image
 * @param spinner - Optional spinner to update with progress
 * @returns SVG markup and suggested filename
 */
export async function generateSVG(description: string, spinner?: { message: (msg: string) => void; start: (msg: string) => void }): Promise<GenerateSVGResult> {
  const provider = getLLMProvider();

  if (spinner) {
    spinner.start('Generating SVG...');
  }

  const messages: LLMMessage[] = [
    {
      role: 'user',
      content: `Generate a complete, valid SVG image based on this description: "${description}".

Requirements:
1. Return ONLY the SVG markup, starting with <svg> and ending with </svg>
2. Include proper viewBox, width, and height attributes
3. Make the SVG visually appealing and accurate to the description
4. Use appropriate colors, shapes, and styling
5. Do not include any explanation or markdown code blocks, just the raw SVG

SVG:`,
    },
  ];

  let svgText = '';
  const startTime = Date.now();
  let outputTokens = 0;
  let inputTokens = 0;

  for await (const event of provider.streamCompletion(messages)) {
    if (event.type === 'text' && event.text) {
      svgText += event.text;
    } else if (event.type === 'usage') {
      inputTokens = event.inputTokens || 0;
      outputTokens = event.outputTokens || 0;
      if (spinner) {
        spinner.message(formatProgress(startTime, outputTokens));
      }
    }
  }

  const svg = cleanSVGMarkup(svgText);

  // Display SVG in terminal
  try {
    const pngBuffer = await svgToPNG(svg);
    const image = await terminalImage.buffer(pngBuffer, { width: 40, height: 20 });
    console.log('\n\x1b[2m[Low resolution preview]\x1b[0m');
    console.log(image);
  } catch (error) {
    // Silently fail if terminal doesn't support images
  }

  console.log(`\x1b[2m${outputTokens} tokens · ${provider.calculateCost(inputTokens, outputTokens)}\x1b[0m\n`);

  // Generate filename
  const filenameMessages: LLMMessage[] = [
    {
      role: 'user',
      content: `Given this image description: "${description}", provide a short, descriptive filename (2-4 words, lowercase, hyphens instead of spaces, no file extension). Just return the filename, nothing else.`,
    },
  ];

  let filenameText = '';
  let filenameInputTokens = 0;
  let filenameOutputTokens = 0;

  for await (const event of provider.streamCompletion(filenameMessages)) {
    if (event.type === 'text' && event.text) {
      filenameText += event.text;
    } else if (event.type === 'usage') {
      filenameInputTokens = event.inputTokens || 0;
      filenameOutputTokens = event.outputTokens || 0;
    }
  }

  console.log(` \x1b[2m${filenameOutputTokens} tokens · ${provider.calculateCost(filenameInputTokens, filenameOutputTokens)}\x1b[0m`);

  const filename = sanitizeFilename(filenameText);

  return { svg, filename };
}

/**
 * Modify existing SVG based on user instructions
 * @param currentSVG - Current SVG markup
 * @param pngBuffer - PNG representation of current SVG
 * @param modificationPrompt - User's modification instructions
 * @param spinner - Optional spinner to update with progress
 * @returns Modified SVG markup
 */
export async function modifySVG(
  currentSVG: string,
  pngBuffer: Buffer,
  modificationPrompt: string,
  spinner?: { message: (msg: string) => void; start: (msg: string) => void }
): Promise<string> {
  const provider = getLLMProvider();
  const base64Image = pngBuffer.toString('base64');

  const messages: LLMMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: base64Image,
          },
        },
        {
          type: 'text',
          text: `Here is the current SVG code for the image shown above:

${currentSVG}

Please modify it according to this instruction: "${modificationPrompt}"

Return ONLY the modified SVG markup, starting with <svg> and ending with </svg>. Do not include any explanation or markdown code blocks.

Modified SVG:`,
        },
      ],
    },
  ];

  let svgText = '';
  const startTime = Date.now();
  let outputTokens = 0;
  let inputTokens = 0;

  for await (const event of provider.streamCompletion(messages)) {
    if (event.type === 'text' && event.text) {
      svgText += event.text;
    } else if (event.type === 'usage') {
      inputTokens = event.inputTokens || 0;
      outputTokens = event.outputTokens || 0;
      if (spinner) {
        spinner.message(formatProgress(startTime, outputTokens, 'Modifying SVG'));
      }
    }
  }

  const modifiedSvg = cleanSVGMarkup(svgText);

  // Display modified SVG in terminal
  try {
    const pngBuffer = await svgToPNG(modifiedSvg);
    const image = await terminalImage.buffer(pngBuffer, { width: 40, height: 20 });
    console.log('\n\x1b[2m[Low resolution preview]\x1b[0m');
    console.log(image);
  } catch (error) {
    // Silently fail if terminal doesn't support images
  }

  console.log(`\x1b[2m${outputTokens} tokens · ${provider.calculateCost(inputTokens, outputTokens)}\x1b[0m\n`);

  return modifiedSvg;
}

/**
 * Automatically improve SVG quality and aesthetics
 * @param currentSVG - Current SVG markup
 * @param pngBuffer - PNG representation of current SVG
 * @param spinner - Optional spinner to update with progress
 * @returns Improved SVG markup
 */
export async function autoImproveSVG(
  currentSVG: string,
  pngBuffer: Buffer,
  spinner?: { message: (msg: string) => void; start: (msg: string) => void }
): Promise<string> {
  const provider = getLLMProvider();
  const base64Image = pngBuffer.toString('base64');

  const messages: LLMMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: base64Image,
          },
        },
        {
          type: 'text',
          text: `Here is the current SVG code for the image shown above:

${currentSVG}

Please analyze this SVG and automatically improve it. Consider:
- Visual appeal and aesthetics
- Color harmony and contrast
- Proper proportions and spacing
- Clean and efficient SVG code
- Overall quality and polish

Return ONLY the improved SVG markup, starting with <svg> and ending with </svg>. Do not include any explanation or markdown code blocks.

Improved SVG:`,
        },
      ],
    },
  ];

  let svgText = '';
  const startTime = Date.now();
  let outputTokens = 0;
  let inputTokens = 0;

  for await (const event of provider.streamCompletion(messages)) {
    if (event.type === 'text' && event.text) {
      svgText += event.text;
    } else if (event.type === 'usage') {
      inputTokens = event.inputTokens || 0;
      outputTokens = event.outputTokens || 0;
      if (spinner) {
        spinner.message(formatProgress(startTime, outputTokens, 'Auto-improving SVG'));
      }
    }
  }

  const improvedSvg = cleanSVGMarkup(svgText);

  // Display improved SVG in terminal
  try {
    const pngBuffer = await svgToPNG(improvedSvg);
    const image = await terminalImage.buffer(pngBuffer, { width: 40, height: 20 });
    console.log('\n\x1b[2m[Low resolution preview]\x1b[0m');
    console.log(image);
  } catch (error) {
    // Silently fail if terminal doesn't support images
  }

  console.log(`\x1b[2m${outputTokens} tokens · ${provider.calculateCost(inputTokens, outputTokens)}\x1b[0m\n`);

  return improvedSvg;
}
