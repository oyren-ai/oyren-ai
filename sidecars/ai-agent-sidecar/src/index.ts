#!/usr/bin/env -S deno run --allow-all
/// <reference lib="deno.ns" />
import handleAgentRequest from './handleAgentRequest.ts';

// Handle --file flag: read JSON from file instead of CLI arg
let jsonInput: string | undefined;

if (Deno.args[0] === '--file' && Deno.args[1]) {
  const filePath = Deno.args[1];
  try {
    jsonInput = await Deno.readTextFile(filePath);
    // Removed debug logging to avoid polluting stderr
  } catch (e) {
    // File read errors should still go to stderr and exit with code 1
    // as these are actual sidecar failures, not application errors
    console.error(JSON.stringify({ error: `Failed to read input file: ${e}`, data: null }));
    Deno.exit(1);
  }
} else {
  jsonInput = Deno.args[0];
}

const r = await handleAgentRequest(jsonInput);
// Always output to stdout (console.log) so Rust executor can read it
// Exit code 0 is used for both success and application errors
// The error information is conveyed in the JSON response structure
console.log(r.output);
Deno.exit(r.exitCode);




