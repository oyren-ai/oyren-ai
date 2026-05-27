import React from 'react';
import { Sparkles, Key, Type } from 'lucide-react';

export function WelcomeFeatures() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
      <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <Type className="w-6 h-6 text-primary" />
        <span className="text-sm font-medium text-foreground">LaTeX Notes</span>
        <span className="text-xs text-muted-foreground text-center">Rich mathematical notation</span>
      </div>
      <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <Sparkles className="w-6 h-6 text-primary" />
        <span className="text-sm font-medium text-foreground">Local LLMs</span>
        <span className="text-xs text-muted-foreground text-center">Privacy-first AI</span>
      </div>
      <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        <Key className="w-6 h-6 text-primary" />
        <span className="text-sm font-medium text-foreground">Your API Key</span>
        <span className="text-xs text-muted-foreground text-center">Use your own providers</span>
      </div>
    </div>
  );
}