import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import type { SaveFilesResult } from './types.js';
import { getTimestamp } from './utils.js';

/**
 * Save SVG content to file with timestamp prefix
 * @param svg - SVG markup string
 * @param filename - Base filename without extension
 * @param timestamp - Timestamp string
 * @returns Full path to saved SVG file
 */
async function saveSVG(svg: string, filename: string, timestamp: string): Promise<string> {
  const svgPath = path.join(process.cwd(), `${timestamp}-${filename}.svg`);
  await fs.writeFile(svgPath, svg, 'utf-8');
  return svgPath;
}

/**
 * Convert SVG to PNG and save to file with timestamp prefix
 * @param svg - SVG markup string
 * @param filename - Base filename without extension
 * @param timestamp - Timestamp string
 * @returns Full path to saved PNG file
 */
async function savePNG(svg: string, filename: string, timestamp: string): Promise<string> {
  const pngPath = path.join(process.cwd(), `${timestamp}-${filename}.png`);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(pngPath);

  return pngPath;
}

/**
 * Save SVG file with timestamp prefix
 * @param svg - SVG markup string
 * @param filename - Base filename without extension
 * @returns Object containing paths and timestamped filename
 */
export async function saveFiles(svg: string, filename: string): Promise<SaveFilesResult> {
  const timestamp = getTimestamp();
  const svgPath = await saveSVG(svg, filename, timestamp);

  return {
    svgPath,
    pngPath: '', // No longer saving PNG
    filenameWithTimestamp: `${timestamp}-${filename}`
  };
}

/**
 * Convert SVG to PNG buffer on the fly
 * @param svg - SVG markup string
 * @returns PNG file as Buffer
 */
export async function svgToPNG(svg: string): Promise<Buffer> {
  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}
