import { assertEquals } from "@std/assert";
import createDeepSeekClient from "@/providers/deepseek/createDeepSeekClient.ts";

Deno.test("createDeepSeekClient - returns object with invoke method", () => {
  const client = createDeepSeekClient("test-key", "deepseek-chat", 0.7, 1024);
  assertEquals(typeof client.invoke, "function");
});

Deno.test("createDeepSeekClient - returns object with bindTools method", () => {
  const client = createDeepSeekClient("test-key", "deepseek-chat", 0.5, 512);
  assertEquals(typeof client.bindTools, "function");
});
