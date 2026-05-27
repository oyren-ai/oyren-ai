const pageCountMap = new Map<string, number>();

export const pdfPageCountStore = {
  set: (pdfFilePath: string, count: number) => {
    pageCountMap.set(pdfFilePath, count);
  },
  get: (pdfFilePath: string): number | undefined => {
    return pageCountMap.get(pdfFilePath);
  },
};
