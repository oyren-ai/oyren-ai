/**
 * Registers LaTeX language in Monaco Editor with Monarch syntax highlighting.
 * Call once before rendering an editor with language="latex" (e.g. in beforeMount).
 */

const LATEX_LANGUAGE_ID = 'latex';

let registered = false;

export function registerLatexLanguage(monaco: typeof import('monaco-editor')): void {
  if (registered) return;

  monaco.languages.register({ id: LATEX_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(LATEX_LANGUAGE_ID, {
    defaultToken: '',
    tokenPostfix: '.latex',
    ignoreCase: false,

    tokenizer: {
      root: [
        // Comments: % to end of line
        [/%.*$/, 'comment'],
        // Verbatim \verb!...! or \verb*!...!
        [/\\verb\*?([^a-zA-Z]).*?\1/, 'string'],
        // Math display \[ ... \]
        [/\\\[/, 'keyword', '@mathDisplay'],
        // Math inline \( ... \)
        [/\\\(/, 'keyword', '@mathInline'],
        // $$ ... $$ (display math) – match before single $
        [/\$\$/, 'keyword', '@mathDisplayDollar'],
        // $ ... $ (inline math)
        [/\$/, 'keyword', '@mathDollar'],
        // \begin{...}
        [/\\begin\s*\{[^}]*\}/, 'type'],
        // \end{...}
        [/\\end\s*\{[^}]*\}/, 'type'],
        // \documentclass, \usepackage, \input, \include, etc.
        [/\\documentclass\b/, 'keyword'],
        [/\\usepackage\b/, 'keyword'],
        [/\\input\b|\\include\b|\\includeonly\b/, 'keyword'],
        [/\\begin\b|\\end\b/, 'keyword'],
        // Sectioning
        [/\\part\b|\\chapter\b|\\section\b|\\subsection\b|\\subsubsection\b|\\paragraph\b|\\subparagraph\b/, 'keyword'],
        // Common commands (one-word backslash)
        [/\\[a-zA-Z@]+/, 'keyword'],
        // Curly braces
        [/\{/, 'delimiter.curly'],
        [/\}/, 'delimiter.curly'],
        // Square brackets
        [/\[/, 'delimiter.square'],
        [/\]/, 'delimiter.square'],
        // Optional argument [...]
        [/\[[^\]]*\]/, 'metatag'],
      ],

      mathDisplay: [
        [/\\\]/, 'keyword', '@pop'],
        [/./, 'string'],
      ],

      mathInline: [
        [/\\\)/, 'keyword', '@pop'],
        [/./, 'string'],
      ],

      mathDollar: [
        [/\$/, 'keyword', '@pop'],
        [/./, 'string'],
      ],

      mathDisplayDollar: [
        [/\$\$/, 'keyword', '@pop'],
        [/./, 'string'],
      ],
    },
  });

  /* Base themes (vs / vs-dark) already map token names like comment, keyword, type, string to colors. */

  registered = true;
}

export { LATEX_LANGUAGE_ID };
