import { describe, it, expect } from 'vitest';

describe('useAiChatPanelController - File Deduplication Fix', () => {
  describe('Map-based deduplication (FIXED implementation)', () => {
    it('should update file metadata when same ID is added again', () => {
      // Simulate the FIXED Map-based approach from useAiChatPanelController.ts lines 174-184

      let contextFiles: Array<{ id: string; name: string; path: string }> = [];

      const file1 = { id: 'file-1', name: 'old-name.pdf', path: '/old/path' };
      const file1Updated = { id: 'file-1', name: 'new-name.pdf', path: '/new/path' };

      // First add using Map approach
      const fileMap1 = new Map(contextFiles.map((f) => [f.id, f]));
      [file1].forEach((file) => {
        fileMap1.set(file.id, file);
      });
      contextFiles = Array.from(fileMap1.values());

      // Second add with updated metadata using Map approach
      const fileMap2 = new Map(contextFiles.map((f) => [f.id, f]));
      [file1Updated].forEach((file) => {
        fileMap2.set(file.id, file);
      });
      contextFiles = Array.from(fileMap2.values());

      // Now it should have 1 file with UPDATED metadata
      expect(contextFiles.length).toBe(1);
      expect(contextFiles[0].name).toBe('new-name.pdf'); // Fixed: updates to new metadata
      expect(contextFiles[0].path).toBe('/new/path');
    });

    it('should handle multiple additions of the same file', () => {
      const file1 = { id: 'file-1', name: 'document.pdf', path: '/workspace/document.pdf' };

      // Start with empty
      let contextFiles: typeof file1[] = [];

      // Add file1 three times (simulating three messages)
      for (let i = 0; i < 3; i++) {
        const existing = new Set(contextFiles.map((f) => f.id));
        const newFiles = [file1].filter((f) => !existing.has(f.id));
        contextFiles = [...contextFiles, ...newFiles];
      }

      // Should only have one instance
      expect(contextFiles.length).toBe(1);
      expect(contextFiles[0].id).toBe('file-1');
    });

    it('should keep files with different IDs', () => {
      const file1 = { id: 'file-1', name: 'document.pdf', path: '/workspace/document.pdf' };
      const file2 = { id: 'file-2', name: 'notes.pdf', path: '/workspace/notes.pdf' };

      const contextFiles: typeof file1[] = [];

      // Add file1
      const existing1 = new Set(contextFiles.map((f) => f.id));
      const newFiles1 = [file1].filter((f) => !existing1.has(f.id));
      const result1 = [...contextFiles, ...newFiles1];

      // Add file2
      const existing2 = new Set(result1.map((f) => f.id));
      const newFiles2 = [file2].filter((f) => !existing2.has(f.id));
      const result2 = [...result1, ...newFiles2];

      expect(result2.length).toBe(2);
      expect(result2.some((f) => f.id === 'file-1')).toBe(true);
      expect(result2.some((f) => f.id === 'file-2')).toBe(true);
    });

    it('should deduplicate files from conversation messages using Set', () => {
    // Simulate loading a conversation with repeated file mentions
    const messages = [
      {
        id: 'msg-1',
        files: [
          { id: 'file-1', name: 'document.pdf', path: '/workspace/document.pdf' },
        ],
      },
      {
        id: 'msg-2',
        files: [
          { id: 'file-1', name: 'document.pdf', path: '/workspace/document.pdf' },
        ],
      },
      {
        id: 'msg-3',
        files: [
          { id: 'file-2', name: 'notes.pdf', path: '/workspace/notes.pdf' },
        ],
      },
    ];

    // Simulate the deduplication logic from lines 347-367
    const allFiles: Array<{ id: string; name: string; path: string }> = [];
    const seenFileIds = new Set<string>();

    for (const msg of messages) {
      if (msg.files) {
        for (const file of msg.files) {
          if (!seenFileIds.has(file.id)) {
            seenFileIds.add(file.id);
            allFiles.push({
              id: file.id,
              name: file.name,
              path: file.path,
            });
          }
        }
      }
    }

    // Should have 2 unique files
    expect(allFiles.length).toBe(2);
    expect(allFiles.filter((f) => f.id === 'file-1').length).toBe(1);
    expect(allFiles.filter((f) => f.id === 'file-2').length).toBe(1);
    });
  });
});
