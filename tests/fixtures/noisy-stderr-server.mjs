#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

for (let index = 0; index < 60; index += 1) console.error(`fixture-line-${index}`);

const server = new McpServer({ name: "noisy-stderr-fixture", version: "1.0.0" });
server.registerTool(
	"echo",
	{ description: "Return a test message without side effects.", inputSchema: { message: z.string() }, annotations: { readOnlyHint: true } },
	async ({ message }) => ({ content: [{ type: "text", text: message }] }),
);
await server.connect(new StdioServerTransport());
