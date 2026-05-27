import { assertEquals } from "@std/assert";
import {
  defaultOllamaClientFactory,
  detectOllamaModels,
  testOllamaConnection,
} from "@/providers/ollama/ollama.ts";

function mockFetch(body: unknown, ok = true, statusText = "OK"): typeof fetch {
  return () => Promise.resolve(new Response(JSON.stringify(body), {
    status: ok ? 200 : 500, statusText,
  }));
}

function throwingFetch(error: unknown): typeof fetch {
  return () => { throw error; };
}

const mockClient = (behavior: "success" | Error | string) => () => ({
  invoke: () => { if (behavior === "success") return Promise.resolve(); throw behavior; },
});

// --- detectOllamaModels ---

Deno.test("detectOllamaModels - returns models on success", async () => {
  const models = [{ name: "llama3", size: 100, modified_at: "2024-01-01" }];
  const result = await detectOllamaModels(mockFetch({ models }));
  assertEquals(result.data, models);
  assertEquals(result.error, undefined);
});

Deno.test("detectOllamaModels - returns empty array when no models", async () => {
  assertEquals((await detectOllamaModels(mockFetch({ models: [] }))).data, []);
});

Deno.test("detectOllamaModels - returns empty array when models key missing", async () => {
  assertEquals((await detectOllamaModels(mockFetch({}))).data, []);
});

Deno.test("detectOllamaModels - returns ApiError on non-ok response", async () => {
  const result = await detectOllamaModels(mockFetch({}, false, "Internal Server Error"));
  assertEquals(result.error?.shortMessage, "Failed to fetch models");
  assertEquals(result.data, undefined);
});

Deno.test("detectOllamaModels - returns ApiError on ECONNREFUSED", async () => {
  const result = await detectOllamaModels(
    throwingFetch(new Error("connect ECONNREFUSED 127.0.0.1:11434")),
  );
  assertEquals(result.error?.shortMessage, "Ollama not running");
});

Deno.test("detectOllamaModels - returns UnknownError on unexpected error", async () => {
  const result = await detectOllamaModels(throwingFetch(new Error("something unexpected")));
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "something unexpected");
});

// --- testOllamaConnection ---

Deno.test("testOllamaConnection - returns true on success", async () => {
  const result = await testOllamaConnection("llama3", mockClient("success"));
  assertEquals(result.data, true);
  assertEquals(result.error, undefined);
});

Deno.test("testOllamaConnection - returns ApiError when model not found", async () => {
  const result = await testOllamaConnection("m", mockClient(new Error("model 'm' not found")));
  assertEquals(result.error?.shortMessage, "Model not found");
});

Deno.test("testOllamaConnection - returns ApiError when model does not exist", async () => {
  const err = new Error("model 'g' does not exist");
  assertEquals((await testOllamaConnection("g", mockClient(err))).error?.shortMessage, "Model not found");
});

Deno.test("testOllamaConnection - returns ApiError on ECONNREFUSED", async () => {
  const result = await testOllamaConnection("llama3", mockClient(new Error("ECONNREFUSED")));
  assertEquals(result.error?.shortMessage, "Ollama not running");
});

Deno.test("testOllamaConnection - returns UnknownError on unexpected error", async () => {
  const result = await testOllamaConnection("llama3", mockClient(new Error("something else")));
  assertEquals(result.error?.errorType, "unknown-error");
});

Deno.test("testOllamaConnection - handles non-Error thrown value", async () => {
  const result = await testOllamaConnection("llama3", mockClient("raw string error"));
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "raw string error");
});

// --- defaultOllamaClientFactory ---

Deno.test("defaultOllamaClientFactory - creates client with invoke method", () => {
  const client = defaultOllamaClientFactory({ model: "llama3", baseUrl: "http://localhost:11434" });
  assertEquals(typeof client.invoke, "function");
});
