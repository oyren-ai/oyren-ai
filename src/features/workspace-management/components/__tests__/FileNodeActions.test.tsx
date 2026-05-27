/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileNodeActions } from "../FileNodeActions";
import type { WorkspaceFile } from "@/types/workspace";

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

afterEach(() => vi.restoreAllMocks());

describe("FileNodeActions - Copy Content", () => {
  it("renders Copy Content menu item", async () => {
    const user = userEvent.setup();
    render(<FileNodeActions fileData={mockFile} />);

    await user.click(screen.getByTestId("file-actions-trigger"));

    expect(screen.getByTestId("copy-content-btn")).toBeInTheDocument();
    expect(screen.getByText("Copy Content")).toBeInTheDocument();
  });

  it("calls onCopyContent when Copy Content is clicked", async () => {
    const user = userEvent.setup();
    const onCopyContent = vi.fn();
    render(<FileNodeActions fileData={mockFile} onCopyContent={onCopyContent} />);

    await user.click(screen.getByTestId("file-actions-trigger"));
    await user.click(screen.getByTestId("copy-content-btn"));

    expect(onCopyContent).toHaveBeenCalledWith(mockFile);
  });
});