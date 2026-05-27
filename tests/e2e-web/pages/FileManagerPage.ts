import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class FileManagerPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    getFileNode(filename: string): Locator {
        return this.page.getByTestId(`file-node-${filename}`);
    }

    private async openFileActionsMenu(filename: string): Promise<void> {
        const fileNode = this.getFileNode(filename);
        // Hover to reveal the actions trigger (it's opacity-0 until group-hover)
        await fileNode.hover();
        // The trigger is inside the same SidebarMenuItem (li) as the file node
        const menuItem = this.page.locator('li').filter({ has: fileNode });
        await menuItem.getByTestId('file-actions-trigger').click();
    }

    async renameFile(oldFilename: string, newNameWithoutExtension: string): Promise<void> {
        await this.openFileActionsMenu(oldFilename);

        // DropdownMenuContent renders in a portal, so find from page root
        await this.page.getByTestId('rename-file-btn').click();
        await expect(this.page.getByRole('heading', { name: 'Rename File' })).toBeVisible();

        const input = this.page.locator('input[placeholder="Enter file name"]');
        await input.fill(newNameWithoutExtension);
        await this.page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click();

        await expect(this.getFileNode(oldFilename)).not.toBeVisible();
    }

    async deleteFile(filename: string): Promise<void> {
        await this.openFileActionsMenu(filename);

        // DropdownMenuContent renders in a portal, so find from page root
        await this.page.getByTestId('delete-file-btn').click();
        await expect(this.page.getByRole('heading', { name: 'Remove File' })).toBeVisible();

        await this.page.getByRole('dialog').getByRole('button', { name: 'Remove File' }).click();
        await expect(this.getFileNode(filename)).not.toBeVisible();
    }

    async verifyNoFilesMessage(): Promise<void> {
        await expect(this.page.getByText('No files in workspace')).toBeVisible();
    }
}