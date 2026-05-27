import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModalProvider, useSettingsModal, useCreateWorkspaceModal, ModalType, useModal } from '../ModalContext';

describe('ModalContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when used outside provider', () => {
    const { result } = renderHook(() => {
      try {
        return useSettingsModal();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toBe('useModal must be used within ModalProvider');
  });

  it('should provide default values', () => {
    const { result: settingsResult } = renderHook(() => useSettingsModal(), {
      wrapper: ModalProvider,
    });
    const { result: createWorkspaceResult } = renderHook(() => useCreateWorkspaceModal(), {
      wrapper: ModalProvider,
    });

    expect(settingsResult.current.isOpen).toBe(false);
    expect(createWorkspaceResult.current.isOpen).toBe(false);
  });

  it('should open settings modal', () => {
    const { result } = renderHook(() => useSettingsModal(), {
      wrapper: ModalProvider,
    });

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close settings modal', () => {
    const { result } = renderHook(() => useSettingsModal(), {
      wrapper: ModalProvider,
    });

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should open create workspace dialog', () => {
    const { result } = renderHook(() => useCreateWorkspaceModal(), {
      wrapper: ModalProvider,
    });

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close create workspace dialog', () => {
    const { result } = renderHook(() => useCreateWorkspaceModal(), {
      wrapper: ModalProvider,
    });

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should only show one modal at a time', () => {
    const { result } = renderHook(() => ({
      settings: useSettingsModal(),
      createWorkspace: useCreateWorkspaceModal(),
    }), {
      wrapper: ModalProvider,
    });

    // Open settings first
    act(() => {
      result.current.settings.open();
    });

    expect(result.current.settings.isOpen).toBe(true);
    expect(result.current.createWorkspace.isOpen).toBe(false);

    // Open create workspace - should close settings
    act(() => {
      result.current.createWorkspace.open();
    });

    expect(result.current.settings.isOpen).toBe(false);
    expect(result.current.createWorkspace.isOpen).toBe(true);

    // Open settings again - should close create workspace
    act(() => {
      result.current.settings.open();
    });

    expect(result.current.settings.isOpen).toBe(true);
    expect(result.current.createWorkspace.isOpen).toBe(false);
  });

  it('should handle multiple open/close cycles', () => {
    const { result: settingsResult } = renderHook(() => useSettingsModal(), {
      wrapper: ModalProvider,
    });
    const { result: createWorkspaceResult } = renderHook(() => useCreateWorkspaceModal(), {
      wrapper: ModalProvider,
    });

    // First cycle - settings
    act(() => {
      settingsResult.current.open();
    });
    expect(settingsResult.current.isOpen).toBe(true);

    act(() => {
      settingsResult.current.close();
    });
    expect(settingsResult.current.isOpen).toBe(false);

    // Second cycle - create workspace
    act(() => {
      createWorkspaceResult.current.open();
    });
    expect(createWorkspaceResult.current.isOpen).toBe(true);

    act(() => {
      createWorkspaceResult.current.close();
    });
    expect(createWorkspaceResult.current.isOpen).toBe(false);

    // Both should remain closed
    expect(settingsResult.current.isOpen).toBe(false);
    expect(createWorkspaceResult.current.isOpen).toBe(false);
  });

  describe('New Hook Structure', () => {
    it('should work with useSettingsModal hook', () => {
      const { result } = renderHook(() => useSettingsModal(), {
        wrapper: ModalProvider,
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should work with useCreateWorkspaceModal hook', () => {
      const { result } = renderHook(() => useCreateWorkspaceModal(), {
        wrapper: ModalProvider,
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should work with generic useModal hook', () => {
      const { result } = renderHook(() => useModal(ModalType.Settings), {
        wrapper: ModalProvider,
      });

      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should only allow one modal open at a time with new hooks', () => {
      const { result } = renderHook(() => ({
        settings: useSettingsModal(),
        createWorkspace: useCreateWorkspaceModal(),
      }), {
        wrapper: ModalProvider,
      });

      // Open settings
      act(() => {
        result.current.settings.open();
      });

      expect(result.current.settings.isOpen).toBe(true);
      expect(result.current.createWorkspace.isOpen).toBe(false);

      // Open create workspace (should close settings)
      act(() => {
        result.current.createWorkspace.open();
      });

      expect(result.current.settings.isOpen).toBe(false);
      expect(result.current.createWorkspace.isOpen).toBe(true);
    });
  });
});