import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ChatPage extends BasePage {
  // Locators
  private readonly chatInput: Locator;
  private readonly sendButton: Locator;
  private readonly messagesList: Locator;
  private readonly aiChatButton: Locator;
  private readonly modelSelector: Locator;
  private readonly chatHeader: Locator;
  private readonly chatEmptyState: Locator;
  private readonly newChatButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.chatInput = page.locator('textarea').first();
    this.sendButton = page.getByRole('button', { name: 'Send' });
    this.messagesList = page.getByTestId('messages-list');
    this.aiChatButton = page.getByRole('button', { name: 'AI Chat' });
    this.modelSelector = page.getByRole('combobox').first();
    this.chatHeader = page.getByTestId('chat-header');
    this.chatEmptyState = page.getByText('No conversation yet');
    this.newChatButton = page.getByTestId('new-chat-button');
  }


  async openChat(): Promise<void> {
    await this.aiChatButton.click();
    await this.waitForChatReady();
  }


  async waitForChatReady(timeout: number = 10000): Promise<void> {
    // Wait for chat input to be visible (indicating chat panel is open and ready)
    await expect(this.chatInput).toBeVisible({ timeout });
  }


  async sendMessage(message: string): Promise<void> {
    await this.chatInput.fill(message);
    await this.sendButton.click();
  }


  async sendMessageAndWaitForResponse(message: string, timeout: number = 15000): Promise<void> {
    await this.sendMessage(message);

    await expect(this.messagesList).toContainText(message, { timeout });

    const expectedResponse = `Mock response to: ${message}`;
    await expect(this.messagesList).toContainText(expectedResponse, { timeout });
  }

  async isChatInputVisible(): Promise<boolean> {
    return await this.chatInput.isVisible();
  }

  async isSendButtonEnabled(): Promise<boolean> {
    return await this.sendButton.isEnabled();
  }

  async getChatInputValue(): Promise<string> {
    return await this.chatInput.inputValue();
  }


  async clearChatInput(): Promise<void> {
    await this.chatInput.clear();
  }

  async waitForMessagesList(timeout: number = 5000): Promise<void> {
    await expect(this.messagesList).toBeVisible({ timeout });
  }


  async messageExists(message: string): Promise<boolean> {
    try {
      await expect(this.messagesList).toContainText(message, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async getAllMessages(): Promise<string[]> {
    const messageElements = await this.messagesList.locator('[data-testid*="message"]').all();
    const messages: string[] = [];

    for (const element of messageElements) {
      const text = await element.textContent();
      if (text) {
        messages.push(text.trim());
      }
    }

    return messages;
  }

  async selectModel(modelDisplayName: string): Promise<void> {
    await this.modelSelector.click();
    await this.page.getByRole('option', { name: modelDisplayName }).click();
  }


  async getCurrentModel(): Promise<string | null> {
    return await this.modelSelector.inputValue();
  }

  async hasModelOptions(): Promise<boolean> {
    const options = await this.modelSelector.locator('option').all();
    return options.length > 0;
  }

  async isConnected(): Promise<boolean> {
    return await this.chatHeader.getByText('AI Ready').isVisible();
  }

  async waitForConnection(timeout: number = 10000): Promise<void> {
    await expect(this.chatHeader.getByText('AI Ready')).toBeVisible({ timeout });
  }


  async isChatEmpty(): Promise<boolean> {
    return await this.chatEmptyState.isVisible();
  }

  async getChatHeaderText(): Promise<string | null> {
    try {
      return await this.chatHeader.textContent();
    } catch {
      return null;
    }
  }

  async sendMessageWithKeyboard(message: string): Promise<void> {
    await this.chatInput.fill(message);
    await this.chatInput.press('Enter');
  }

  async typeMessageSlowly(message: string, delay: number = 100): Promise<void> {
    await this.chatInput.click();
    await this.page.keyboard.type(message, { delay });
  }

  async clearConversation(): Promise<void> {
    const clearBtn = this.page.getByRole('button', { name: 'Clear' });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();

      const confirmBtn = this.page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  }

  async hasMessages(): Promise<boolean> {
    return !(await this.isChatEmpty());
  }

  async getMessageCount(): Promise<number> {
    try {
      const messages = await this.messagesList.locator('[data-testid*="message"]').all();
      return messages.length;
    } catch {
      return 0;
    }
  }

  async waitForNewMessage(timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector('[data-testid*="message"]:last-child', { timeout });
  }

  async dispatchImageEvent(imageData: string): Promise<void> {
    await this.page.evaluate((data) => {
      window.dispatchEvent(new CustomEvent('add-image-to-chat', {
        detail: {
          imageData: data,
          width: 100,
          height: 100,
          timestamp: new Date().toISOString()
        }
      }));
    }, imageData);
  }

  async waitForImageAdded(count: number = 1): Promise<void> {
    const text = count === 1 ? '1 image' : `${count} images`;
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 10000 });
  }


  async openHistory(): Promise<void> {
    // Click the menu button (three dots)
    const menuButton = this.page.getByTestId('menu-button');
    await menuButton.click();
    // Wait for menu to open
    await this.page.waitForTimeout(500);
  }

  async selectHistoryItem(title: string): Promise<void> {
    // Click on the conversation in the dropdown menu
    const conversationItem = this.page.getByText(title);
    await conversationItem.click();
    // Wait for menu to close
    await this.page.waitForTimeout(500);
  }


  async createNewChat(): Promise<void> {
    await this.newChatButton.click();
    await expect(this.chatEmptyState).toBeVisible();
  }


  async verifyMessageVisible(message: string, timeout: number = 5000): Promise<void> {
    await expect(this.messagesList).toContainText(message, { timeout });
  }

  async verifyMessageNotVisible(message: string): Promise<void> {
    await expect(this.messagesList).not.toContainText(message);
  }


  async verifyChatIsEmpty(): Promise<void> {
    await expect(this.chatEmptyState).toBeVisible();
  }

  async switchToConversation(title: string): Promise<void> {
    await this.openHistory();
    await this.selectHistoryItem(title);
  }


  async waitForConversationSync(timeout: number = 2000): Promise<void> {
    await this.page.waitForTimeout(timeout);
  }
}
