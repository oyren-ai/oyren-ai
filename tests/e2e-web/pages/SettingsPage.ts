import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  private readonly settingsButton: Locator;
  private readonly settingsView: Locator;
  private readonly settingsTabs: Locator;
  private readonly modelsSettings: Locator;
  private readonly addApiKeyButton: Locator;

  constructor(page: Page) {
    super(page);
    this.settingsButton = page.getByTestId('settings-button');
    this.settingsView = page.getByTestId('settings-view');
    this.settingsTabs = page.getByTestId('settings-tabs');
    this.modelsSettings = page.getByTestId('models-settings');
    this.addApiKeyButton = page.getByTestId('add-api-key-button');
  }

  async navigateToSettings(): Promise<void> {
    await this.settingsButton.click();
    await expect(this.settingsView).toBeVisible({ timeout: 5000 });
  }

  async switchTab(tabName: string): Promise<void> {
    const tab = this.page.getByRole('tab', { name: tabName });
    await tab.click();
  }

  async addApiKey(): Promise<void> {
    await this.addApiKeyButton.click();
  }

  async isModelsSettingsVisible(): Promise<boolean> {
    return await this.modelsSettings.isVisible();
  }

  async isSettingsViewVisible(): Promise<boolean> {
    return await this.settingsView.isVisible();
  }

  async goBack(): Promise<void> {
    const backButton = this.page.getByRole('button', { name: /back/i });
    await backButton.click();
  }

  async apiKeyCardExists(keyId: string): Promise<boolean> {
    const card = this.page.getByTestId(`api-key-card-${keyId}`);
    return await card.isVisible();
  }
}
