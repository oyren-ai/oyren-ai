import { vi } from 'vitest';

export const workspaceApi = {
  list: vi.fn(),
  list_for_display: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  get: vi.fn(),
};
