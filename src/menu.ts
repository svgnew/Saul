import * as clack from '@clack/prompts';
import open from 'open';
import type { MenuAction } from './types.js';
import { generateSVG, modifySVG, autoImproveSVG } from './svg-generator.js';
import { saveFiles, svgToPNG } from './file-handler.js';
import { removeTimestampPrefix } from './utils.js';

/**
 * Display interactive menu and handle user selection
 * @param svgPath - Path to current SVG file
 * @param currentSVG - Current SVG markup
 * @param filename - Current filename with timestamp
 */
export async function showMenu(
  svgPath: string,
  currentSVG: string,
  filename: string
): Promise<void> {
  const action = await clack.select({
    message: 'What would you like to do?',
    options: [
      { value: 'view', label: 'View SVG - Open in browser' },
      { value: 'modify', label: 'Modify SVG - Adjust the image' },
      { value: 'auto', label: 'Auto adjust - Let AI improve the image' },
      { value: 'new', label: 'Create new - Generate a new image' },
      { value: 'exit', label: 'Exit' },
    ],
  });

  if (clack.isCancel(action)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  await handleMenuAction(action as MenuAction, svgPath, currentSVG, filename);
}

/**
 * Handle the selected menu action
 */
async function handleMenuAction(
  action: MenuAction,
  svgPath: string,
  currentSVG: string,
  filename: string
): Promise<void> {
  switch (action) {
    case 'view':
      await handleViewAction(svgPath, currentSVG, filename);
      break;
    case 'modify':
      await handleModifyAction(svgPath, currentSVG, filename);
      break;
    case 'auto':
      await handleAutoImproveAction(svgPath, currentSVG, filename);
      break;
    case 'new':
      await handleNewAction();
      break;
    case 'exit':
      clack.outro('Goodbye!');
      process.exit(0);
  }
}

/**
 * Handle view action - open SVG in browser
 */
async function handleViewAction(
  svgPath: string,
  currentSVG: string,
  filename: string
): Promise<void> {
  const s = clack.spinner();
  s.start('Opening SVG in browser...');
  await open(svgPath);
  s.stop('Opened in browser');
  await showMenu(svgPath, currentSVG, filename);
}

/**
 * Handle modify action - user-specified modifications
 */
async function handleModifyAction(
  svgPath: string,
  currentSVG: string,
  filename: string
): Promise<void> {
  const modificationPrompt = await clack.text({
    message: 'How would you like to modify the image?',
    placeholder: 'e.g., make it bigger, change the color to green',
    validate: (value) => {
      if (!value) return 'Please provide modification instructions';
    },
  });

  if (clack.isCancel(modificationPrompt)) {
    clack.cancel('Operation cancelled');
    process.exit(0);
  }

  const s = clack.spinner();
  s.start('Modifying SVG...');

  try {
    const pngBuffer = await svgToPNG(currentSVG);
    const modifiedSVG = await modifySVG(currentSVG, pngBuffer, modificationPrompt as string, s);
    const baseFilename = removeTimestampPrefix(filename);
    const { svgPath: newSvgPath, filenameWithTimestamp } = await saveFiles(
      modifiedSVG,
      baseFilename
    );
    s.stop(`Modified and saved: ${newSvgPath}`);

    await showMenu(newSvgPath, modifiedSVG, filenameWithTimestamp);
  } catch (error) {
    s.stop('Failed to modify SVG');
    clack.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    await showMenu(svgPath, currentSVG, filename);
  }
}

/**
 * Handle auto-improve action - AI-driven improvements
 */
async function handleAutoImproveAction(
  svgPath: string,
  currentSVG: string,
  filename: string
): Promise<void> {
  const s = clack.spinner();
  s.start('Auto-improving SVG...');

  try {
    const pngBuffer = await svgToPNG(currentSVG);
    const improvedSVG = await autoImproveSVG(currentSVG, pngBuffer, s);
    const baseFilename = removeTimestampPrefix(filename);
    const { svgPath: newSvgPath, filenameWithTimestamp } = await saveFiles(
      improvedSVG,
      baseFilename
    );
    s.stop(`Auto-improved and saved: ${newSvgPath}`);

    await showMenu(newSvgPath, improvedSVG, filenameWithTimestamp);
  } catch (error) {
    s.stop('Failed to auto-improve SVG');
    clack.log.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    await showMenu(svgPath, currentSVG, filename);
  }
}

/**
 * Handle new action - start over with new image
 */
async function handleNewAction(): Promise<void> {
  // Import main function dynamically to avoid circular dependency
  const { main } = await import('./index.js');
  await main();
}
