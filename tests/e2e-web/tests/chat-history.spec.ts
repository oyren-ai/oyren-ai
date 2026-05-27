import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { ChatPage } from '../pages/ChatPage';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Conversation History', () => {
    let workspacePage: WorkspacePage;
    let chatPage: ChatPage;
    const logPath = path.join(process.cwd(), 'chat-history-debug.log');

    test.beforeEach(async ({ page }) => {
        if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
        const log = (msg: string) => fs.appendFileSync(logPath, msg + '\n');

        workspacePage = new WorkspacePage(page);
        chatPage = new ChatPage(page);

        // Capture browser logs for debugging
        page.on('console', msg => {
            if (msg.text().includes('[IPC]') || msg.text().includes('[useConversationSync]')) {
                log('BROWSER: ' + msg.text());
            }
        });

        await setupTauriInternalMocks(page);
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
        await page.addInitScript((token) => {
            localStorage.setItem('oyren_auth_token', token);
        }, mockToken);
        await page.goto('/');

        await workspacePage.createWorkspace({ name: 'History Test WS' });
        await chatPage.openChat();
        await chatPage.selectModel('GPT-4');
    });

    test('should create, list and switch between conversations', async ({ page }) => {
        // Step 1: Create first conversation by sending a message
        const firstMessage = 'First Chat Message';
        await chatPage.sendMessageAndWaitForResponse(firstMessage);

        // Wait for conversation sync to complete
        await chatPage.waitForConversationSync();

        // Step 2: Start a new conversation
        await chatPage.createNewChat();

        // Step 3: Verify second chat is empty
        await chatPage.verifyChatIsEmpty();

        // Step 4: Send a message in second conversation
        const secondMessage = 'Second Chat Message';
        await chatPage.sendMessageAndWaitForResponse(secondMessage);

        // Wait for conversation sync to complete
        await chatPage.waitForConversationSync();

        // Step 5: Switch back to first conversation via history
        await chatPage.switchToConversation(firstMessage);

        // Step 6: Verify first message is visible and second message is not
        await chatPage.verifyMessageVisible(firstMessage);
        await chatPage.verifyMessageNotVisible(secondMessage);
    });
});
