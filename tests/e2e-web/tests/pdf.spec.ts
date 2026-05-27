import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { PdfPage } from '../pages/PdfPage';

test.describe('PDF Viewer', () => {
    let workspacePage: WorkspacePage;
    let pdfPage: PdfPage;

    test.beforeEach(async ({ page }) => {
        workspacePage = new WorkspacePage(page);
        pdfPage = new PdfPage(page);

        await setupTauriInternalMocks(page);
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
        await page.addInitScript((token) => {
            localStorage.setItem('oyren_auth_token', token);
        }, mockToken);
        await page.goto('/');
    });

    test('should render PDF viewer when file is clicked', async ({ page }) => {
        await workspacePage.createWorkspace({ name: 'PDF Test Workspace' });
        await workspacePage.waitForWorkspaceView();

        await pdfPage.openSamplePdf();
        await pdfPage.waitForPdfViewer();
    });
});
