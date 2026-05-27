/** The 3-way intent classification from LLM */
type IntentType = "paper_search" | "chat_pdf_markdown" | "chat_no_pdf_markdown";

interface UserIntentData {
  intent: IntentType;
  topics: string[];
  keywords: string[];
  authors?: string[];
  categories?: string[];
}

export class UserIntent {
  readonly intent: IntentType;
  readonly topics?: string[];
  readonly keywords?: string[];
  readonly authors?: string[];
  readonly categories?: string[];

  constructor(data: UserIntentData) {
    this.intent = data.intent;
    this.topics = data.topics;
    this.keywords = data.keywords;
    this.authors = data.authors;
    this.categories = data.categories;
  }

  isPaperSearch(): boolean {
    return this.intent === "paper_search";
  }

  isChatWithDocuments(): boolean {
    return this.intent === "chat_pdf_markdown";
  }

  isChatWithoutDocuments(): boolean {
    return this.intent === "chat_no_pdf_markdown";
  }
}
