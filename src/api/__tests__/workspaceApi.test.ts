import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspaceApi } from '../workspaceApi';
import type { Workspace } from '@/types/workspace';

// Mock the Tauri invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('workspaceApi', () => {
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { invoke } = vi.mocked(await import('@tauri-apps/api/core'));
    mockInvoke = invoke as ReturnType<typeof vi.fn>;
  });

  const mockWorkspace: Workspace = {
    id: 'workspace-123',
    name: 'Test Workspace',
    description: 'Test Description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    last_accessed_at: '2024-01-20T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    is_favourite: false,
    is_active: true,
  };

  describe('list', () => {
    it('should list all workspaces', async () => {
      const mockWorkspaces: Workspace[] = [
        mockWorkspace,
        { ...mockWorkspace, id: 'workspace-456', name: 'Another Workspace' }
      ];

      mockInvoke.mockResolvedValueOnce(mockWorkspaces);

      const result = await workspaceApi.list();

      expect(mockInvoke).toHaveBeenCalledWith('list_workspaces');
      expect(result).toEqual(mockWorkspaces);
    });

    it('should handle empty workspace list', async () => {
      const mockWorkspaces: Workspace[] = [];

      mockInvoke.mockResolvedValueOnce(mockWorkspaces);

      const result = await workspaceApi.list();

      expect(mockInvoke).toHaveBeenCalledWith('list_workspaces');
      expect(result).toEqual(mockWorkspaces);
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('Failed to list workspaces');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(workspaceApi.list()).rejects.toThrow('Failed to list workspaces');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a new workspace', async () => {
      const newWorkspace = {
        name: 'New Workspace',
        description: 'New Description'
      };

      mockInvoke.mockResolvedValueOnce(mockWorkspace);

      const result = await workspaceApi.create(newWorkspace.name, newWorkspace.description);

      expect(mockInvoke).toHaveBeenCalledWith('create_workspace', {
        name: newWorkspace.name,
        description: newWorkspace.description
      });
      expect(result).toEqual(mockWorkspace);
    });

    it('should create workspace without description', async () => {
      const name = 'Workspace Without Description';

      mockInvoke.mockResolvedValueOnce({ ...mockWorkspace, name, description: '' });

      const result = await workspaceApi.create(name);

      expect(mockInvoke).toHaveBeenCalledWith('create_workspace', {
        name,
        description: undefined
      });
      expect(result.name).toBe(name);
    });

    it('should handle special characters in workspace name', async () => {
      const specialName = 'Work & Play (2024) - Test!';
      const specialDescription = 'Description with "quotes" and special@chars';

      mockInvoke.mockResolvedValueOnce({
        ...mockWorkspace,
        name: specialName,
        description: specialDescription
      });

      const result = await workspaceApi.create(specialName, specialDescription);

      expect(mockInvoke).toHaveBeenCalledWith('create_workspace', {
        name: specialName,
        description: specialDescription
      });
      expect(result.name).toBe(specialName);
      expect(result.description).toBe(specialDescription);
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('Failed to create workspace');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(workspaceApi.create('Test')).rejects.toThrow('Failed to create workspace');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should get a workspace by id', async () => {
      const id = 'workspace-123';
      mockInvoke.mockResolvedValueOnce(mockWorkspace);

      const result = await workspaceApi.get(id);

      expect(mockInvoke).toHaveBeenCalledWith('get_workspace', { id });
      expect(result).toEqual(mockWorkspace);
    });

    it('should handle null response for non-existent workspace', async () => {
      const id = 'non-existent';
      mockInvoke.mockResolvedValueOnce(null);

      const result = await workspaceApi.get(id);

      expect(mockInvoke).toHaveBeenCalledWith('get_workspace', { id });
      expect(result).toBeNull();
    });

    it('should handle UUID format workspace ids', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      mockInvoke.mockResolvedValueOnce({ ...mockWorkspace, id: uuidId });

      const result = await workspaceApi.get(uuidId);

      expect(mockInvoke).toHaveBeenCalledWith('get_workspace', { id: uuidId });
      expect(result?.id).toBe(uuidId);
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('Failed to get workspace');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(workspaceApi.get('test-id')).rejects.toThrow('Failed to get workspace');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a workspace with all fields', async () => {
      const id = 'workspace-123';
      const name = 'Updated Name';
      const description = 'Updated Description';

      const updatedWorkspace = { ...mockWorkspace, name, description };
      mockInvoke.mockResolvedValueOnce(updatedWorkspace);

      const result = await workspaceApi.update(id, name, description);

      expect(mockInvoke).toHaveBeenCalledWith('update_workspace', { id, name, description });
      expect(result).toEqual(updatedWorkspace);
    });

    it('should update workspace with only name', async () => {
      const id = 'workspace-123';
      const name = 'Only Name Updated';

      const updatedWorkspace = { ...mockWorkspace, name };
      mockInvoke.mockResolvedValueOnce(updatedWorkspace);

      const result = await workspaceApi.update(id, name);

      expect(mockInvoke).toHaveBeenCalledWith('update_workspace', { id, name, description: undefined });
      expect(result.name).toBe('Only Name Updated');
    });

    it('should update with null description', async () => {
      const id = 'workspace-123';
      const name = 'Name with null description';
      const description = null;

      const updatedWorkspace = { ...mockWorkspace, name, description: '' };
      mockInvoke.mockResolvedValueOnce(updatedWorkspace);

      const result = await workspaceApi.update(id, name, description);

      expect(mockInvoke).toHaveBeenCalledWith('update_workspace', { id, name, description });
      expect(result.name).toBe('Name with null description');
      expect(result.description).toBe('');
    });

    it('should handle undefined parameters', async () => {
      const id = 'workspace-123';

      mockInvoke.mockResolvedValueOnce(mockWorkspace);

      const result = await workspaceApi.update(id);

      expect(mockInvoke).toHaveBeenCalledWith('update_workspace', { id, name: undefined, description: undefined });
      expect(result).toEqual(mockWorkspace);
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('Failed to update workspace');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(workspaceApi.update('test-id', 'Test')).rejects.toThrow('Failed to update workspace');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should delete a workspace by id', async () => {
      const id = 'workspace-123';
      mockInvoke.mockResolvedValueOnce(undefined);

      await workspaceApi.delete(id);

      expect(mockInvoke).toHaveBeenCalledWith('delete_workspace', { id });
    });

    it('should handle UUID format workspace ids', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      mockInvoke.mockResolvedValueOnce(undefined);

      await workspaceApi.delete(uuidId);

      expect(mockInvoke).toHaveBeenCalledWith('delete_workspace', { id: uuidId });
    });

    it('should propagate errors from invoke', async () => {
      const error = new Error('Failed to delete workspace');
      mockInvoke.mockRejectedValueOnce(error);

      await expect(workspaceApi.delete('test-id')).rejects.toThrow('Failed to delete workspace');
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of non-existent workspace', async () => {
      const id = 'non-existent';
      // Assuming the backend returns success even if workspace doesn't exist
      mockInvoke.mockResolvedValueOnce(undefined);

      await expect(workspaceApi.delete(id)).resolves.toBeUndefined();
      expect(mockInvoke).toHaveBeenCalledWith('delete_workspace', { id });
    });
  });

  describe('edge cases', () => {
    it('should handle very long workspace names', async () => {
      const longName = 'A'.repeat(500);
      const longDescription = 'B'.repeat(1000);

      mockInvoke.mockResolvedValueOnce({
        ...mockWorkspace,
        name: longName,
        description: longDescription
      });

      const result = await workspaceApi.create(longName, longDescription);

      expect(mockInvoke).toHaveBeenCalledWith('create_workspace', {
        name: longName,
        description: longDescription
      });
      expect(result.name).toBe(longName);
      expect(result.description).toBe(longDescription);
    });

    it('should handle concurrent operations', async () => {
      const promises = [];
      const mockResponses = [];

      for (let i = 0; i < 5; i++) {
        const workspace = { ...mockWorkspace, id: `workspace-${i}` };
        mockResponses.push(workspace);
        mockInvoke.mockResolvedValueOnce(workspace);
        promises.push(workspaceApi.get(`workspace-${i}`));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result?.id).toBe(`workspace-${index}`);
      });
      expect(mockInvoke).toHaveBeenCalledTimes(5);
    });

    it('should handle all parameter types correctly', async () => {
      const id = 'workspace-123';
      const name = undefined;
      const description = 'Description only';

      mockInvoke.mockResolvedValueOnce({ ...mockWorkspace, description });

      const result = await workspaceApi.update(id, name, description);

      expect(mockInvoke).toHaveBeenCalledWith('update_workspace', {
        id,
        name: undefined,
        description
      });
      expect(result.description).toBe('Description only');
    });
  });
});