import React from 'react';
import type { RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import { ZoomPlugin, zoomPlugin } from '@react-pdf-viewer/zoom';
import { HighlightPlugin, highlightPlugin, Trigger } from '@react-pdf-viewer/highlight';
import { BookmarkPlugin, bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import { RotatePlugin, rotatePlugin } from '@react-pdf-viewer/rotate';
import {SearchPlugin, searchPlugin} from '@react-pdf-viewer/search';
import { PageNavigationPlugin, pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';

export interface PdfViewerPluginsInstance {
  zoomPlugin: ZoomPlugin;
  bookmarkPlugin: BookmarkPlugin;
  searchPlugin: SearchPlugin;
  highlightPlugin: HighlightPlugin;
  pageNavigationPlugin: PageNavigationPlugin;
  rotatePlugin: RotatePlugin;
}

interface UsePdfViewPluginsProps {
  renderHighlightTarget: (props: any) => React.ReactElement;
  renderHighlightContent: (props: any) => React.ReactElement;
  renderHighlights?: (props: RenderHighlightsProps) => React.ReactElement;
}

export function usePdfViewerPlugins({
  renderHighlightTarget,
  renderHighlightContent,
  renderHighlights,
}: UsePdfViewPluginsProps): PdfViewerPluginsInstance {

  const zoomPluginInstance = zoomPlugin({
    enableShortcuts: true,
  });

  const bookmarkPluginInstance = bookmarkPlugin();

  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.TextSelection,
    renderHighlightTarget,
    renderHighlightContent,
    ...(renderHighlights ? { renderHighlights } : {}),
  });

  const searchPluginInstance = searchPlugin({
    enableShortcuts: true,
  });

  const pageNavigationPluginInstance = pageNavigationPlugin();

  const rotatePluginInstance = rotatePlugin();


  return {
      zoomPlugin: zoomPluginInstance,
      bookmarkPlugin: bookmarkPluginInstance,
      highlightPlugin: highlightPluginInstance,
      searchPlugin: searchPluginInstance,
      pageNavigationPlugin: pageNavigationPluginInstance,
      rotatePlugin: rotatePluginInstance
  };
}