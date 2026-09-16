#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

console.error(`api_key=${process.env.TEST_API_KEY ?? "missing"}`);

const server = new McpServer({ name: "secret-redaction-fixture", version: "0.0.0" });

server.registerTool(
	"echo",
	{
		description: "Return a message for the report-redaction integration test.",
		inputSchema: { message: z.string() },
		annotations: { readOnlyHint: true },
	},
	async ({ message }) => ({ content: [{ type: "text", text: message }] }),
);

await server.connect(new StdioServerTransport());
