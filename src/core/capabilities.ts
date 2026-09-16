import type { AuditCheck, PromptInfo, ResourceInfo, ServerInfo, ToolInfo } from "./types.js";

const KNOWN_CAPABILITIES = new Set(["completions", "experimental", "extensions", "logging", "prompts", "resources", "tasks", "tools"]);

export type CapabilityInventory = {
	tools: ToolInfo[];
	resources: ResourceInfo[];
	prompts: PromptInfo[];
	discovered: Set<"tools" | "resources" | "prompts">;
};

export function checkCapabilities(
	capabilities: unknown,
	serverInfo: ServerInfo | undefined,
	inventory: CapabilityInventory,
): AuditCheck[] {
	const checks: AuditCheck[] = [];
	const advertised = isRecord(capabilities) ? Object.keys(capabilities).sort() : [];

	if (!serverInfo?.name?.trim() || !serverInfo.version?.trim()) {
		checks.push({
			id: "server.metadata",
			title: "Server metadata",
			severity: "fail",
			message: "The initialize response must identify the server with a non-empty name and version.",
		});
	} else {
		checks.push({
			id: "server.metadata",
			title: "Server metadata",
			severity: "pass",
			message: `Server identifies itself as ${serverInfo.name} ${serverInfo.version}.`,
		});
	}

	if (advertised.length === 0) {
		checks.push({
			id: "capabilities.empty",
			title: "Advertised capabilities",
			severity: "warn",
			message: "The server initialized but advertised no capabilities.",
		});
		return checks;
	}

	checks.push({
		id: "capabilities.present",
		title: "Advertised capabilities",
		severity: "pass",
		message: `Server advertised ${advertised.length} capability group${advertised.length === 1 ? "" : "s"}.`,
		details: advertised,
	});

	const unknown = advertised.filter((name) => !KNOWN_CAPABILITIES.has(name));
	if (unknown.length > 0) {
		checks.push({
			id: "capabilities.extensions",
			title: "Extension capabilities",
			severity: "info",
			message: "The server advertises capability groups outside the standard set. Review them as implementation-specific extensions.",
			details: unknown,
		});
	}

	const nonCatalog = advertised.filter((name) => !["tools", "resources", "prompts"].includes(name));
	if (nonCatalog.length > 0) {
		checks.push({
			id: "capabilities.non_catalog",
			title: "Non-catalog capabilities",
			severity: "info",
			message: "These capabilities were validated during initialization but are not actively exercised by this non-invasive check.",
			details: nonCatalog,
		});
	}

	for (const capability of ["tools", "resources", "prompts"] as const) {
		if (!advertised.includes(capability)) continue;
		const items = inventory[capability];
		checks.push({
			id: `capabilities.${capability}.discovery`,
			title: `${capitalize(capability)} discovery`,
			severity: inventory.discovered.has(capability) ? (items.length > 0 ? "pass" : "warn") : "fail",
			message: inventory.discovered.has(capability)
				? items.length > 0
					? `Advertised ${capability} capability is reachable and returned ${items.length} item${items.length === 1 ? "" : "s"}.`
					: `Advertised ${capability} capability is reachable but currently returns an empty catalog.`
				: `Server advertised ${capability}, but its catalog could not be discovered.`,
		});
	}

	return checks;
}

function capitalize(value: string): string {
	return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
