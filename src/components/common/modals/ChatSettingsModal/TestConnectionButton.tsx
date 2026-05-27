import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface TestConnectionButtonProps {
  onTestConnection: () => void;
  isTestingConnection: boolean;
  connectionStatus: 'idle' | 'success' | 'error';
  connectionError: string;
}

const TestConnectionButton: React.FC<TestConnectionButtonProps> = ({
  onTestConnection,
  isTestingConnection,
  connectionStatus,
  connectionError,
}) => {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onTestConnection}
        disabled={isTestingConnection}
      >
        {isTestingConnection ? 'Testing...' : 'Test Connection'}
      </Button>

      {connectionStatus === 'success' && (
        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Connection successful!
        </p>
      )}

      {connectionStatus === 'error' && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {connectionError}
        </p>
      )}
    </div>
  );
};

export default TestConnectionButton;
