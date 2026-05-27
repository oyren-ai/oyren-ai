// @ts-ignore
import { assertEquals } from "@std/assert";
import { expandQueries } from "./queryExpander.ts";
import { UserIntent } from "@/intent/types.ts";

Deno.test("expandQueries - single topic generates title and broad queries", () => {
  const intent = new UserIntent({ intent: "paper_search", topics: ["transformers"], keywords: [] });
  const queries = expandQueries(intent);
  assertEquals(queries.length > 0, true);
  assertEquals(queries.some((q) => q.includes("ti:transformers")), true);
});

Deno.test("expandQueries - topics and keywords generate mixed query", () => {
  const intent = new UserIntent({
    intent: "paper_search",
    topics: ["reinforcement learning"],
    keywords: ["policy gradient"],
  });
  const queries = expandQueries(intent);
  assertEquals(queries.some((q) => q.includes('ti:"reinforcement learning"')), true);
  assertEquals(queries.some((q) => q.includes('abs:"policy gradient"')), true);
  assertEquals(queries.some((q) => q.includes("AND")), true);
});

Deno.test("expandQueries - author scoped query", () => {
  const intent = new UserIntent({
    intent: "paper_search",
    topics: ["attention"],
    keywords: [],
    authors: ["Vaswani"],
  });
  const queries = expandQueries(intent);
  assertEquals(queries.some((q) => q.includes("au:Vaswani")), true);
});

Deno.test("expandQueries - category scoped query", () => {
  const intent = new UserIntent({
    intent: "paper_search",
    topics: ["language models"],
    keywords: [],
    categories: ["cs.CL"],
  });
  const queries = expandQueries(intent);
  assertEquals(queries.some((q) => q.includes("cat:cs.CL")), true);
});

Deno.test("expandQueries - max 5 queries", () => {
  const intent = new UserIntent({
    intent: "paper_search",
    topics: ["topic1", "topic2"],
    keywords: ["key1", "key2"],
    authors: ["Author1"],
    categories: ["cs.AI"],
  });
  const queries = expandQueries(intent);
  assertEquals(queries.length <= 5, true);
});

Deno.test("expandQueries - empty intent returns broad fallback", () => {
  const intent = new UserIntent({ intent: "paper_search", topics: [], keywords: [] });
  const queries = expandQueries(intent);
  assertEquals(queries.length, 0);
});

Deno.test("expandQueries - multi-word terms are quoted", () => {
  const intent = new UserIntent({
    intent: "paper_search",
    topics: ["neural networks"],
    keywords: [],
  });
  const queries = expandQueries(intent);
  assertEquals(queries.some((q) => q.includes('"neural networks"')), true);
});

Deno.test("expandQueries - handles undefined topics and keywords via ?? fallback", () => {
  // deno-lint-ignore no-explicit-any
  const intent = { intent: "paper_search" } as any as UserIntent;
  const queries = expandQueries(intent);
  assertEquals(queries.length, 0);
});
