import React, { useState, useEffect } from 'react';
import { X, FileText, Clock, Trash2, MessageSquare } from 'lucide-react';
import Button from '../Button';
import IconButton from '../IconButton';
import { conversationHistoryService } from '../../../services/conversationHistoryService';

interface RecentPdf {
  path: string;
  name: string;
  lastOpened: number;
}

interface RecentPdfsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPdf: (path: string) => void;
  isDarkMode: boolean;
}

const RecentPdfsModal: React.FC<RecentPdfsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectPdf,
  isDarkMode 
}) => {
  const [recentPdfs, setRecentPdfs] = useState<RecentPdf[]>([]);
  const [chatMetadata, setChatMetadata] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (isOpen) {
      loadRecentPdfs();
      loadChatMetadata();
    }
  }, [isOpen]);

  const loadRecentPdfs = () => {
    const stored = localStorage.getItem('recent-pdfs');
    if (stored) {
      try {
        const pdfs = JSON.parse(stored) as RecentPdf[];
        // Sort by most recent first
        setRecentPdfs(pdfs.sort((a, b) => b.lastOpened - a.lastOpened));
      } catch (error) {
        console.error('Error loading recent PDFs:', error);
        setRecentPdfs([]);
      }
    }
  };

  const loadChatMetadata = async () => {
    try {
      const recentConversations = await conversationHistoryService.getRecentConversations(100);
      const metadata = new Map<string, number>();
      recentConversations.forEach(conversation => {
        metadata.set(conversation.pdfPath, conversation.messageCount);
      });
      setChatMetadata(metadata);
    } catch (error) {
      console.error('Error loading chat metadata:', error);
    }
  };

  const handleRemovePdf = (path: string) => {
    const filtered = recentPdfs.filter(pdf => pdf.path !== path);
    setRecentPdfs(filtered);
    localStorage.setItem('recent-pdfs', JSON.stringify(filtered));
  };

  const handleSelectPdf = (pdf: RecentPdf) => {
    onSelectPdf(pdf.path);
    onClose();
  };

  const clearAll = () => {
    setRecentPdfs([]);
    localStorage.removeItem('recent-pdfs');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const formatPath = (path: string) => {
    // Show only the directory path, not the filename
    const parts = path.split('/');
    parts.pop(); // Remove filename
    const dir = parts.join('/');
    
    // Truncate long paths
    if (dir.length > 50) {
      return '...' + dir.slice(-47);
    }
    return dir || '/';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col  custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recent PDFs
          </h2>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            tooltip="Close"
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {recentPdfs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No recent PDFs found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                PDFs you open will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPdfs.map((pdf) => {
                const messageCount = chatMetadata.get(pdf.path);
                return (
                  <div
                    key={pdf.path}
                    className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleSelectPdf(pdf)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {pdf.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {formatPath(pdf.path)}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {formatDate(pdf.lastOpened)}
                          </span>
                        </div>
                        {messageCount && messageCount > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {messageCount} messages
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePdf(pdf.path);
                    }}
                    tooltip="Remove from recents"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {recentPdfs.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPdfsModal;