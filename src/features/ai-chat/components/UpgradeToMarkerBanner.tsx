/**
 * Upgrade to Marker Banner
 * Shows incentive to upgrade PDF to Marker markdown for better AI responses
 */

import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface UpgradeToMarkerBannerProps {
  pdfFileName: string;
  onUpgradeClick: () => void;
  onDismiss?: () => void;
}

export default function UpgradeToMarkerBanner({
  pdfFileName,
  onUpgradeClick,
  onDismiss,
}: UpgradeToMarkerBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800/50 shadow-sm">
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">
          💡 Get 2x Better AI Responses
        </h4>
        <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
          Upgrade <span className="font-medium">{pdfFileName}</span> to high-quality Markdown with Marker. 
          AI will understand tables, formulas, and structure better.
        </p>
        <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400">
          <span>✓ Better context</span>
          <span>•</span>
          <span>✓ Preserved formatting</span>
          <span>•</span>
          <span>✓ 5+ credits</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onUpgradeClick}
          className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow active:scale-95"
        >
          Upgrade Now
        </button>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </button>
        )}
      </div>
    </div>
  );
}


