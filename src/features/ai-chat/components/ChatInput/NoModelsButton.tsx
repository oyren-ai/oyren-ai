import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useViewNavigation } from '@/contexts/NavigationContext.tsx';

export default function NoModelsButton() {
  const { navigateToSettings } = useViewNavigation();

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs rounded-full"
      onClick={() => navigateToSettings("models")}
    >
      <AlertTriangle className="w-3 h-3 mr-1 text-yellow-500" />
      No models
    </Button>
  );
}
