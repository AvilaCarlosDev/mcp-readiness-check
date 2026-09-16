import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { checkCapabilities, type CapabilityInventory } from "./capabilities.js";
import { checkToolCatalog } from "./checks.js";
import { redactText, sanitizeReport } from "./redact.js";
import { auditSecurity } from "./security.js";
import type { AuditCheck, PromptInfo, ReadinessOptions, ReadinessReport, ResourceInfo, ServerInfo, ServerTarget, ToolInfo } from "./types.js";
import { packageVersion } from "../utils/package.js";

const MAX_CATALOG_PAGES = 100;
const MAX_CATALOG_ITEMS = 10_000;
const MAX_STDERR_LINES = 50;
const MAX_STDERR_LINE_LENGTH = 2_000;

export async function runReadinessCheck(target: ServerTarget, options: ReadinessOptions): Promise<ReadinessReport> {
	const checks: AuditCheck[] = [];
	const stderrLines: string[] = [];
	const inventory: CapabilityInventory = { tools: [], resources: [], prompts: [], discovered: new Set() };
	let capabilities: unknown;
	let serverInfo: ServerInfo | undefined;
	let instructions: string | undefined;
	let transport: StdioClientTransport | undefined;

	const client = new Client({ name: "mcp-readiness-check", version: packageVersion() }, { capabilities: {} });

	try {
		transport = new StdioClientTransport({ command: target.command, args: target.args, cwd: target.cwd, env: target.env, stderr: "pipe" });
		transport.stderr?.on("data", (chunk: Buffer) => {
			for (const line of chunk.toString("utf8").split(/\r?\n/).filter(Boolean)) stderrLines.push(line.slice(0, MAX_STDERR_LINE_LENGTH));
			if (stderrLines.length > MAX_STDERR_LINES) stderrLines.splice(0, stderrLines.length - MAX_STDERR_LINES);
		});

		await withTimeout(client.connect(transport), options.timeoutMs, "Timed out while connecting to MCP server.");
		checks.push({ id: "connection.ok", title: "Connection", severity: "pass", message: "MCP server initialized successfully." });

		capabilities = client.getServerCapabilities();
		serverInfo = client.getServerVersion() as ServerInfo | undefined;
		instructions = client.getInstructions();

		if (hasCapability(capabilities, "tools")) {
			await discoverCatalog("tools", inventory, checks, () => listAllTools(client, options.timeoutMs));
			if (inventory.discovered.has("tools") && inventory.tools.length > 0) checks.push(...checkToolCatalog(inventory.tools));
		}
		if (hasCapability(capabilities, "resources")) {
			await discoverCatalog("resources", inventory, checks, () => listAllResources(client, options.timeoutMs));
		}
		if (hasCapability(capabilities, "prompts")) {
			await discoverCatalog("prompts", inventory, checks, () => listAllPrompts(client, options.timeoutMs));
		}

		checks.push(...checkCapabilities(capabilities, serverInfo, inventory));
		if (options.includeSecurityAudit) checks.push(...auditSecurity(inventory.tools, instructions, target));
	} catch (error) {
		checks.push({ id: "readiness.error", title: "Readiness check failed", severity: "fail", message: redactText(error instanceof Error ? error.message : String(error)) });
	} finally {
		try {
			await transport?.close();
		} catch {
			// The report already captured the actionable diagnostic result.
		}
	}

	const failed = checks.filter((check) => check.severity === "fail").length;
	const warnings = checks.filter((check) => check.severity === "warn").length;
	const passed = checks.filter((check) => check.severity === "pass").length;

	return sanitizeReport({
		tool: "mcp-readiness-check",
		version: packageVersion(),
		createdAt: new Date().toISOString(),
		target,
		summary: {
			status: failed > 0 ? "failed" : warnings > 0 ? "warning" : "healthy",
			passed,
			warnings,
			failed,
			tools: inventory.tools.length,
			resources: inventory.resources.length,
			prompts: inventory.prompts.length,
		},
		server: { info: serverInfo, capabilities, instructions },
		tools: inventory.tools,
		resources: inventory.resources,
		prompts: inventory.prompts,
		checks,
		stderr: stderrLines.slice(-50),
	});
}

