/** @vitest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useFileActions } from "../useFileActions";
import { workspaceFilesApi } from "@/api/workspaceFilesApi";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import type { WorkspaceFile } from "@/types/workspace";

vi.mock("@/api/workspaceFilesApi", () => ({
  workspaceFilesApi: {
    removeFile: vi.fn(),
    updateFileName: vi.fn(),
    readFile: vi.fn(),
  },
}));

const mockFile: WorkspaceFile = {
  id: "file-1",
  workspace_id: "ws-1",
  file_name: "test.pdf",
  file_path: "/path/to/test.pdf",
  file_type: "pdf",
  metadata: null,
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

describe("useFileActions - handleCopyContent", () => {
  const defaultOptions = {
    currentPdfPath: null,
    closePdfTab: vi.fn(),
    setError: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reads file content and copies to clipboard", async () => {
    vi.mocked(workspaceFilesApi.readFile).mockResolvedValue("file content here");
    const { result } = renderHook(() => useFileActions(defaultOptions));

    await act(async () => {
      await result.current.handleCopyContent(mockFile);
    });

    expect(workspaceFilesApi.readFile).toHaveBeenCalledWith("file-1");
    expect(writeText).toHaveBeenCalledWith("file content here");
  });

  it("sets error when readFile fails", async () => {
    vi.mocked(workspaceFilesApi.readFile).mockRejectedValue(new Error("read failed"));
    const setError = vi.fn();
    const { result } = renderHook(() => useFileActions({ ...defaultOptions, setError }));

    await act(async () => {
      await result.current.handleCopyContent(mockFile);
    });

    expect(setError).toHaveBeenCalledWith("Failed to copy content. Please try again.");
  });
});
