import MarkdownViewer from '@/features/notes/mdx-notes/MarkdownViewer';

interface WorkspaceMarkdownViewerProps {
  content: string;
  basePath?: string;
  isLoading?: boolean;
}

export function WorkspaceMarkdownViewer({ content, basePath, isLoading }: WorkspaceMarkdownViewerProps) {
  return (
    <MarkdownViewer
      content={content}
      isLoading={isLoading}
      imageBasePath={basePath}
    />
  );
}