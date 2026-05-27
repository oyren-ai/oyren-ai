import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { PdfPage } from '../pages/PdfPage';

test.describe('PDF Search', () => {
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

        await workspacePage.navigateTo('/');

        // Create a workspace and open the sample PDF
        await workspacePage.createWorkspace({ name: 'Search Test Workspace' });
        await pdfPage.openSamplePdf();
    });

    test('should find matches for a keyword', async ({ page }) => {
        // Perform search
        await pdfPage.searchInPdf('Mock');

        // Verify matches count appears
        await pdfPage.waitForSearchResults();
        const resultCount = await pdfPage.getSearchResultCount();
        expect(resultCount).toContain('1 of 1');

        // Verify snippet content is visible
        await expect(page.getByText('This is some Mock PDF Content for testing.')).toBeVisible();

        // Clear search
        await pdfPage.clearPdfSearch();
        const searchInput = page.getByPlaceholder('Type to search...');
        await expect(searchInput).toHaveValue('');
    });
});
