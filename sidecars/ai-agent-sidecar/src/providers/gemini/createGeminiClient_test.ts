import { assertEquals } from "@std/assert";
import createGeminiClient from "./createGeminiClient.ts";

Deno.test("createGeminiClient - returns object with invoke method", () => {
  const client = createGeminiClient("test-key", "gemini-2.5-flash", 0.7, 1024);

  assertEquals(typeof client.invoke, "function");
});

Deno.test("createGeminiClient - returns object with bindTools method", () => {
  const client = createGeminiClient("test-key", "gemini-2.5-flash", 0.5, 512);

  assertEquals(typeof client.bindTools, "function");
});
