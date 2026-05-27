import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NotesPage extends BasePage {
  private readonly notesPanelButton: Locator;
  private readonly notesPanel: Locator;
  private readonly createNoteButton: Locator;
  private readonly notesList: Locator;
  private readonly noteDetailView: Locator;
  private readonly createNoteDialog: Locator;
  private readonly noteNameInput: Locator;
  private readonly deleteNoteDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.notesPanelButton = page.getByTestId('right-panel-mdx-notes');
    this.notesPanel = page.getByTestId('notes-panel');
    this.createNoteButton = page.getByTestId('create-note-button');
    this.notesList = page.getByTestId('notes-list');
    this.noteDetailView = page.getByTestId('note-detail-view');
    this.createNoteDialog = page.getByTestId('create-note-dialog');
    this.noteNameInput = page.getByTestId('note-name-input');
    this.deleteNoteDialog = page.getByTestId('delete-note-dialog');
  }

  async openNotesPanel(): Promise<void> {
    await this.notesPanelButton.click();
    await expect(this.notesPanel).toBeVisible({ timeout: 5000 });
  }

  async createNote(name: string): Promise<void> {
    await this.createNoteButton.click();
    await expect(this.createNoteDialog).toBeVisible();
    await this.noteNameInput.fill(name);
    await this.page.getByRole('button', { name: 'Create Note' }).click();
  }

  async selectNote(noteId: string): Promise<void> {
    const noteItem = this.page.getByTestId(`note-item-${noteId}`);
    await noteItem.click();
  }

  async isNoteDetailVisible(): Promise<boolean> {
    return await this.noteDetailView.isVisible();
  }

  async isNotesListVisible(): Promise<boolean> {
    return await this.notesList.isVisible();
  }

  async deleteCurrentNote(): Promise<void> {
    await this.page.getByRole('button', { name: 'Delete' }).first().click();
    await expect(this.deleteNoteDialog).toBeVisible();
    await this.page.getByRole('button', { name: 'Delete' }).last().click();
  }

  async isPanelVisible(): Promise<boolean> {
    return await this.notesPanel.isVisible();
  }
}
