export interface WorkspaceData {
  name: string;
  description?: string;
}

export interface WorkspaceTestData extends WorkspaceData {
  expectedId?: string;
}

export const workspaceTestData = {
  basic: {
    name: 'Basic Test Workspace',
    description: 'A simple workspace for basic testing'
  },

  complex: {
    name: 'Complex Test Workspace',
    description: 'Workspace with multiple files and complex setup'
  },

  empty: {
    name: 'Empty Workspace',
    description: 'Workspace with no files'
  },

  longName: {
    name: 'Very Long Workspace Name That Tests Input Validation And UI Layout',
    description: 'Testing workspace with very long name and description fields to ensure UI handles it properly without breaking layout or functionality'
  },

  specialChars: {
    name: 'Workspace_123!@#$%^&*()',
    description: 'Testing special characters: éñüñüñ, 中文, русский, العربية'
  },

  minimal: {
    name: 'A',
    description: ''
  }
};

export const workspaceResponses = {
  createSuccess: (data: WorkspaceData) => ({
    id: 'ws-' + Math.random().toString(36).substr(2, 9),
    name: data.name,
    description: data.description || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_accessed_at: new Date().toISOString(),
    is_pinned: false,
    is_archived: false,
    is_favourite: false,
    is_active: true,
    document_count: 0,
    chat_count: 0
  }),

  listSuccess: [
    {
      id: 'ws-1',
      name: 'Sample Workspace',
      description: 'Auto-generated workspace',
      created_at: '2024-01-01T00:00:00Z',
      document_count: 1,
      chat_count: 0
    }
  ]
};




