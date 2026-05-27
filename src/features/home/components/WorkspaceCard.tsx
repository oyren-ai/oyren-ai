import React, { useState } from 'react';
import type { WorkspaceDisplay } from '@/types/workspace';
import { FolderOpen, MoreHorizontal, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useViewNavigation } from '@/contexts/NavigationContext';
import { useDeleteWorkspaceModal, useEditWorkspaceModal, useCloudSyncModal } from '@/contexts/ModalContext';
import { useWorkspaceCloudLinked } from '../hooks/useWorkspaceCloudLinked';

interface WorkspaceCardProps {
    workspace: WorkspaceDisplay;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { navigateToWorkspace } = useViewNavigation();
    const deleteWorkspaceModal = useDeleteWorkspaceModal();
    const editWorkspaceModal = useEditWorkspaceModal();
    const cloudSyncModal = useCloudSyncModal();
    const isCloudLinked = useWorkspaceCloudLinked(workspace.id);

    const handleClick = () => {
        navigateToWorkspace(workspace);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        editWorkspaceModal.open({ workspace });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        deleteWorkspaceModal.open({ workspace });
    };

    const handleCloudSync = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        cloudSyncModal.open({ workspace });
    };

    return (
        <div
            onClick={handleClick}
            className="hover:shadow-lg hover:bg-accent/5 dark:hover:bg-accent/10 dark:hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 cursor-pointer bg-card p-4 border border-border rounded-lg relative"
            data-testid={`workspace-card-${workspace.id}`}
        >
            <div className="flex flex-col space-y-3">
                {/* Header with title and menu */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                        <FolderOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="font-semibold text-base leading-tight line-clamp-2 h-10 flex items-start" title={workspace.name}>
                            {workspace.name}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {(workspace.is_pinned || workspace.is_favourite) && (
                            <div className="flex gap-1 mr-1">
                                {workspace.is_pinned && (
                                    <span className="text-xs text-muted-foreground">📌</span>
                                )}
                                {workspace.is_favourite && (
                                    <span className="text-xs text-muted-foreground">⭐</span>
                                )}
                            </div>
                        )}

                        <div className="relative">
                            <button
                                onClick={handleMenuClick}
                                className="h-6 w-6 flex items-center justify-center hover:bg-accent rounded-md transition-colors"
                                aria-label="Workspace options"
                                data-testid="workspace-menu-button"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(false);
                                        }}
                                    />
                                    <div className="absolute right-0 mt-1 w-52 bg-popover border border-border rounded-md shadow-lg z-20">
                                        <button
                                            onClick={handleEdit}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
                                            data-testid="workspace-edit-button"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Workspace
                                        </button>
                                        <button
                                            onClick={handleCloudSync}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
                                            data-testid="workspace-cloud-sync-button"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Sync with cloud
                                            {isCloudLinked && (
                                                <span className="ml-auto text-[10px] text-muted-foreground">✓</span>
                                            )}
                                        </button>
                                        <div className="border-t border-border" />
                                        <button
                                            onClick={handleDelete}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-accent transition-colors"
                                            data-testid="workspace-delete-button"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Workspace
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Row - PDFs and Chats */}
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{workspace.document_count} {workspace.document_count === 1 ? 'PDF' : 'PDFs'}</span>
                    <span>{workspace.chat_count} {workspace.chat_count === 1 ? 'Chat' : 'Chats'}</span>
                </div>

                {/* Date Row */}
                <div className="text-xs text-muted-foreground">
                    {workspace.lastAccessed || 'Never accessed'}
                </div>
            </div>
        </div>
    );
}
