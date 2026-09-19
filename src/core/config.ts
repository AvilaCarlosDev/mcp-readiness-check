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

	let raw: unknown;
	try {
		raw = JSON.parse(readFileSync(fullPath, "utf8"));
	} catch (error) {
		const detalle = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid config ${fullPath}: not valid JSON (${detalle})`);
	}

	const resultado = ConfigSchema.safeParse(raw);
	if (!resultado.success) {
		const problemas = resultado.error.issues.map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
		throw new Error(`Invalid config ${fullPath}:\n${problemas.join("\n")}`);
	}
	return resultado.data;
}

export function targetFromConfig(serverName: string, configPath?: string): ServerTarget {
	const config = loadConfig(configPath);
	// hasOwn evita que nombres como "constructor" o "toString" se lean como servidores.
	const server = Object.hasOwn(config.servers, serverName) ? config.servers[serverName] : undefined;
	if (!server) {
		const available = Object.keys(config.servers).join(", ") || "none";
		throw new Error(`Server '${serverName}' not found in config. Available: ${available}`);
	}
	return { ...server, args: server.args ?? [] };
}

export function targetFromCommand(command: string, args: string[], cwd?: string): ServerTarget {
	return { command, args, cwd };
}
