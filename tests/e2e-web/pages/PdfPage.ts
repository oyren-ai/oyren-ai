import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';
export class PdfPage extends BasePage {
  // Locators
  private readonly pdfViewer: Locator;
  private readonly samplePdfFile: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.pdfViewer = page.getByTestId('pdf-viewer');
    this.samplePdfFile = page.getByTestId('file-node-sample.pdf');
  }

  async waitForPdfViewer(timeout: number = 10000): Promise<void> {
    await expect(this.pdfViewer).toBeVisible({ timeout });
  }

  async openSamplePdf(): Promise<void> {
    await expect(this.samplePdfFile).toBeVisible({ timeout: 10000 });
    await this.samplePdfFile.click();
    await this.waitForPdfViewer();
  }

  async isPdfViewerVisible(): Promise<boolean> {
    return await this.pdfViewer.isVisible();
  }

  getPdfFileNode(filename: string): Locator {
    return this.page.getByTestId(`file-node-${filename}`);
  }

  async openPdfFile(filename: string): Promise<void> {
    const fileNode = this.getPdfFileNode(filename);
    await expect(fileNode).toBeVisible({ timeout: 5000 });
    await fileNode.click();
    await this.waitForPdfViewer();
  }

  async pdfFileExists(filename: string): Promise<boolean> {
    const fileNode = this.getPdfFileNode(filename);
    return await fileNode.isVisible();
  }

  async waitForPdfLoad(timeout: number = 15000): Promise<void> {
    await this.waitForPdfViewer(timeout);
    await this.page.waitForSelector('canvas', { timeout });
  }

  getPdfViewerContainer(): Locator {
    return this.pdfViewer;
  }

  async isPdfToolbarVisible(): Promise<boolean> {
    const toolbar = this.page.locator('[data-testid="pdf-toolbar"]');
    return await toolbar.isVisible();
  }

  async getPdfPageCount(): Promise<number | null> {
    try {
      const pageCountElement = this.page.locator('[data-testid="pdf-page-count"]');
      const text = await pageCountElement.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : null;
    } catch {
      return null;
    }
  }

  async goToPdfPage(pageNumber: number): Promise<void> {
    const pageInput = this.page.locator('[data-testid="pdf-page-input"]');
    await pageInput.fill(pageNumber.toString());
    await pageInput.press('Enter');
  }

  async zoomPdf(zoomLevel: string): Promise<void> {
    const zoomSelect = this.page.locator('[data-testid="pdf-zoom-select"]');
    await zoomSelect.selectOption(zoomLevel);
  }

  async searchInPdf(query: string): Promise<void> {
    const searchBtn = this.page.getByTitle('Find in document (Ctrl+F)');
    await searchBtn.click();

    const searchInput = this.page.getByPlaceholder('Type to search...');
    await searchInput.fill(query);
    await searchInput.press('Enter');
  }


  async getSearchResultCount(): Promise<string | null> {
    try {
      const resultText = this.page.locator('text=/\\d+ of \\d+/');
      return await resultText.textContent();
    } catch {
      return null;
    }
  }


  async clearPdfSearch(): Promise<void> {
    const clearBtn = this.page.getByTitle('Clear');
    await clearBtn.click();
  }

  async rotatePdf(): Promise<void> {
    const rotateBtn = this.page.getByTitle('Rotate clockwise');
    await rotateBtn.click();
  }


  async downloadPdf(): Promise<void> {
    const downloadBtn = this.page.getByTitle('Download');
    await downloadBtn.click();
  }


  async togglePdfSidebar(): Promise<void> {
    const sidebarBtn = this.page.getByTitle('Toggle sidebar');
    await sidebarBtn.click();
  }

  async isPdfSidebarVisible(): Promise<boolean> {
    const sidebar = this.page.locator('[data-testid="pdf-sidebar"]');
    return await sidebar.isVisible();
  }

  async getPdfTextContent(): Promise<string | null> {
    try {
      const textLayer = this.page.locator('.textLayer');
      return await textLayer.textContent();
    } catch {
      return null;
    }
  }


  async waitForSearchResults(timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector('text=/\\d+ of \\d+/', { timeout });
  }


  async goToNextSearchResult(): Promise<void> {
    const nextBtn = this.page.getByTitle('Next match (Ctrl+↓)');
    await nextBtn.click();
  }

  async goToPreviousSearchResult(): Promise<void> {
    const prevBtn = this.page.getByTitle('Previous match (Ctrl+↑)');
    await prevBtn.click();
  }
}




