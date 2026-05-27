import { test, expect } from '@playwright/test';
import { setupTauriInternalMocks } from '../mocks/tauri';
import { WorkspacePage } from '../pages/WorkspacePage';
import { NotesPage } from '../pages/NotesPage';

test.describe('Notes', () => {
  let workspacePage: WorkspacePage;
  let notesPage: NotesPage;

  test.beforeEach(async ({ page }) => {
    workspacePage = new WorkspacePage(page);
    notesPage = new NotesPage(page);
    await setupTauriInternalMocks(page);

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJleHAiOjk5OTk5OTk5OTl9.sig';
    await page.addInitScript((token) => {
      localStorage.setItem('oyren_auth_token', token);
    }, mockToken);

    await workspacePage.navigateTo('/');
    await workspacePage.waitForHomePage();
    await workspacePage.createWorkspaceAndNavigate({ name: 'Notes Test', description: 'Testing notes' });
  });

  test('should open notes panel', async () => {
    await notesPage.openNotesPanel();
    const isVisible = await notesPage.isPanelVisible();
    expect(isVisible).toBe(true);
  });

  test('should create a new note', async () => {
    await notesPage.openNotesPanel();
    await notesPage.createNote('My Test Note');
  });

  test('should show note detail view when note is selected', async () => {
    await notesPage.openNotesPanel();
    await notesPage.createNote('Detail Test Note');

    const isDetailVisible = await notesPage.isNoteDetailVisible();
    expect(isDetailVisible).toBe(true);
  });
});
