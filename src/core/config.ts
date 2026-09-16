import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import type { ServerTarget } from "./types.js";

const ConfigSchema = z.object({
	servers: z.record(
		z.string(),
		z.object({
			command: z.string().min(1),
			args: z.array(z.string()).default([]),
			cwd: z.string().optional(),
			env: z.record(z.string(), z.string()).optional(),
		}),
	),
});

export type ReadinessConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(path = "mcp-readiness.config.json"): ReadinessConfig {
	const fullPath = resolve(path);
	if (!existsSync(fullPath)) {
		throw new Error(`Config file not found: ${fullPath}`);
	}

	const raw = JSON.parse(readFileSync(fullPath, "utf8"));
	return ConfigSchema.parse(raw);
}

export function targetFromConfig(serverName: string, configPath?: string): ServerTarget {
	const config = loadConfig(configPath);
	const server = config.servers[serverName];
	if (!server) {
		const available = Object.keys(config.servers).join(", ") || "none";
		throw new Error(`Server '${serverName}' not found in config. Available: ${available}`);
	}
	return { ...server, args: server.args ?? [] };
}

export function targetFromCommand(command: string, args: string[], cwd?: string): ServerTarget {
	return { command, args, cwd };
}
