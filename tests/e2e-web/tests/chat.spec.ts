import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { ChatPage } from '../pages/ChatPage';

test.describe('AI Chat', () => {
    let workspacePage: WorkspacePage;
    let chatPage: ChatPage;

    test.beforeEach(async ({ page }) => {
        workspacePage = new WorkspacePage(page);
        chatPage = new ChatPage(page);

        await setupTauriInternalMocks(page);
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
        await page.addInitScript((token) => {
            localStorage.setItem('oyren_auth_token', token);
        }, mockToken);
        await page.goto('/');
    });

    test('should send a message and receive response', async ({ page }) => {
        await workspacePage.createWorkspace({ name: 'Chat Test WS' });

        await chatPage.openChat();
        await chatPage.selectModel('GPT-4');

        await chatPage.sendMessageAndWaitForResponse('Hello AI');
    });
});
