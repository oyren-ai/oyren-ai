import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { AuthPage } from '../pages/AuthPage';

test.describe('Authentication', () => {
    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
        authPage = new AuthPage(page);
        await setupTauriInternalMocks(page);
    });

    test('should load dashboard when authenticated', async ({ page }) => {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
        await authPage.loginAndNavigateToHome(mockToken);

        // Verify Home Page loads
        await authPage.verifyAuthenticatedHomePage();
    });

    test('should allow logout', async ({ page }) => {
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
        await authPage.loginAndNavigateToHome(mockToken);

        await authPage.logout();

        // Verify token is removed
        const isAuthenticated = await authPage.isAuthenticated();
        expect(isAuthenticated).toBe(false);
    });
});
