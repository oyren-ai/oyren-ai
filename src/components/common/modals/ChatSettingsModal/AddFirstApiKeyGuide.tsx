import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Guide from '@/components/Guide/Guide';

interface AddFirstApiKeyGuideProps {
  onOpenSettings: () => void;
}

const AddFirstApiKeyGuide: React.FC<AddFirstApiKeyGuideProps> = ({ onOpenSettings }) => {
  return (
    <div className="space-y-3">
      <Guide
        lightImage="/ui-guides/screenshots/light-mode-settings-screenshots.png"
        darkImage="/ui-guides/screenshots/dark-mode-setting-screenshots.png"
        text="Go to Settings/Model"
        hoverText="Navigate to Settings page and add your API keys under the Model section to start using AI chat features."
      />
      <Button
        onClick={onOpenSettings}
        className="w-full"
        variant="outline"
      >
        <SettingsIcon className="w-4 h-4 mr-2" />
        Open Settings to Add API Keys
      </Button>
    </div>
  );
};

export default AddFirstApiKeyGuide;
