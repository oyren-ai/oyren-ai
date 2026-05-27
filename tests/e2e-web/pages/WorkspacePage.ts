import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { WorkspaceData } from '../test-data/workspaces';


export class WorkspacePage extends BasePage {
  // Locators
  private readonly createWorkspaceBtn: Locator;
  private readonly createWorkspaceDialog: Locator;
  private readonly workspaceNameInput: Locator;
  private readonly workspaceDescriptionInput: Locator;
  private readonly createWorkspaceSubmitBtn: Locator;
  private readonly homePage: Locator;
  private readonly workspacesSidebar: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.createWorkspaceBtn = page.getByTestId('create-workspace-btn');
    this.createWorkspaceDialog = page.getByTestId('create-workspace-dialog');
    this.workspaceNameInput = page.getByLabel('Name *');
    this.workspaceDescriptionInput = page.getByLabel('Description');
    this.createWorkspaceSubmitBtn = page.getByRole('button', { name: 'Create' });
    this.homePage = page.getByTestId('home-page');
    this.workspacesSidebar = page.getByTestId('workspaces-sidebar');
  }
  async waitForHomePage(timeout: number = 10000): Promise<void> {
    await expect(this.homePage).toBeVisible({ timeout });
  }

  async createWorkspace(workspaceData: WorkspaceData): Promise<void> {
    await this.createWorkspaceBtn.click();
    await expect(this.createWorkspaceDialog).toBeVisible();
    await this.workspaceNameInput.fill(workspaceData.name);
    if (workspaceData.description) {
      await this.workspaceDescriptionInput.fill(workspaceData.description);
    }

    await this.createWorkspaceSubmitBtn.click();
    await expect(this.createWorkspaceDialog).not.toBeVisible();
  }

  async createWorkspaceAndNavigate(workspaceData: WorkspaceData): Promise<void> {
    await this.createWorkspace(workspaceData);
    await expect(this.workspacesSidebar).toBeVisible({ timeout: 10000 });
  }

  async isCreateDialogVisible(): Promise<boolean> {
    return await this.createWorkspaceDialog.isVisible();
  }

  async getWorkspaceNameValue(): Promise<string> {
    return await this.workspaceNameInput.inputValue();
  }

  async getWorkspaceDescriptionValue(): Promise<string> {
    return await this.workspaceDescriptionInput.inputValue();
  }

  async cancelWorkspaceCreation(): Promise<void> {
    const cancelBtn = this.page.getByRole('button', { name: 'Cancel' });
    await cancelBtn.click();
    await expect(this.createWorkspaceDialog).not.toBeVisible();
  }

  async verifyFormValidation(): Promise<void> {
    await this.createWorkspaceBtn.click();
    await expect(this.createWorkspaceDialog).toBeVisible();
    await this.createWorkspaceSubmitBtn.click();
    await expect(this.createWorkspaceDialog).toBeVisible();
    await this.cancelWorkspaceCreation();
  }

  async isCreateWorkspaceButtonEnabled(): Promise<boolean> {
    return await this.createWorkspaceBtn.isEnabled();
  }

  async waitForWorkspaceView(timeout: number = 10000): Promise<void> {
    await expect(this.workspacesSidebar).toBeVisible({ timeout });
  }

  async navigateToWorkspace(workspaceName: string): Promise<void> {
    const workspaceCard = this.page.getByTestId(`workspace-card-${workspaceName}`);
    await workspaceCard.click();
    await this.waitForWorkspaceView();
  }

  async getWorkspaceCards(): Promise<Locator[]> {
    return await this.page.locator('[data-testid*="workspace-card"]').all();
  }

  async workspaceExists(workspaceName: string): Promise<boolean> {
    const workspaceCard = this.page.getByTestId(`workspace-card-${workspaceName}`);
    return await workspaceCard.isVisible();
  }

  async getWorkspaceCount(): Promise<number> {
    const cards = await this.getWorkspaceCards();
    return cards.length;
  }
}




