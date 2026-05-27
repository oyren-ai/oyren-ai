import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ArxivSearchPage extends BasePage {
  private readonly arxivPanelButton: Locator;
  private readonly searchPanel: Locator;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly searchResults: Locator;
  private readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.arxivPanelButton = page.getByTestId('right-panel-arxiv-search');
    this.searchPanel = page.getByTestId('arxiv-search-panel');
    this.searchInput = page.getByTestId('arxiv-search-input');
    this.searchButton = page.getByTestId('arxiv-search-button');
    this.searchResults = page.getByTestId('arxiv-search-results');
    this.emptyState = page.getByTestId('arxiv-empty-state');
  }

  async openArxivPanel(): Promise<void> {
    await this.arxivPanelButton.click();
    await expect(this.searchPanel).toBeVisible({ timeout: 5000 });
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async waitForResults(): Promise<void> {
    await expect(this.searchResults).toBeVisible({ timeout: 10000 });
  }

  async savePaper(paperId: string): Promise<void> {
    const saveButton = this.page.getByTestId(`arxiv-save-button-${paperId}`);
    await saveButton.click();
  }

  async paperCardExists(paperId: string): Promise<boolean> {
    const card = this.page.getByTestId(`arxiv-paper-card-${paperId}`);
    return await card.isVisible();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  async isPanelVisible(): Promise<boolean> {
    return await this.searchPanel.isVisible();
  }
}