/**
 * Type declarations for latex.js (no official @types/latex.js)
 * @see https://latex.js.org/api.html
 */
declare module 'latex.js' {
  export interface HtmlGeneratorOptions {
    hyphenate?: boolean;
    styles?: string[];
    languagePatterns?: unknown;
    CustomMacros?: unknown;
    documentClass?: string;
  }

  export class HtmlGenerator {
    constructor(options?: HtmlGeneratorOptions);
    reset(): void;
    htmlDocument(baseURL?: string): Document;
    stylesAndScripts(baseURL?: string): DocumentFragment;
    domFragment(): DocumentFragment;
    documentTitle(): string;
  }

  export function parse(
    latex: string,
    options: { generator: HtmlGenerator }
  ): HtmlGenerator;

  export class SyntaxError extends Error {}
}
