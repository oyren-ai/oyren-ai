import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { PdfPage } from '../pages/PdfPage';
import { ChatPage } from '../pages/ChatPage';

test.describe('AI Chat with PDF Snippets', () => {
    let workspacePage: WorkspacePage;
    let pdfPage: PdfPage;
    let chatPage: ChatPage;

    test.beforeEach(async ({ page }) => {
        workspacePage = new WorkspacePage(page);
        pdfPage = new PdfPage(page);
        chatPage = new ChatPage(page);

        await setupTauriInternalMocks(page);
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
        await page.addInitScript((token) => {
            localStorage.setItem('oyren_auth_token', token);
        }, mockToken);

        await workspacePage.navigateTo('/');

        // Create a workspace and open the sample PDF
        await workspacePage.createWorkspace({ name: 'Snippet Test Workspace' });
        await pdfPage.openSamplePdf();

        // Ensure AI Chat is active and ready
        await chatPage.openChat();

        // Select a model from mock
        await chatPage.selectModel('GPT-4');
    });

    test('should capture a snippet and add it to chat', async ({ page }) => {
        // Step 1: Open snippet mode
        const snippetBtn = page.getByRole('button', { name: 'AI Snippet' });
        await snippetBtn.click();
        await expect(page.getByTestId('snippet-overlay')).toBeVisible();

        // Step 2: Manually dispatch the image event
        const mockImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        await chatPage.dispatchImageEvent(mockImage);

        // Step 3: Verify snippet is added to chat input
        await chatPage.waitForImageAdded(1);
        await expect(page.getByAltText('Pending snippet 1')).toBeVisible();

        // Step 4: Send a message with the snippet
        await chatPage.sendMessageAndWaitForResponse('Check this image');
    });
});
