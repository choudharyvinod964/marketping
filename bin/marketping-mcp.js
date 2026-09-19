#!/usr/bin/env node
/*
 * marketping-mcp — stdio bridge to MarketPing's remote MCP server.
 *
 * This file does one thing: it runs `mcp-remote` against https://mcp.marketping.in/mcp so that
 * clients which only speak stdio (older Claude Desktop builds, some editors) can use the server.
 * It reads no environment variables, stores no credentials, makes no other network calls and
 * adds no telemetry. Everything the assistant sends goes to that one endpoint over HTTPS.
 *
 * The endpoint itself needs no API key; four account tools use OAuth 2.1, which mcp-remote
 * handles in the browser and stores under ~/.mcp-auth.
 */
"use strict";

const { spawn } = require("node:child_process");
const path = require("node:path");

const ENDPOINT = "https://mcp.marketping.in/mcp";

// mcp-remote's CLI entry, resolved from this package's own dependency so no network install
// happens at run time.
const cli = path.join(path.dirname(require.resolve("mcp-remote/package.json")), "dist", "proxy.js");

const child = spawn(process.execPath, [cli, ENDPOINT, ...process.argv.slice(2)], { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
