import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';

test.describe('Workspace Management - Edit & Delete', () => {
  let workspacePage: WorkspacePage;

  test.beforeEach(async ({ page }) => {
    workspacePage = new WorkspacePage(page);
    await setupTauriInternalMocks(page);

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.sig';

    // Seed a workspace in the mock state before page loads
    await page.addInitScript((token) => {
      localStorage.setItem('oyren_auth_token', token);

      // Wait for mock state to be available, then seed it
      const seedInterval = setInterval(() => {
        const state = (window as any).__MOCK_STATE__;
        if (state) {
          clearInterval(seedInterval);
          state.workspaces.push({
            id: 'ws-seed-1', name: 'Test WS', description: 'For testing',
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            is_pinned: false, is_archived: false, is_favourite: false, is_active: true,
            document_count: 0, chat_count: 0,
          });
        }
      }, 10);
    }, mockToken);

    await workspacePage.navigateTo('/');
    await workspacePage.waitForHomePage();
  });

  test('should show seeded workspace card', async ({ page }) => {
    const card = page.locator('[data-testid^="workspace-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });
  });

  test('should open edit workspace dialog', async ({ page }) => {
    const card = page.locator('[data-testid^="workspace-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    await page.getByTestId('workspace-menu-button').first().click();
    await page.getByTestId('workspace-edit-button').click();

    await expect(page.getByTestId('edit-workspace-dialog')).toBeVisible();
  });

  test('should open delete workspace dialog', async ({ page }) => {
    const card = page.locator('[data-testid^="workspace-card-"]').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    await page.getByTestId('workspace-menu-button').first().click();
    await page.getByTestId('workspace-delete-button').click();

    await expect(page.getByTestId('delete-workspace-dialog')).toBeVisible();
  });
});