export const DEFAULT_NOTE_TEMPLATE = `# Getting Started with Oyren

Oyren is your academic IDE — a single workspace for PDFs, AI chat, and notes.

---

## Setting Up AI Chat

You need **one** of the following to use AI features:

### Option A: Cloud API Key (Recommended)

1. Go to **Settings** (gear icon in the sidebar)
2. Pick a provider and paste your API key:
   - **Google Gemini** — [Get key](https://aistudio.google.com/apikey)
   - **OpenRouter** — [Get key](https://openrouter.ai/keys) (access to many models)
   - **DeepSeek** — [Get key](https://platform.deepseek.com/api_keys)
3. Select a model and start chatting

### Option B: Local LLM via Ollama (Free, Private)

1. Install Ollama: [ollama.com/download](https://ollama.com/download)
2. Pull a model: \`ollama pull llama3\` or \`ollama pull gemma2\`
3. In Oyren **Settings**, select **Ollama** as the provider
4. Pick your downloaded model — done!

---

## Working with PDFs

- **Open a PDF**: Click the **+** button in the sidebar to add files to your workspace
- **Attach to AI chat**: Use the **@** button in chat to reference a PDF in your question
- **Scanned PDFs**: If your PDF is a scan (no selectable text), use **OCR Scan** to extract text first

---

## Notes

- Create notes with the **+** button in the notes panel
- Full **Markdown** support: headings, lists, code blocks, math ($E = mc^2$), tables
- Notes **auto-save** after 1 second of inactivity
- Switch between **edit** and **preview** mode with the toolbar icons

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New note | Ctrl/Cmd + N |
| Toggle sidebar | Ctrl/Cmd + B |
| Focus chat | Ctrl/Cmd + L |

---

Happy researching!
`;
