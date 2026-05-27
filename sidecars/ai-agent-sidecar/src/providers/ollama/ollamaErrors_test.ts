import { assertEquals } from "@std/assert";
import { handleOllamaError } from "@/providers/ollama/ollamaErrors.ts";

// --- Connection Errors ---

Deno.test("handleOllamaError - ECONNREFUSED triggers connection error", () => {
  const result = handleOllamaError(new Error("ECONNREFUSED"), "llama3");
  assertEquals(result.error?.shortMessage, "Ollama not running");
});

Deno.test("handleOllamaError - fetch failed triggers connection error", () => {
  const result = handleOllamaError(new Error("fetch failed"), "llama3");
  assertEquals(result.error?.shortMessage, "Ollama not running");
});

// --- Model Not Found Errors ---

Deno.test("handleOllamaError - model not found triggers model error", () => {
  const result = handleOllamaError(new Error("model 'llama3' not found"), "llama3");
  assertEquals(result.error?.shortMessage, "Model not found");
});

Deno.test("handleOllamaError - model does not exist triggers model error", () => {
  const result = handleOllamaError(new Error("model 'llama3' does not exist"), "llama3");
  assertEquals(result.error?.shortMessage, "Model not found");
});

// --- Fallback & Non-Error ---

Deno.test("handleOllamaError - unknown error triggers fallback", () => {
  const result = handleOllamaError(new Error("something weird"), "llama3");
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "something weird");
});

Deno.test("handleOllamaError - non-Error input uses String()", () => {
  const result = handleOllamaError("raw string error", "llama3");
  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "raw string error");
});
