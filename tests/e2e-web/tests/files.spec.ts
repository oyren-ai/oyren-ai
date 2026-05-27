import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { FileManagerPage } from '../pages/FileManagerPage';

test.describe('File Management', () => {
    let workspacePage: WorkspacePage;
    let fileManagerPage: FileManagerPage;

    test.beforeEach(async ({ page }) => {
        workspacePage = new WorkspacePage(page);
        fileManagerPage = new FileManagerPage(page);

        await setupTauriInternalMocks(page);
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
        await page.addInitScript((token) => {
            localStorage.setItem('oyren_auth_token', token);
        }, mockToken);

        await workspacePage.navigateTo('/');

        // Create a workspace to work in
        await workspacePage.createWorkspace({ name: 'File Test Workspace' });

        // Wait for workspace and file to be ready
        await workspacePage.waitForWorkspaceView();
        await expect(fileManagerPage.getFileNode('sample.pdf')).toBeVisible({ timeout: 5000 });
    });

    test('should rename a file', async ({ page }) => {
        await fileManagerPage.renameFile('sample.pdf', 'renamed-doc');

        // Verify result
        await expect(fileManagerPage.getFileNode('renamed-doc.pdf')).toBeVisible();
    });

    test('should delete a file', async ({ page }) => {
        await fileManagerPage.deleteFile('sample.pdf');

        // Verify file is gone from list
        await fileManagerPage.verifyNoFilesMessage();
    });
});
