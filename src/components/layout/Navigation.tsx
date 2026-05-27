import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import HomeIcon from '@/components/icons/HomeIcon';

interface Tab {
  id: string;
  label: string;
  type: 'action' | 'tab';
  requiresAuth?: boolean;
  icon?: string;
}

export interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  'data-testid'?: string;
  hasPdfOpen?: boolean;
  onPdfLoaded?: (pdfPath: string | null) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  'data-testid': testId,
  hasPdfOpen = false,
  onPdfLoaded,
}) => {
  const [loading, setLoading] = useState(false);

  const tabs: Tab[] = [
    { id: 'home', label: '', type: 'action' as const },
  ];

  const handleOpenPdf = async () => {
    // Only handle opening a new PDF, closing is handled by navigation
    setLoading(true);
    try {
      const selectedPath = await open({
        multiple: false,
        filters: [{
          name: 'PDF Files',
          extensions: ['pdf']
        }]
      });

      if (typeof selectedPath === 'string') {
        if (onPdfLoaded) {
          onPdfLoaded(selectedPath);
        }
      }
    } catch (error) {
      console.error('Error opening file dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab: Tab) => {
    if (tab.type === 'action' && tab.id === 'home') {
      // Navigate to open-pdf view when home is clicked
      onTabChange('open-pdf');
    } else {
      onTabChange(tab.id);
    }
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-2 py-1" data-testid={testId}>
      <div className="flex gap-0.5 items-center flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700" data-testid="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`
              relative px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
              ${tab.type === 'tab' && activeTab === tab.id 
                ? 'bg-gray-800 text-white' 
                : ''
              }
              ${tab.type === 'tab' && activeTab !== tab.id
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : ''
              }
              ${loading && tab.id === 'open-pdf' ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => handleTabClick(tab)}
            disabled={loading && tab.id === 'open-pdf'}
            data-testid={`nav-tab-${tab.id}`}
          >
            {tab.id === 'home' ? (
              <HomeIcon size={16} />
            ) : (
              <>
                {loading && tab.id === 'open-pdf' ? 'Loading...' : tab.label}
                {tab.type === 'action' && tab.id === 'open-pdf' && (
                  <span className="ml-1 text-[10px] opacity-60" data-testid="dropdown-arrow">{tab.icon || '▼'}</span>
                )}
              </>
            )}
            {activeTab === tab.id && tab.type === 'tab' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;