async function discoverCatalog<K extends "tools" | "resources" | "prompts">(
	capability: K,
	inventory: CapabilityInventory,
	checks: AuditCheck[],
	load: () => Promise<CapabilityInventory[K]>,
): Promise<void> {
	try {
		inventory[capability] = await load();
		inventory.discovered.add(capability);
	} catch (error) {
		checks.push({
			id: `capabilities.${capability}.error`,
			title: `${capitalize(capability)} discovery failed`,
			severity: "fail",
			message: redactText(error instanceof Error ? error.message : String(error)),
		});
	}
}

async function listAllTools(client: Client, timeoutMs: number): Promise<ToolInfo[]> {
	const tools: ToolInfo[] = [];
	const seen = new Set<string>();
	let cursor: string | undefined;
	for (let page = 0; page < MAX_CATALOG_PAGES; page += 1) {
		const result = await withTimeout(client.listTools(cursor ? { cursor } : undefined), timeoutMs, "Timed out while listing tools.");
		tools.push(...result.tools.map((tool) => ({
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
			outputSchema: tool.outputSchema,
			annotations: tool.annotations as Record<string, unknown> | undefined,
		})));
		if (tools.length > MAX_CATALOG_ITEMS) throw new Error(`Tools catalog exceeded ${MAX_CATALOG_ITEMS} items.`);
		cursor = nextCursor(result.nextCursor, seen, "tools");
		if (!cursor) return tools;
	}
	throw new Error(`Tools catalog exceeded ${MAX_CATALOG_PAGES} pages.`);
}

async function listAllResources(client: Client, timeoutMs: number): Promise<ResourceInfo[]> {
	const resources: ResourceInfo[] = [];
	const seen = new Set<string>();
	let cursor: string | undefined;
	for (let page = 0; page < MAX_CATALOG_PAGES; page += 1) {
		const result = await withTimeout(client.listResources(cursor ? { cursor } : undefined), timeoutMs, "Timed out while listing resources.");
		resources.push(...result.resources.map((resource) => ({ uri: resource.uri, name: resource.name, description: resource.description, mimeType: resource.mimeType })));
		if (resources.length > MAX_CATALOG_ITEMS) throw new Error(`Resources catalog exceeded ${MAX_CATALOG_ITEMS} items.`);
		cursor = nextCursor(result.nextCursor, seen, "resources");
		if (!cursor) return resources;
	}
	throw new Error(`Resources catalog exceeded ${MAX_CATALOG_PAGES} pages.`);
}

async function listAllPrompts(client: Client, timeoutMs: number): Promise<PromptInfo[]> {
	const prompts: PromptInfo[] = [];
	const seen = new Set<string>();
	let cursor: string | undefined;
	for (let page = 0; page < MAX_CATALOG_PAGES; page += 1) {
		const result = await withTimeout(client.listPrompts(cursor ? { cursor } : undefined), timeoutMs, "Timed out while listing prompts.");
		prompts.push(...result.prompts.map((prompt) => ({ name: prompt.name, description: prompt.description, arguments: prompt.arguments })));
		if (prompts.length > MAX_CATALOG_ITEMS) throw new Error(`Prompts catalog exceeded ${MAX_CATALOG_ITEMS} items.`);
		cursor = nextCursor(result.nextCursor, seen, "prompts");
		if (!cursor) return prompts;
	}
	throw new Error(`Prompts catalog exceeded ${MAX_CATALOG_PAGES} pages.`);
}

function nextCursor(cursor: string | undefined, seen: Set<string>, catalog: string): string | undefined {
	if (!cursor) return undefined;
	if (seen.has(cursor)) throw new Error(`${capitalize(catalog)} catalog returned a repeated pagination cursor.`);
	seen.add(cursor);
	return cursor;
}

function hasCapability(capabilities: unknown, name: string): boolean {
	return Boolean(capabilities) && typeof capabilities === "object" && Object.prototype.hasOwnProperty.call(capabilities, name);
}

function capitalize(value: string): string {
	return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
	let timer: NodeJS.Timeout | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(message)), timeoutMs);
	});
	try {
		return await Promise.race([promise, timeout]);
	} finally {
		if (timer) clearTimeout(timer);
	}
}
