import { assertEquals } from "@std/assert";
import createOpenRouterClient from "./createOpenRouterClient.ts";

Deno.test("createOpenRouterClient - returns object with invoke method", () => {
  const client = createOpenRouterClient("test-key", "gpt-4o", 0.7, 1024);

  assertEquals(typeof client.invoke, "function");
});

Deno.test("createOpenRouterClient - returns object with bindTools method", () => {
  const client = createOpenRouterClient("test-key", "gpt-4o", 0.5, 512);

  assertEquals(typeof client.bindTools, "function");
});
