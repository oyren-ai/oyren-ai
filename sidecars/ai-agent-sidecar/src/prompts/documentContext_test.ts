import { assertEquals } from "@std/assert";
import { hasEmptyDocuments, countEmptyDocuments, hasDocuments, countDocuments } from "./documentContext.ts";

Deno.test("hasEmptyDocuments - detects empty file markers", () => {
  assertEquals(hasEmptyDocuments("[EMPTY_FILE: thesis.pdf]"), true);
  assertEquals(hasEmptyDocuments("[EMPTY_FILE: notes.txt]\n\nSome text"), true);
});

Deno.test("hasEmptyDocuments - returns false for no markers", () => {
  assertEquals(hasEmptyDocuments("Hello, explain this"), false);
  assertEquals(hasEmptyDocuments("--- research.pdf ---\ncontent"), false);
});

Deno.test("countEmptyDocuments - counts markers", () => {
  assertEquals(countEmptyDocuments("[EMPTY_FILE: a.pdf]\n[EMPTY_FILE: b.pdf]"), 2);
  assertEquals(countEmptyDocuments("[EMPTY_FILE: single.pdf]"), 1);
  assertEquals(countEmptyDocuments("no markers here"), 0);
});

Deno.test("hasDocuments - still matches real documents", () => {
  assertEquals(hasDocuments("--- research.pdf ---\nExtracted text"), true);
  assertEquals(hasDocuments("[EMPTY_FILE: thesis.pdf]"), false);
});

Deno.test("countDocuments - still counts real documents", () => {
  assertEquals(countDocuments("--- a.pdf ---\nText\n--- b.pdf ---\nMore"), 2);
  assertEquals(countDocuments("[EMPTY_FILE: c.pdf]"), 0);
});
