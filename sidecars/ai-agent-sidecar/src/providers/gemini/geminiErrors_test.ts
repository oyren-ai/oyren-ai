import { assertEquals } from "@std/assert";
import { handleGeminiError } from "./geminiErrors.ts";

// ============================================================================
// Model Access Errors
// ============================================================================

Deno.test("handleGeminiError - API_KEY_INVALID triggers model access error", () => {
  const result = handleGeminiError(new Error("API_KEY_INVALID"), "gemini-2.5-flash");

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Model not available for your API key");
});

Deno.test("handleGeminiError - gemini-2.5-pro not found triggers model access", () => {
  const result = handleGeminiError(
    new Error("models/gemini-2.5-pro is not found"), "gemini-2.5-pro",
  );

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Model not available for your API key");
});

Deno.test("handleGeminiError - models/gemini-3.0 triggers model access", () => {
  const result = handleGeminiError(new Error("models/gemini-3.0"), "gemini-3.0-ultra");

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Model not available for your API key");
});

Deno.test("handleGeminiError - not found + 2.5-pro model triggers model access", () => {
  const result = handleGeminiError(
    new Error("resource not found"), "gemini-2.5-pro-latest",
  );

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Model not available for your API key");
});

Deno.test("handleGeminiError - not found + 3.0 model triggers model access", () => {
  const result = handleGeminiError(new Error("not found"), "gemini-3.0-ultra");

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Model not available for your API key");
});

// ============================================================================
// Invalid Key Errors
// ============================================================================

Deno.test("handleGeminiError - invalid API key triggers invalid key error", () => {
  const result = handleGeminiError(new Error("invalid API key"), "gemini-2.5-flash");

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Invalid API key");
});

// ============================================================================
// Rate Limit Errors
// ============================================================================

Deno.test("handleGeminiError - 429 triggers rate limit error", () => {
  const result = handleGeminiError(new Error("status 429"), "gemini-2.5-flash");

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Rate limit exceeded");
});

Deno.test("handleGeminiError - quota triggers rate limit error", () => {
  const result = handleGeminiError(new Error("quota exceeded"), "gemini-2.5-flash");

  assertEquals(result.error?.shortMessage, "Rate limit exceeded");
});

Deno.test("handleGeminiError - rate limit triggers rate limit error", () => {
  const result = handleGeminiError(new Error("rate limit"), "gemini-2.5-flash");

  assertEquals(result.error?.shortMessage, "Rate limit exceeded");
});

// ============================================================================
// Network Errors
// ============================================================================

Deno.test("handleGeminiError - fetch failed triggers network error", () => {
  const result = handleGeminiError(new Error("fetch failed"), "gemini-2.5-flash");

  assertEquals(result.error?.shortMessage, "Connection failed");
});

Deno.test("handleGeminiError - ECONNREFUSED triggers network error", () => {
  const result = handleGeminiError(new Error("ECONNREFUSED"), "gemini-2.5-flash");

  assertEquals(result.error?.shortMessage, "Connection failed");
});

Deno.test("handleGeminiError - Connection error triggers network error", () => {
  const result = handleGeminiError(new Error("Connection error"), "gemini-2.5-flash");

  assertEquals(result.error?.shortMessage, "Connection failed");
});

// ============================================================================
// Fallback & Non-Error Input
// ============================================================================

Deno.test("handleGeminiError - unknown error triggers fallback", () => {
  const result = handleGeminiError(new Error("something weird"), "gemini-2.5-flash");

  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "something weird");
});

Deno.test("handleGeminiError - non-Error input uses String()", () => {
  const result = handleGeminiError("raw string error", "gemini-2.5-flash");

  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "raw string error");
});
