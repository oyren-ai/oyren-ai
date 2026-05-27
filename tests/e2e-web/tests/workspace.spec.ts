import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { workspaceTestData } from '../test-data/workspaces';

test.describe('Workspace Management', () => {
    let workspacePage: WorkspacePage;

    test.beforeEach(async ({ page }) => {
        workspacePage = new WorkspacePage(page);
        await setupTauriInternalMocks(page);

        // Force auth with valid-looking JWT
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
        await page.addInitScript((token) => {
            localStorage.setItem('oyren_auth_token', token);
        }, mockToken);

        await workspacePage.navigateTo('/');
        await workspacePage.waitForHomePage();
    });

    test('should create a new workspace', async ({ page }) => {
        const data = {
            name: 'My New Workspace',
            description: 'Auto-generated test workspace'
        };

        await workspacePage.createWorkspace(data);

        // Verify dialog is closed
        const isDialogVisible = await workspacePage.isCreateDialogVisible();
        expect(isDialogVisible).toBe(false);
    });
});
