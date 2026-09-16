#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
	name: "mcp-readiness-check-echo-example",
	version: "0.1.0",
});

server.registerTool(
	"echo",
	{
		title: "Echo",
		description: "Return the provided message. Useful for smoke testing MCP clients.",
		inputSchema: {
			message: z.string().describe("Message to return"),
		},
		annotations: {
			readOnlyHint: true,
			idempotentHint: true,
		},
	},
	async ({ message }) => ({
		content: [{ type: "text", text: message }],
	}),
);

const transport = new StdioServerTransport();
await server.connect(transport);
