import { assertEquals } from "@std/assert";
import { SidecarResponseFactory } from "@/SidecarResponseFactory.ts";
import { SidecarError } from "@/types/SidecarError.ts";

function parsed(response: { output: string }) {
  return JSON.parse(response.output);
}

// --- success ---

Deno.test("SidecarResponseFactory.success - wraps data correctly", () => {
  const result = SidecarResponseFactory.success({ value: 42 });
  assertEquals(result.isError, false);
  assertEquals(result.exitCode, 0);
  assertEquals(parsed(result).data, { value: 42 });
  assertEquals(parsed(result).error, null);
});

// --- error ---

Deno.test("SidecarResponseFactory.error - wraps error correctly", () => {
  const result = SidecarResponseFactory.error("api-error", "Something failed", "Oops");
  assertEquals(result.isError, true);
  assertEquals(result.exitCode, 0);
  assertEquals(parsed(result).error.errorType, "api-error");
  assertEquals(parsed(result).error.shortMessage, "Oops");
  assertEquals(parsed(result).error.message, "Something failed");
  assertEquals(parsed(result).data, null);
});

Deno.test("SidecarResponseFactory.error - handles missing shortMessage", () => {
  const result = SidecarResponseFactory.error("unknown-error", "fail");
  assertEquals(parsed(result).error.shortMessage, null);
});

Deno.test("SidecarResponseFactory.error - handles empty message", () => {
  const result = SidecarResponseFactory.error("unknown-error", "");
  assertEquals(parsed(result).error.message, null);
});

// --- match ---

Deno.test("SidecarResponseFactory.match - routes data to success", () => {
  const result = SidecarResponseFactory.match({ data: "hello" });
  assertEquals(result.isError, false);
  assertEquals(parsed(result).data, "hello");
});

Deno.test("SidecarResponseFactory.match - routes error to error output", () => {
  const error = SidecarError.ApiError({ message: "fail" });
  const result = SidecarResponseFactory.match({ error });
  assertEquals(result.isError, true);
  assertEquals(parsed(result).error.errorType, "api-error");
});

Deno.test("SidecarResponseFactory.match - handles empty response", () => {
  const result = SidecarResponseFactory.match({});
  assertEquals(result.isError, true);
  assertEquals(parsed(result).error.errorType, "unknown-error");
  assertEquals(parsed(result).error.message, "No data or error in response");
});
