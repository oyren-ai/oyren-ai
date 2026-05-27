// @ts-ignore
import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  stripHtmlToText,
  decodeEntities,
  truncateText,
} from "./htmlToText.ts";

Deno.test("stripHtmlToText - removes script tags", () => {
  const html = "<p>Hello</p><script>alert('xss')</script><p>World</p>";
  const result = stripHtmlToText(html);
  assertStringIncludes(result, "Hello");
  assertStringIncludes(result, "World");
  assertEquals(result.includes("alert"), false);
});

Deno.test("stripHtmlToText - removes style tags", () => {
  const html = "<style>.foo { color: red }</style><p>Content</p>";
  const result = stripHtmlToText(html);
  assertEquals(result.includes("color"), false);
  assertStringIncludes(result, "Content");
});

Deno.test("stripHtmlToText - removes nav, header, footer", () => {
  const html = "<nav>Menu</nav><header>Top</header><p>Body</p><footer>Bottom</footer>";
  const result = stripHtmlToText(html);
  assertEquals(result.includes("Menu"), false);
  assertEquals(result.includes("Top"), false);
  assertEquals(result.includes("Bottom"), false);
  assertStringIncludes(result, "Body");
});

Deno.test("stripHtmlToText - converts headings to markdown", () => {
  const html = "<h1>Title</h1><h2>Subtitle</h2>";
  const result = stripHtmlToText(html);
  assertStringIncludes(result, "## Title");
  assertStringIncludes(result, "## Subtitle");
});

Deno.test("stripHtmlToText - strips remaining HTML tags", () => {
  const html = "<span class='bold'>Text</span><a href='#'>Link</a>";
  const result = stripHtmlToText(html);
  assertStringIncludes(result, "Text");
  assertStringIncludes(result, "Link");
  assertEquals(result.includes("<span"), false);
  assertEquals(result.includes("<a"), false);
});

Deno.test("decodeEntities - decodes all supported entities", () => {
  assertEquals(decodeEntities("&amp;"), "&");
  assertEquals(decodeEntities("&lt;"), "<");
  assertEquals(decodeEntities("&gt;"), ">");
  assertEquals(decodeEntities("&quot;"), '"');
  assertEquals(decodeEntities("&#39;"), "'");
  assertEquals(decodeEntities("&nbsp;"), " ");
});

Deno.test("decodeEntities - handles mixed content", () => {
  const result = decodeEntities("x &lt; y &amp;&amp; z &gt; w");
  assertEquals(result, "x < y && z > w");
});

Deno.test("truncateText - returns text unchanged if under limit", () => {
  assertEquals(truncateText("short", 100), "short");
});

Deno.test("truncateText - truncates at newline boundary when possible", () => {
  const text = "a".repeat(85) + "\n" + "b".repeat(20);
  const result = truncateText(text, 100);
  assertStringIncludes(result, "[...truncated]");
  // Should cut at the newline (position 85), which is > 80% of 100
  assertEquals(result.includes("b"), false);
});

Deno.test("truncateText - truncates at maxLength when no good newline", () => {
  const text = "a".repeat(200);
  const result = truncateText(text, 100);
  assertStringIncludes(result, "[...truncated]");
});
