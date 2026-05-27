import React from 'react';
import { Upload } from 'lucide-react';
import Button from '../common/Button';
import Logo from '@/components/icons/Logo';
import { WelcomeFeatures } from './WelcomeFeatures';

interface WelcomeScreenProps {
  onOpenPdf: () => void;
  onOpenPdfPath?: (path: string, workspaceFileId: string) => void;
  isDarkMode: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenPdf }) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6 animate-in fade-in duration-500">
        {/* Logo */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-2xl">
            <Logo className="text-primary" size={48} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-foreground mb-4 animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
          Welcome to Oyren
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-2 leading-relaxed animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
          Integrated learning environment
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8 animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
          oyren.ai
        </p>

        {/* Features Grid */}
        <WelcomeFeatures />

        {/* Action Button */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-500">
          <Button
            onClick={onOpenPdf}
            variant="primary"
            size="lg"
            icon={Upload}
            className="shadow-lg hover:shadow-xl"
          >
            Open PDF Document
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;