import React from 'react';

interface ChatEmptyStateProps {
  hasApiKey: boolean;
  /** When null, show "select a workspace" hint instead of generic intro. */
  workspaceId?: string | null;
  'data-testid'?: string;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ hasApiKey, workspaceId, 'data-testid': testId }) => {
  const noWorkspace = workspaceId == null || workspaceId === '';

  return (
    <div className="flex-1 overflow-y-auto p-4" data-testid={testId}>
      <div className="flex flex-col items-center justify-center h-full text-center px-8" data-testid="ai-chat-empty-state">
        <div className="space-y-6 max-w-md">
          {/* OyrenAI Logo/Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">OyrenAI</h1>
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-muted-foreground">
                {hasApiKey ? 'AI Ready' : 'AI Offline'}
              </span>
            </div>
          </div>

          {/* Empty title for easier test match */}
          <div data-testid="ai-chat-empty-title">
            <span>{noWorkspace ? 'Select a workspace first' : 'No conversation yet'}</span>
          </div>

          {/* Intro Text or workspace hint */}
          <div className="space-y-4 text-muted-foreground">
            {noWorkspace ? (
              <>
                <p className="text-lg">Your PDF AI Copilot</p>
                <p className="text-sm leading-relaxed">
                  Go to the <strong>Home</strong> page and open a workspace to use AI chat and convert PDFs to Markdown.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg">Your PDF AI Copilot</p>
                <p className="text-sm leading-relaxed">
                  I can help you analyze, summarize, and extract insights from your documents.
                  Upload PDFs and start asking questions to get detailed answers with source references.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatEmptyState;