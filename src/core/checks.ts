import { checkToolSchemas } from "./schema.js";
import type { AuditCheck, ToolInfo } from "./types.js";

const TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export function checkToolCatalog(tools: ToolInfo[]): AuditCheck[] {
	const checks: AuditCheck[] = [];

	if (tools.length === 0) {
		checks.push({
			id: "tools.empty",
			title: "No tools exposed",
			severity: "warn",
			message: "The server connected successfully but did not expose any tools.",
		});
		return checks;
	}

	checks.push({
		id: "tools.present",
		title: "Tools available",
		severity: "pass",
		message: `The server exposes ${tools.length} tool${tools.length === 1 ? "" : "s"}.`,
	});

	const names = new Set<string>();
	const duplicates = new Set<string>();
	for (const tool of tools) {
		if (names.has(tool.name)) duplicates.add(tool.name);
		names.add(tool.name);
	}

	if (duplicates.size > 0) {
		checks.push({
			id: "tools.duplicate_names",
			title: "Duplicate tool names",
			severity: "fail",
			message: "Tool names must be unique.",
			details: [...duplicates],
		});
	} else {
		checks.push({
			id: "tools.unique_names",
			title: "Unique tool names",
			severity: "pass",
			message: "All tool names are unique.",
		});
	}

	const invalidNames = tools.filter((tool) => !TOOL_NAME_PATTERN.test(tool.name)).map((tool) => tool.name);
	if (invalidNames.length > 0) {
		checks.push({
			id: "tools.invalid_names",
			title: "Invalid tool names",
			severity: "warn",
			message: "Some tool names do not match the recommended MCP-safe pattern: letters, numbers, underscores or hyphens, 1-128 chars.",
			details: invalidNames,
		});
	}

	const missingDescriptions = tools.filter((tool) => !tool.description || tool.description.trim().length < 12).map((tool) => tool.name);
	if (missingDescriptions.length > 0) {
		checks.push({
			id: "tools.descriptions",
			title: "Tool descriptions",
			severity: "warn",
			message: "Some tools have missing or very short descriptions. Agents perform better with clear tool descriptions.",
			details: missingDescriptions,
		});
	} else {
		checks.push({
			id: "tools.descriptions",
			title: "Tool descriptions",
			severity: "pass",
			message: "All tools include useful descriptions.",
		});
	}

	for (const tool of tools) {
		checks.push(...checkToolSchemas(tool));
		checks.push(...checkToolAnnotations(tool));
	}

	return checks;
}

function checkToolAnnotations(tool: ToolInfo): AuditCheck[] {
	const annotations = tool.annotations;
	if (!annotations) return [];

	const checks: AuditCheck[] = [];
	if (annotations.destructiveHint === true && annotations.readOnlyHint === true) {
		checks.push({
			id: `tool.${tool.name}.annotations.conflict`,
			title: `Conflicting annotations: ${tool.name}`,
			severity: "warn",
			message: "Tool is marked as both destructive and read-only. This can confuse agents and reviewers.",
		});
	}

	return checks;
}
