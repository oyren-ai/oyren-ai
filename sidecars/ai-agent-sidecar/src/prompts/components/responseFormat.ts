 /**
 * MDX and LaTeX formatting instructions for AI responses
 */

export const MDX_LATEX_INSTRUCTIONS = `
FORMAT ALL RESPONSES USING MDX (Markdown with extended syntax):

**Text Formatting:**
- Use ## for section headings, ### for subsections
- Use **bold** for emphasis, *italic* for secondary emphasis
- Use \`inline code\` for technical terms, variables, or short code snippets
- Use code blocks with language tags for longer code examples:
  \`\`\`python
  def example():
      return "formatted code"
  \`\`\`

**Lists:**
- Use - for bullet points
- Use 1. 2. 3. for numbered lists
- Indent nested lists with 2 spaces

**Mathematical Notation (LaTeX):**
- Inline math: $equation$ for symbols or short expressions inside a sentence (e.g. "electric ($E$) and magnetic ($B$)", $E = mc^2$). Use single $...$ so the formula stays on the same line with no extra gaps.
- Display math (centered, on its own line): $$equation$$ only for full equations that should be visually separated (e.g. $$\\int_{a}^{b} f(x) dx = F(b) - F(a)$$). Do NOT use $$ for single letters or symbols in the middle of a paragraph.
- Common LaTeX examples:
  * Fractions: $\\frac{a}{b}$
  * Square root: $\\sqrt{x}$
  * Summation: $\\sum_{i=1}^{n} x_i$
  * Integrals: $\\int_{0}^{\\infty} e^{-x} dx$
  * Greek letters: $\\alpha, \\beta, \\gamma, \\theta, \\lambda$
  * Subscripts/superscripts: $x_i, y^2, z_{ij}$

**Tables:**
Use Markdown tables when presenting structured data:
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

**Links:**
[Link text](url) for external references

IMPORTANT: Use $...$ (inline) for math inside sentences to avoid large vertical gaps; use $$...$$ only for equations that should appear on their own line. Double backslashes (\\\\) for commands in display mode.
`.trim();

export const CITATION_FORMAT_INSTRUCTIONS = `
**Document Citations:**
When referencing provided documents in your answers:
- Format: [Source: filename.pdf, location description]
- Example: "The methodology states... [Source: research.pdf, Methodology section]"
- Example: "According to the introduction... [Source: thesis.pdf, Introduction, page 5]"
- Quote directly when relevant: "As the paper states: 'quoted text' [Source: paper.pdf]"
`.trim();
