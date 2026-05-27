import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { ChatPage } from '../pages/ChatPage';

test.describe('Conversation Management', () => {
  let workspacePage: WorkspacePage;
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    workspacePage = new WorkspacePage(page);
    chatPage = new ChatPage(page);
    await setupTauriInternalMocks(page);

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.sig';
    await page.addInitScript((token) => {
      localStorage.setItem('oyren_auth_token', token);
    }, mockToken);

    await workspacePage.navigateTo('/');
    await workspacePage.waitForHomePage();
    await workspacePage.createWorkspaceAndNavigate({ name: 'Conv Test', description: 'Testing' });
  });

  test('should create a conversation via chat', async () => {
    await chatPage.openChat();
    await chatPage.sendMessageAndWaitForResponse('Hello AI');
    const hasMessages = await chatPage.hasMessages();
    expect(hasMessages).toBe(true);
  });

  test('should open chat history', async () => {
    await chatPage.openChat();
    await chatPage.sendMessageAndWaitForResponse('Hello AI');
    await chatPage.openHistory();
  });

  test('should send multiple messages in conversation', async () => {
    await chatPage.openChat();
    await chatPage.sendMessageAndWaitForResponse('First message');
    await chatPage.sendMessageAndWaitForResponse('Second message');

    const count = await chatPage.getMessageCount();
    expect(count).toBeGreaterThanOrEqual(4); // 2 user + 2 AI
  });
});