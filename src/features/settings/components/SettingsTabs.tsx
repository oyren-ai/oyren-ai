import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Cpu, Database, BookOpen } from "lucide-react";
import { GeneralSettings } from "./GeneralSettings";
import { ModelsSettings } from "./ModelsSettings";
import { MemorySettings } from "./MemorySettings";
import { DocsSettings } from "./DocsSettings";

interface SettingsTabsProps {
  activeCategory: string;
  onCategoryChange: (value: string) => void;
}

export function SettingsTabs({ activeCategory, onCategoryChange }: SettingsTabsProps) {
  return (
    <Tabs value={activeCategory} onValueChange={onCategoryChange} data-testid="settings-tabs">
      <TabsList className="grid w-full max-w-md grid-cols-4 mb-8">
        <TabsTrigger value="general" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          General
        </TabsTrigger>
        <TabsTrigger value="models" className="flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          Models
        </TabsTrigger>
        <TabsTrigger value="memory" className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          Memory
        </TabsTrigger>
        <TabsTrigger value="docs" className="flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Docs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <GeneralSettings />
      </TabsContent>

      <TabsContent value="models" className="space-y-6">
        <ModelsSettings />
      </TabsContent>

      <TabsContent value="memory">
        <MemorySettings />
      </TabsContent>

      <TabsContent value="docs">
        <DocsSettings />
      </TabsContent>
    </Tabs>
  );
}