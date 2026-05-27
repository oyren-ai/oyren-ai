import { assertEquals } from "@std/assert";
import createOllamaClient from "@/providers/ollama/createOllamaClient.ts";

Deno.test("createOllamaClient - returns object with invoke method", () => {
  const client = createOllamaClient("llama3", 0.7, 1024);

  assertEquals(typeof client.invoke, "function");
});

Deno.test("createOllamaClient - returns object with bindTools method", () => {
  const client = createOllamaClient("llama3", 0.5, 512);

  assertEquals(typeof client.bindTools, "function");
});
