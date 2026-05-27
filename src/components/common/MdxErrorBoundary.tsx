import React from 'react';
import type { ReactNode } from 'react';

interface MdxErrorBoundaryProps {
  children: ReactNode;
  fallbackContent: string;
}

interface MdxErrorBoundaryState {
  hasRenderError: boolean;
}

class MdxErrorBoundary extends React.Component<
  MdxErrorBoundaryProps,
  MdxErrorBoundaryState
> {
  state: MdxErrorBoundaryState = { hasRenderError: false };

  static getDerivedStateFromError(): MdxErrorBoundaryState {
    return { hasRenderError: true };
  }

  render() {
    if (this.state.hasRenderError) {
      return (
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
          {this.props.fallbackContent}
        </pre>
      );
    }
    return this.props.children;
  }
}

export default MdxErrorBoundary;
