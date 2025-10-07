/**
 * Result of SVG generation operation
 */
export interface GenerateSVGResult {
  svg: string;
  filename: string;
}

/**
 * Result of file save operation
 */
export interface SaveFilesResult {
  svgPath: string;
  pngPath: string;
  filenameWithTimestamp: string;
}

/**
 * Menu action types
 */
export type MenuAction = 'view' | 'modify' | 'auto' | 'new' | 'exit';

/**
 * Application configuration
 */
export interface AppConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}
