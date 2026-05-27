import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { ArxivSearchPage } from '../pages/ArxivSearchPage';

test.describe('ArXiv Search', () => {
  let workspacePage: WorkspacePage;
  let arxivPage: ArxivSearchPage;

  test.beforeEach(async ({ page }) => {
    workspacePage = new WorkspacePage(page);
    arxivPage = new ArxivSearchPage(page);
    await setupTauriInternalMocks(page);

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.sig';
    await page.addInitScript((token) => {
      localStorage.setItem('oyren_auth_token', token);
    }, mockToken);

    await workspacePage.navigateTo('/');
    await workspacePage.waitForHomePage();
    await workspacePage.createWorkspaceAndNavigate({ name: 'ArXiv Test', description: 'Testing' });
  });

  test('should show empty state before search', async () => {
    await arxivPage.openArxivPanel();
    const isEmpty = await arxivPage.isEmptyStateVisible();
    expect(isEmpty).toBe(true);
  });

  test('should search and display results', async () => {
    await arxivPage.openArxivPanel();
    await arxivPage.search('transformer attention');
    await arxivPage.waitForResults();

    const hasCard = await arxivPage.paperCardExists('2401.00001');
    expect(hasCard).toBe(true);
  });

  test('should open arxiv panel via right sidebar', async () => {
    await arxivPage.openArxivPanel();
    const isVisible = await arxivPage.isPanelVisible();
    expect(isVisible).toBe(true);
  });
});
