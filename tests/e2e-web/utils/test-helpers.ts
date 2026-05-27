import { Page } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { authTestData } from '../test-data/auth';

export async function loginAsTestUser(page: Page): Promise<void> {
  const mockToken = authTestData.validUser.token;
  await page.addInitScript((token) => {
    localStorage.setItem('oyren_auth_token', token);
  }, mockToken);
}

export async function setupTestEnvironment(page: Page): Promise<void> {
  await setupTauriInternalMocks(page);
  await loginAsTestUser(page);
}

export async function waitForAppReady(page: Page, timeout: number = 10000): Promise<void> {
  await page.goto('/', { timeout });
  await page.waitForSelector('[data-testid="home-page"]', { timeout });
}

export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = initialDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError!;
}

export async function takeScreenshotOnFailure(page: Page, testName: string): Promise<void> {
  try {
    await page.screenshot({
      path: `test-results/screenshots/${testName}-failure.png`,
      fullPage: true
    });
  } catch (error) {
    console.warn('Failed to take screenshot:', error);
  }
}

export function logStep(step: string): void {
  console.log(`🔍 STEP: ${step}`);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
export function createTestFilePath(filename: string): string {
  return `/app_data/test-files/${filename}`;
}




