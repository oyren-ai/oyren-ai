import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ConversationHistoryPage extends BasePage {
  private readonly historyView: Locator;
  private readonly listSidebar: Locator;
  private readonly detailPanel: Locator;
  private readonly pinButton: Locator;
  private readonly exportButton: Locator;
  private readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.historyView = page.getByTestId('conversation-history-view');
    this.listSidebar = page.getByTestId('conversation-list-sidebar');
    this.detailPanel = page.getByTestId('conversation-detail-panel');
    this.pinButton = page.getByTestId('conversation-detail-pin-button');
    this.exportButton = page.getByTestId('conversation-detail-export-button');
    this.deleteButton = page.getByTestId('conversation-detail-delete-button');
  }

  async selectConversation(conversationId: string): Promise<void> {
    const item = this.page.getByTestId(`conversation-item-${conversationId}`);
    await item.click();
    await expect(this.detailPanel).toBeVisible({ timeout: 5000 });
  }

  async pinConversation(conversationId: string): Promise<void> {
    const pinBtn = this.page.getByTestId(`pin-conversation-${conversationId}`);
    await pinBtn.click();
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const deleteBtn = this.page.getByTestId(`delete-conversation-${conversationId}`);
    await deleteBtn.click();
  }

  async confirmDelete(): Promise<void> {
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  async exportConversation(): Promise<void> {
    await this.exportButton.click();
  }

  async getConversationCount(): Promise<number> {
    const items = await this.page.locator('[data-testid^="conversation-item-"]').all();
    return items.length;
  }

  async isDetailPanelVisible(): Promise<boolean> {
    return await this.detailPanel.isVisible();
  }

  async isHistoryViewVisible(): Promise<boolean> {
    return await this.historyView.isVisible();
  }
}