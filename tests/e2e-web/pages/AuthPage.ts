import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';


export class AuthPage extends BasePage {
  // Locators
  private readonly homePage: Locator;
  private readonly workspacesHeading: Locator;
  private readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.homePage = page.getByTestId('home-page');
    this.workspacesHeading = page.getByRole('heading', { name: 'Workspaces', exact: true });
    this.logoutButton = page.getByRole('button', { name: 'Logout' }); // TODO: Update when logout button is implemented
  }

  async loginWithToken(token: string): Promise<void> {
    await this.page.addInitScript((authToken) => {
      localStorage.setItem('oyren_auth_token', authToken);
    }, token);
  }

  async navigateToHome(): Promise<void> {
    await this.page.goto('/');
  }

  async loginAndNavigateToHome(token: string): Promise<void> {
    await this.loginWithToken(token);
    await this.navigateToHome();
    await this.waitForHomePage();
  }

 
  async waitForHomePage(timeout: number = 10000): Promise<void> {
    await expect(this.homePage).toBeVisible({ timeout });
    await expect(this.workspacesHeading).toBeVisible({ timeout });
  }

  async verifyAuthenticatedHomePage(): Promise<void> {
    await expect(this.homePage).toBeVisible();
    await expect(this.workspacesHeading).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('oyren_auth_token');
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('oyren_auth_token');
    });
    return token !== null && token !== '';
  }

  async getAuthToken(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return localStorage.getItem('oyren_auth_token');
    });
  }

  async clearAuth(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('oyren_auth_token');
    });
  }


  async logoutButtonExists(): Promise<boolean> {
    try {
      await expect(this.logoutButton).toBeVisible({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async testInvalidToken(invalidToken: string): Promise<void> {
    await this.loginWithToken(invalidToken);
    await this.navigateToHome();
    await this.page.waitForLoadState('networkidle');
  }


  async testExpiredToken(expiredToken: string): Promise<void> {
    await this.loginWithToken(expiredToken);
    await this.navigateToHome();
    await this.page.waitForLoadState('networkidle');
  }
}




