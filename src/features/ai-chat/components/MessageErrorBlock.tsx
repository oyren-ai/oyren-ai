import React from 'react';
import { AlertCircle, Lightbulb } from 'lucide-react';
import type { StructuredError } from '../types';

interface MessageErrorBlockProps {
  content: string;
  structuredError?: StructuredError;
}

function getErrorTypeStyle(errorType?: string) {
  switch (errorType) {
    case 'feature-not-supported':
      return { color: 'text-orange-800 dark:text-orange-300', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-500' };
    default:
      return { color: 'text-red-800 dark:text-red-300', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-500' };
  }
}

const MessageErrorBlock: React.FC<MessageErrorBlockProps> = ({ content, structuredError }) => {
  const style = getErrorTypeStyle(structuredError?.errorType);

  return (
    <div
      className={`mb-2 max-w-full min-w-0 overflow-hidden p-4 ${style.bgColor} border-l-4 ${style.borderColor} rounded-lg space-y-3`}
    >
      <div className="flex items-start gap-2 min-w-0">
        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.color}`} />
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm ${style.color}`}>
            {structuredError?.shortMessage || 'Error'}
          </div>
          <div
            className={`text-sm mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere] max-h-40 overflow-y-auto leading-relaxed ${style.color}`}
          >
            {content}
          </div>
        </div>
      </div>

      <ErrorSuggestions structuredError={structuredError} style={style} />
      <ErrorTechnicalDetails structuredError={structuredError} style={style} />
    </div>
  );
};

function ErrorSuggestions({ structuredError, style }: { structuredError?: StructuredError; style: ReturnType<typeof getErrorTypeStyle> }) {
  if (structuredError?.suggestions && structuredError.suggestions.length > 0) {
    return (
      <div className="mt-3 pt-3 border-t border-current/20">
        <div className="flex items-start gap-2">
          <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.color}`} />
          <div className="flex-1">
            <div className={`text-sm font-medium mb-2 ${style.color}`}>Suggested Solutions:</div>
            <ol className={`text-sm space-y-1 list-decimal list-inside ${style.color}`}>
              {structuredError.suggestions.map((suggestion, idx) => (
                <li key={idx} className="pl-1">{suggestion}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (structuredError?.suggestion && !structuredError?.suggestions) {
    return (
      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-current/20">
        <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.color}`} />
        <div className={`text-sm ${style.color}`}>
          <span className="font-medium">Suggestion: </span>
          {structuredError.suggestion}
        </div>
      </div>
    );
  }

  return null;
}

function ErrorTechnicalDetails({ structuredError, style }: { structuredError?: StructuredError; style: ReturnType<typeof getErrorTypeStyle> }) {
  if (!structuredError?.technicalDetails) return null;

  return (
    <details className="mt-3 pt-3 border-t border-current/20">
      <summary className={`text-xs font-medium cursor-pointer hover:underline ${style.color}`}>
        Technical Details (for debugging)
      </summary>
      <pre
        className={`mt-2 max-w-full min-w-0 text-xs p-2 rounded bg-black/5 dark:bg-white/5 max-h-32 overflow-auto whitespace-pre-wrap break-all ${style.color}`}
      >
        {structuredError.technicalDetails}
      </pre>
    </details>
  );
}

export default MessageErrorBlock;
