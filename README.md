# Oyren AI

The academic IDE for reading papers, capturing what matters, and reasoning with AI — without leaving your library.

Oyren is available two ways:

- **Desktop app** (this repo) — macOS, Windows, and Linux
- **Web app** — [oyren.ai](https://oyren.ai), in the browser, with OCR for scanned PDFs

Both share the same workspaces and AI providers, so you can switch between them on the same documents.

## Features

### Read

- Native PDF viewer with multi-color highlighting, full-text search, bookmarks, zoom, and rotation
- Per-document dark mode, independent of the app theme
- **Marker-powered OCR** that turns scanned or image-heavy PDFs into clean, structured Markdown

### Capture

- Snip any region of a PDF and attach it directly to a chat message
- Highlight a passage and ask an AI question about it inline
- Organize everything into workspaces — create as many as you want, pin and archive freely

### Reason with AI

- **Bring your own keys** for Google Gemini (2.5 Flash/Pro, 3 Pro) and DeepSeek, or route through OpenRouter for Anthropic Claude (Opus/Sonnet/Haiku 4.5–4.6), OpenAI GPT (4.1, 4o, 5, 5.2), Kimi K2.5, GLM-5, and more
- **Offline models via Ollama** — Oyren auto-detects models running on your local Ollama instance and lists them alongside cloud providers, with zero configuration
- **Oyren Credits** for pay-as-you-go access to top models without juggling provider keys
- Streaming responses, full conversation history, and free model switching mid-thread
- Attach screenshots, page snippets, or whole PDFs as context for multimodal models

### Research workflow

- **arXiv search and download** built in — find papers and pull them straight into a workspace
- **YouTube transcript import** — paste a video URL, get the transcript as a workspace file
- Global search across workspace files and conversations
- Export conversations to MDX

## Install

Download the latest release for your platform from [oyren.ai](https://oyren.ai) or from the [Releases page](https://github.com/oyren-ai/oyren-ai/releases).

Linux requirements: Ubuntu 22.04+, Debian 12+, or Fedora 36+ (needs `webkit2gtk-4.1`).

## Build from source

Prerequisites: Node.js 20+, **pnpm 9+** (no npm/yarn), Rust stable, and Python 3.10+ for the Marker sidecar.

```bash
pnpm install
pnpm tauri:dev        # run the desktop app in development
pnpm tauri:build      # build a release package for your platform
```

Tests: `pnpm test` for the frontend, `cargo test` inside `src-tauri/` for the backend. Architecture notes live in `src-tauri/README.md`.

## Contributing

Issues and pull requests are welcome. Please read the surrounding modules before adding new abstractions — the codebase favors pure-functional Rust with explicit error conversions on the backend, and container/presenter React with small files on the frontend.

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
