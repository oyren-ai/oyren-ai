import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }


  async waitForPageLoad(timeout: number = 10000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async waitForElement(locator: Locator, timeout: number = 5000): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }


  async waitForElementHidden(locator: Locator, timeout: number = 5000): Promise<void> {
    await expect(locator).toBeHidden({ timeout });
  }

  async clickAndWait(locator: Locator, waitForNavigation: boolean = false): Promise<void> {
    if (waitForNavigation) {
      await Promise.all([
        this.page.waitForLoadState('networkidle'),
        locator.click()
      ]);
    } else {
      await locator.click();
    }
  }

  async fillInput(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  async clearAndFillInput(locator: Locator, value: string): Promise<void> {
    await locator.clear();
    await locator.fill(value);
  }


  async selectOption(locator: Locator, value: string): Promise<void> {
    await locator.selectOption(value);
  }

  async getText(locator: Locator): Promise<string> {
    return await locator.textContent() || '';
  }

  async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  async isEnabled(locator: Locator): Promise<boolean> {
    return await locator.isEnabled();
  }

  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  async waitForUrl(url: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForURL(url, { timeout });
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  getCurrentUrl(): string {
    return this.page.url();
  }


  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async typeText(text: string, delay: number = 0): Promise<void> {
    await this.page.keyboard.type(text, { delay });
  }

  async hover(locator: Locator): Promise<void> {
    await locator.hover();
  }

  async doubleClick(locator: Locator): Promise<void> {
    await locator.dblclick();
  }


  async rightClick(locator: Locator): Promise<void> {
    await locator.click({ button: 'right' });
  }


  async dragAndDrop(source: Locator, target: Locator): Promise<void> {
    await source.dragTo(target);
  }

  async handleDialog(action: 'accept' | 'dismiss' = 'accept'): Promise<void> {
    this.page.on('dialog', async dialog => {
      if (action === 'accept') {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }


  async executeScript<T>(script: string): Promise<T> {
    return await this.page.evaluate(script);
  }

  async addScript(script: string): Promise<void> {
    await this.page.addScriptTag({ content: script });
  }

  async waitForCondition(condition: () => Promise<boolean>, timeout: number = 5000): Promise<void> {
    await this.page.waitForFunction(condition, undefined, { timeout });
  }
}




