import { arxivApi } from '@/api/arxivApi';
import { parseArxivAtomXml, type ArxivSearchResult } from './parseArxivAtomXml';

export async function searchArxiv(
  query: string,
  maxResults = 10,
): Promise<ArxivSearchResult> {
  const xml = await arxivApi.search(query, maxResults);
  return parseArxivAtomXml(xml);
}