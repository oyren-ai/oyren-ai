/**
 * Markdown Viewer Component
 * Displays converted Markdown from Marker PDF conversion
 */

import { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface MarkdownViewerProps {
  markdownPath: string;
  pdfFileName: string;
  onClose: () => void;
}

export default function MarkdownViewer({
  markdownPath,
  pdfFileName,
  onClose,
}: MarkdownViewerProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarkdownContent();
  }, [markdownPath]);

  async function loadMarkdownContent() {
    try {
      setLoading(true);
      setError(null);

      // Read markdown file using Tauri
      const fileContent = await invoke<string>('read_file', {
        path: markdownPath,
      });

      setContent(fileContent);
    } catch (err) {
      console.error('Error loading markdown:', err);
      setError(err instanceof Error ? err.message : 'Failed to load markdown');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    try {
      // Trigger download using Tauri
      await invoke('save_file_dialog', {
        defaultPath: pdfFileName.replace('.pdf', '.md'),
        content,
      });
    } catch (err) {
      console.error('Error downloading markdown:', err);
    }
  }

  async function handleCopyToClipboard() {
    try {
      await navigator.clipboard.writeText(content);
      // TODO: Show toast notification
      console.log('Copied to clipboard!');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Markdown Preview
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pdfFileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5"
              title="Download markdown file"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              title="Close"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading markdown...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {error}
              </p>
              <button
                onClick={loadMarkdownContent}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-neutral-950 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
                {content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-800 flex justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Converted with Marker • {content.length.toLocaleString()} characters
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


