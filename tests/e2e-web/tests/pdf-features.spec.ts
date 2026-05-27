import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';

test.describe('PDF Features', () => {
  let workspacePage: WorkspacePage;

  test.beforeEach(async ({ page }) => {
    workspacePage = new WorkspacePage(page);
    await setupTauriInternalMocks(page);

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.sig';
    await page.addInitScript((token) => {
      localStorage.setItem('oyren_auth_token', token);
    }, mockToken);

    await workspacePage.navigateTo('/');
    await workspacePage.waitForHomePage();
    await workspacePage.createWorkspaceAndNavigate({ name: 'PDF Test', description: 'Testing' });
  });

  test('should show workspace sidebar after navigating', async ({ page }) => {
    const sidebar = page.getByTestId('workspaces-sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('should display right panel buttons', async ({ page }) => {
    const chatBtn = page.getByTestId('right-panel-ai-chat');
    const notesBtn = page.getByTestId('right-panel-mdx-notes');
    const arxivBtn = page.getByTestId('right-panel-arxiv-search');

    await expect(chatBtn).toBeVisible();
    await expect(notesBtn).toBeVisible();
    await expect(arxivBtn).toBeVisible();
  });

  test('should toggle between right panel tabs', async ({ page }) => {
    const chatBtn = page.getByTestId('right-panel-ai-chat');
    const notesBtn = page.getByTestId('right-panel-mdx-notes');

    await chatBtn.click();
    await page.waitForTimeout(500);

    await notesBtn.click();
    await page.waitForTimeout(500);

    // Clicking notes should show notes panel
    const notesPanel = page.getByTestId('notes-panel');
    await expect(notesPanel).toBeVisible({ timeout: 5000 });
  });
});