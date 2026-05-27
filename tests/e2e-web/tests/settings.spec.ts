import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { SettingsPage } from '../pages/SettingsPage';

test.describe('Settings', () => {
  let settingsPage: SettingsPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    await setupTauriInternalMocks(page);

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.sig';
    await page.addInitScript((token) => {
      localStorage.setItem('oyren_auth_token', token);
    }, mockToken);

    await settingsPage.navigateTo('/');
    await page.waitForSelector('[data-testid="home-page"]', { timeout: 10000 });
  });

  test('should navigate to settings', async () => {
    await settingsPage.navigateToSettings();
    const isVisible = await settingsPage.isSettingsViewVisible();
    expect(isVisible).toBe(true);
  });

  test('should switch to Models tab', async () => {
    await settingsPage.navigateToSettings();
    await settingsPage.switchTab('Models');

    const isModelsVisible = await settingsPage.isModelsSettingsVisible();
    expect(isModelsVisible).toBe(true);
  });

  test('should display API key cards', async () => {
    await settingsPage.navigateToSettings();
    await settingsPage.switchTab('Models');

    const hasCard = await settingsPage.apiKeyCardExists('pk-1');
    expect(hasCard).toBe(true);
  });

  test('should switch between all tabs', async ({ page }) => {
    await settingsPage.navigateToSettings();

    for (const tabName of ['Models', 'Memory', 'Docs', 'General']) {
      await settingsPage.switchTab(tabName);
      const tab = page.getByRole('tab', { name: tabName });
      await expect(tab).toHaveAttribute('data-state', 'active');
    }
  });
});
