import { assertEquals, assertStringIncludes } from "@std/assert";
import { buildSystemPrompt, createSystemMessage } from "@/prompts/promptBuilder.ts";
import { assert } from "@std/assert";

const MSG_WITH_DOCS = "--- research.pdf ---\nSome content";
const MSG_WITH_TWO_DOCS = "--- paper1.pdf ---\ncontent\n--- paper2.pdf ---\nmore";
const MSG_WITH_EMPTY = "[EMPTY_FILE: thesis.pdf]";
const MSG_PLAIN = "What is quantum computing?";

// --- createSystemMessage ---

Deno.test("createSystemMessage - returns system role with built prompt", () => {
  const result = createSystemMessage({ message: MSG_PLAIN });
  assertEquals(result.role, "system");
  assertStringIncludes(result.content, "AI assistant");
});

// --- Answer mode branches ---

Deno.test("buildSystemPrompt - short mode includes short instructions", () => {
  const result = buildSystemPrompt({ answerMode: "short", message: MSG_PLAIN });
  assertStringIncludes(result, "SHORT");
});

Deno.test("buildSystemPrompt - concise mode includes concise instructions", () => {
  const result = buildSystemPrompt({ answerMode: "concise", message: MSG_PLAIN });
  assertStringIncludes(result, "CONCISE");
});

Deno.test("buildSystemPrompt - detailed mode (default) includes detailed instructions", () => {
  const result = buildSystemPrompt({ message: MSG_PLAIN });
  assertStringIncludes(result, "DETAILED");
});

// --- Document state branches ---

Deno.test("buildSystemPrompt - with documents includes citation instructions", () => {
  const result = buildSystemPrompt({ message: MSG_WITH_DOCS });
  assertStringIncludes(result, "Working with Provided Documents");
  assertStringIncludes(result, "1 document");
});

Deno.test("buildSystemPrompt - with multiple documents shows plural count", () => {
  const result = buildSystemPrompt({ message: MSG_WITH_TWO_DOCS });
  assertStringIncludes(result, "2 documents");
});

Deno.test("buildSystemPrompt - with empty documents includes empty suggestion", () => {
  const result = buildSystemPrompt({ message: MSG_WITH_EMPTY });
  assertStringIncludes(result, "No Extractable Text");
});

Deno.test("buildSystemPrompt - no documents includes no-document suggestion", () => {
  const result = buildSystemPrompt({ message: MSG_PLAIN });
  assertStringIncludes(result, "No Documents Attached");
});

Deno.test("buildSystemPrompt - plain message but history has docs includes citation instructions", () => {
  const history = [
    { role: "user" as const, content: "--- research.pdf ---\nSome PDF content" },
    { role: "assistant" as const, content: "I see the document." },
  ];
  const result = buildSystemPrompt({ message: MSG_PLAIN, conversationHistory: history });
  assertStringIncludes(result, "Working with Provided Documents");
});

Deno.test("buildSystemPrompt - md file in history also triggers citation instructions", () => {
  const history = [
    { role: "user" as const, content: "--- notes.md ---\nSome markdown content" },
  ];
  const result = buildSystemPrompt({ message: MSG_PLAIN, conversationHistory: history });
  assertStringIncludes(result, "Working with Provided Documents");
});

Deno.test("buildSystemPrompt - file attachments trigger citation instructions", () => {
  const files = [{ data: "base64content", mime_type: "application/pdf", filename: "paper.pdf" }];
  const result = buildSystemPrompt({ message: MSG_PLAIN, files });
  assertStringIncludes(result, "Working with Provided Documents");
  assert(!result.includes("No Documents Attached"), "Should not include no-document suggestion when files attached");
});

Deno.test("buildSystemPrompt - file attachments without doc markers skip document count note", () => {
  const files = [{ data: "base64content", mime_type: "application/pdf", filename: "paper.pdf" }];
  const result = buildSystemPrompt({ message: MSG_PLAIN, files });
  assert(!result.includes("document to reference"), "Should not show doc count when only file attachments present");
});

// --- Always-present sections ---

Deno.test("buildSystemPrompt - always includes formatting instructions", () => {
  const result = buildSystemPrompt({ message: MSG_PLAIN });
  assertStringIncludes(result, "MDX");
  assertStringIncludes(result, "Document Citations");
});

Deno.test("buildSystemPrompt - always includes tool usage instructions", () => {
  const result = buildSystemPrompt({ message: MSG_PLAIN });
  assertStringIncludes(result, "Tool Usage");
});
