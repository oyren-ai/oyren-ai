import type { UserIntent } from "@/intent/types.ts";

const MAX_QUERIES = 5;

export function expandQueries(intent: UserIntent): string[] {
  const queries: string[] = [];
  const topics = intent.topics ?? [];
  const keywords = intent.keywords ?? [];
  const { authors, categories } = intent;

  if (topics.length > 0) {
    queries.push(buildTitleQuery(topics));
  }

  if (keywords.length > 0) {
    queries.push(buildAbstractQuery(keywords));
  }

  if (topics.length > 0 && keywords.length > 0) {
    queries.push(buildMixedQuery(topics, keywords));
  }

  if (authors && authors.length > 0 && topics.length > 0) {
    queries.push(buildAuthorQuery(authors, topics));
  }

  if (categories && categories.length > 0 && topics.length > 0) {
    queries.push(buildCategoryQuery(categories, topics));
  }

  // Always add a broad fallback
  if (queries.length === 0 || queries.length < MAX_QUERIES) {
    const allTerms = [...topics, ...keywords];
    if (allTerms.length > 0) {
      queries.push(buildBroadQuery(allTerms));
    }
  }

  return queries.slice(0, MAX_QUERIES);
}

function formatTerm(term: string): string {
  return term.includes(" ") ? `"${term}"` : term;
}

function buildTitleQuery(topics: string[]): string {
  return topics.map((t) => `ti:${formatTerm(t)}`).join(" AND ");
}

function buildAbstractQuery(keywords: string[]): string {
  return keywords.map((k) => `abs:${formatTerm(k)}`).join(" AND ");
}

function buildMixedQuery(topics: string[], keywords: string[]): string {
  const topicPart = `ti:${formatTerm(topics[0])}`;
  const keywordPart = `abs:${formatTerm(keywords[0])}`;
  return `${topicPart} AND ${keywordPart}`;
}

function buildAuthorQuery(authors: string[], topics: string[]): string {
  const authorPart = `au:${formatTerm(authors[0])}`;
  const topicPart = `ti:${formatTerm(topics[0])}`;
  return `${authorPart} AND ${topicPart}`;
}

function buildCategoryQuery(categories: string[], topics: string[]): string {
  const catPart = `cat:${categories[0]}`;
  const topicPart = `abs:${formatTerm(topics[0])}`;
  return `${catPart} AND ${topicPart}`;
}

function buildBroadQuery(terms: string[]): string {
  return `all:${terms.map(formatTerm).join("+")}`;
}
