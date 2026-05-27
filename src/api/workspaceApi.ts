import {invoke} from '@tauri-apps/api/core';
import type {Workspace, WorkspaceDisplay} from '../types/workspace';

export const workspaceApi = {
    //TODO: create request and response types for these functions
    list: async (): Promise<Workspace[]> => {
        return await invoke('list_workspaces');
    },
    list_for_display: async (): Promise<WorkspaceDisplay[]> => {
        return await invoke('list_workspaces_for_display');
    },
    //TODO: create request and response types for these functions
    create: async (name: string, description?: string): Promise<Workspace> => {
        return await invoke('create_workspace', {name, description});
    },
    //TODO: create request and response types for these functions
    get: async (id: string): Promise<Workspace | null> => {
        return await invoke('get_workspace', {id});
    },

//TODO: create request and response types for these functions
    update: async (id: string, name?: string, description?: string | null): Promise<Workspace> => {
        return await invoke('update_workspace', {id, name, description});
    },
    //TODO: create request and response types for these functions
    delete: async (id: string): Promise<void> => {
        return await invoke('delete_workspace', {id});
    },
    downloadArxivPaper: async (workspaceId: string, pdfUrl: string, filename: string): Promise<string> => {
        return await invoke('download_arxiv_paper', {workspaceId, pdfUrl, filename});
    },
};