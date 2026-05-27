import type React from "react"
import RightSidebarWithPanel from "../../components/layout/sidebar/RightSidebarWithPanel"
import NavbarActions from "../../components/layout/navbar/NavbarActions"
import { useAppContext } from "../../contexts/AppContext"
import { usePdfOperations } from "./hooks/usePdfOperations"
import { useWorkspaceView } from "./hooks/useWorkspaceView"
import { useFileClickHandler } from "./hooks/useFileClickHandler"
import { SidebarProvider } from "@/components/ui/sidebar"
import { WorkspacesSidebar } from "@/features/workspace-management/components/WorkspacesSidebar"
import { RightPanelProvider, useRightPanel } from "@/contexts/RightPanelContext"
import { MarkdownViewerProvider } from "@/contexts/MarkdownViewerContext"
import { LatexNotesProvider } from "@/contexts/LatexNotesContext"
import { ArxivSearchProvider } from "@/features/arxiv-search/context/ArxivSearchContext"
import { StatusBar } from "@/components/layout/StatusBar"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useViewNavigation } from "@/contexts/NavigationContext"
import MainContentArea from "./components/MainContentArea"

interface WorkspaceViewProps {
  className?: string
}

const WorkspaceViewContent: React.FC<WorkspaceViewProps> = ({ className }) => {
  const { currentPdfPath, isDarkMode, setCurrentPdfPath, setCurrentWorkspaceFileId,
    setCurrentSessionId, isSidebarCollapsed, setIsSidebarCollapsed } = useAppContext()
  const { selectedWorkspace } = useViewNavigation()
  const { isPanelOpen } = useRightPanel()

  const { loading, handleOpenPdf, handleOpenPdfPath } = usePdfOperations(
    setCurrentPdfPath, setCurrentSessionId, selectedWorkspace ?? undefined, setCurrentWorkspaceFileId
  )
  const { handleFileClick } = useFileClickHandler({ handleOpenPdfPath })
  const { handleToggleSidebar } = useWorkspaceView(isSidebarCollapsed, setIsSidebarCollapsed)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <WorkspacesSidebar onFileClick={handleFileClick} />
        <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-w-0 overflow-hidden">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={isPanelOpen ? 70 : 100} minSize={30} className="flex flex-col min-w-0">
                  <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${className || ""}`}>
                    <div className="flex-shrink-0 w-full overflow-hidden">
                      <NavbarActions loading={loading} onOpenPdf={handleOpenPdf} onToggleSidebar={handleToggleSidebar} />
                    </div>
                    <div className="flex-1 relative flex flex-col overflow-hidden min-w-0" data-testid="main-content">
                      <MainContentArea currentPdfPath={currentPdfPath} isDarkMode={isDarkMode}
                        onOpenPdf={handleOpenPdf} onOpenPdfPath={handleOpenPdfPath} />
                    </div>
                  </div>
                </ResizablePanel>
                <RightSidebarWithPanel />
              </ResizablePanelGroup>
            </div>
          </div>
          <StatusBar />
        </main>
      </div>
    </SidebarProvider>
  )
}

const WorkspaceView: React.FC<WorkspaceViewProps> = (props) => {
  return (
    <RightPanelProvider>
      <MarkdownViewerProvider>
        <LatexNotesProvider>
          <ArxivSearchProvider>
            <WorkspaceViewContent {...props} />
          </ArxivSearchProvider>
        </LatexNotesProvider>
      </MarkdownViewerProvider>
    </RightPanelProvider>
  )
}

export default WorkspaceView
