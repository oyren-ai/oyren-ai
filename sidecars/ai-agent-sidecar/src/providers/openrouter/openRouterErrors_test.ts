import { assertEquals } from "@std/assert";
import { handleOpenRouterError } from "./openRouterErrors.ts";

// ============================================================================
// Invalid Key Errors
// ============================================================================

Deno.test("handleOpenRouterError - 401 triggers invalid key error", () => {
  const result = handleOpenRouterError(new Error("status 401"), "gpt-4o");

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Invalid API key");
});

Deno.test("handleOpenRouterError - Unauthorized triggers invalid key error", () => {
  const result = handleOpenRouterError(new Error("Unauthorized"), "gpt-4o");

  assertEquals(result.error?.shortMessage, "Invalid API key");
});

Deno.test("handleOpenRouterError - invalid API key triggers invalid key error", () => {
  const result = handleOpenRouterError(new Error("invalid API key"), "gpt-4o");

  assertEquals(result.error?.shortMessage, "Invalid API key");
});

// ============================================================================
// Rate Limit Errors
// ============================================================================

Deno.test("handleOpenRouterError - 429 triggers rate limit error", () => {
  const result = handleOpenRouterError(new Error("status 429"), "gpt-4o");

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Rate limit exceeded");
});

Deno.test("handleOpenRouterError - rate limit triggers rate limit error", () => {
  const result = handleOpenRouterError(new Error("rate limit"), "gpt-4o");

  assertEquals(result.error?.shortMessage, "Rate limit exceeded");
});

Deno.test("handleOpenRouterError - quota triggers rate limit error", () => {
  const result = handleOpenRouterError(new Error("quota exceeded"), "gpt-4o");

  assertEquals(result.error?.shortMessage, "Rate limit exceeded");
});

// ============================================================================
// Network Errors
// ============================================================================

Deno.test("handleOpenRouterError - fetch failed triggers network error", () => {
  const result = handleOpenRouterError(new Error("fetch failed"), "gpt-4o");

  assertEquals(result.error?.shortMessage, "Connection failed");
});

Deno.test("handleOpenRouterError - ECONNREFUSED triggers network error", () => {
  const result = handleOpenRouterError(new Error("ECONNREFUSED"), "gpt-4o");

  assertEquals(result.error?.shortMessage, "Connection failed");
});

Deno.test("handleOpenRouterError - network triggers network error", () => {
  const result = handleOpenRouterError(new Error("network issue"), "gpt-4o");

  assertEquals(result.error?.shortMessage, "Connection failed");
});

Deno.test("handleOpenRouterError - Connection error triggers network error", () => {
  const result = handleOpenRouterError(new Error("Connection error"), "gpt-4o");

  assertEquals(result.error?.shortMessage, "Connection failed");
});

// ============================================================================
// Model Not Found Errors
// ============================================================================

Deno.test("handleOpenRouterError - model not found triggers model error", () => {
  const result = handleOpenRouterError(
    new Error("model xyz not found"), "xyz",
  );

  assertEquals(result.error?.errorType, "api-error");
  assertEquals(result.error?.shortMessage, "Model not available");
  assertEquals(result.error?.message?.includes("xyz"), true);
});

// ============================================================================
// Fallback & Non-Error Input
// ============================================================================

Deno.test("handleOpenRouterError - unknown error triggers fallback", () => {
  const result = handleOpenRouterError(new Error("something weird"), "gpt-4o");

  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "something weird");
});

Deno.test("handleOpenRouterError - non-Error input uses String()", () => {
  const result = handleOpenRouterError("raw string error", "gpt-4o");

  assertEquals(result.error?.errorType, "unknown-error");
  assertEquals(result.error?.message, "raw string error");
});
