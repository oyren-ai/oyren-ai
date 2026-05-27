// @ts-ignore
import { assertEquals, assertStringIncludes } from "@std/assert";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { executeWithTools } from "./executeWithTools.ts";
import type { LlmChatClient } from "@/types/LlmChatClient.ts";

const SEARCH_XML = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <opensearch:totalResults>1</opensearch:totalResults>
  <entry>
    <id>http://arxiv.org/abs/2401.00001v1</id>
    <title>Found Paper</title>
    <summary>A summary.</summary>
    <published>2024-01-01T00:00:00Z</published>
    <author><name>Author One</name></author>
    <category term="cs.AI" />
  </entry>
</feed>`;

function mockFetchForTools() {
  const original = globalThis.fetch;
  globalThis.fetch = (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (init?.method === "HEAD") {
      return Promise.resolve(new Response("", { status: 200 }));
    }
    if (url.includes("ar5iv")) {
      return Promise.resolve(new Response("<p>Full text</p>", { status: 200 }));
    }
    return Promise.resolve(new Response(SEARCH_XML, { status: 200 }));
  };
  return () => { globalThis.fetch = original; };
}

/** Creates a mock LLM that returns responses in sequence */
function mockLlm(responses: AIMessage[]): LlmChatClient {
  let callIndex = 0;
  const client: LlmChatClient = {
    invoke: async () => {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      // deno-lint-ignore no-explicit-any
      return response as any;
    },
    bindTools: () => client,
  };
  return client;
}

function noToolCallResponse(content: string): AIMessage {
  return new AIMessage({ content });
}

function toolCallResponse(
  name: string,
  args: Record<string, unknown>,
  id?: string,
): AIMessage {
  const msg = new AIMessage({ content: "" });
  msg.tool_calls = [{ name, args, id, type: "tool_call" }];
  return msg;
}

Deno.test("executeWithTools - no tool calls returns immediately", async () => {
  const llm = mockLlm([noToolCallResponse("Direct answer")]);
  const result = await executeWithTools(llm, [new HumanMessage("Hello")]);
  assertEquals(result.finalResponse, "Direct answer");
  assertEquals(result.arxivPapers.length, 0);
});

Deno.test("executeWithTools - collects papers from search tool call", async () => {
  const restore = mockFetchForTools();
  const llm = mockLlm([
    toolCallResponse("arxiv_search", { query: "transformers", maxResults: 5 }, "call_1"),
    noToolCallResponse("Found papers about transformers"),
  ]);
  const result = await executeWithTools(llm, [new HumanMessage("Find papers")]);
  assertEquals(result.finalResponse, "Found papers about transformers");
  assertEquals(result.arxivPapers.length, 1);
  assertEquals(result.arxivPapers[0].title, "Found Paper");
  restore();
});

Deno.test("executeWithTools - handles unknown tool name", async () => {
  const llm = mockLlm([
    toolCallResponse("unknown_tool", {}, "call_unk"),
    noToolCallResponse("ok"),
  ]);
  const result = await executeWithTools(llm, [new HumanMessage("test")]);
  assertEquals(result.finalResponse, "ok");
});

Deno.test("executeWithTools - uses tool name as fallback when id is undefined", async () => {
  const llm = mockLlm([
    toolCallResponse("unknown_tool", {}),
    noToolCallResponse("ok"),
  ]);
  const result = await executeWithTools(llm, [new HumanMessage("test")]);
  assertEquals(result.finalResponse, "ok");
});

Deno.test("executeWithTools - known tool without id uses name as fallback", async () => {
  const restore = mockFetchForTools();
  const llm = mockLlm([
    toolCallResponse("arxiv_search", { query: "test", maxResults: 1 }),
    noToolCallResponse("done"),
  ]);
  const result = await executeWithTools(llm, [new HumanMessage("test")]);
  assertEquals(result.finalResponse, "done");
  assertEquals(result.arxivPapers.length, 1);
  restore();
});

Deno.test("executeWithTools - passes prefetchedPapers through", async () => {
  const llm = mockLlm([noToolCallResponse("Done")]);
  const prefetched = [{
    id: "pre.001", title: "Pre", authors: ["A"],
    summary: "S", arxiv_url: "u", pdf_url: "p", published: "2024",
  }];
  const result = await executeWithTools(
    llm, [new HumanMessage("test")], prefetched,
  );
  assertEquals(result.arxivPapers.length, 1);
  assertEquals(result.arxivPapers[0].id, "pre.001");
});
