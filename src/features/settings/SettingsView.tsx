import { useState, useEffect } from "react";

import { useViewNavigation } from "@/contexts/NavigationContext";
import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsTabs } from "./components/SettingsTabs";
import { SettingsFooter } from "./components/SettingsFooter";
import { LeftMiniBar } from "../home/components";

export const SettingsView: React.FC = () => {
  const { navigateBack, settingsTab, clearSettingsTab } = useViewNavigation();
  const [activeCategory, setActiveCategory] = useState(settingsTab ?? "general");

  useEffect(() => {
    clearSettingsTab();
  }, []);

  return (
    <div className="flex h-screen bg-background" data-testid="settings-view">
      <LeftMiniBar />

      <div className="flex-1 flex flex-col">
        <SettingsHeader onBackClick={navigateBack} />

        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <SettingsTabs 
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <SettingsFooter />
          </div>
        </div>
      </div>
    </div>
  );
};