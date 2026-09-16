#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListPromptsRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
	{ name: "paginated-catalog-fixture", version: "1.0.0" },
	{ capabilities: { tools: {}, resources: {}, prompts: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async ({ params }) => params?.cursor
	? { tools: [{ name: "second_tool", description: "Read the second page safely.", inputSchema: { type: "object", properties: {} }, annotations: { readOnlyHint: true } }] }
	: { tools: [{ name: "first_tool", description: "Read the first page safely.", inputSchema: { type: "object", properties: {} }, annotations: { readOnlyHint: true } }], nextCursor: "tools-2" });

server.setRequestHandler(ListResourcesRequestSchema, async ({ params }) => params?.cursor
	? { resources: [{ uri: "file:///second.txt", name: "second" }] }
	: { resources: [{ uri: "file:///first.txt", name: "first" }], nextCursor: "resources-2" });

server.setRequestHandler(ListPromptsRequestSchema, async ({ params }) => params?.cursor
	? { prompts: [{ name: "second_prompt", description: "Second prompt" }] }
	: { prompts: [{ name: "first_prompt", description: "First prompt" }], nextCursor: "prompts-2" });

await server.connect(new StdioServerTransport());
