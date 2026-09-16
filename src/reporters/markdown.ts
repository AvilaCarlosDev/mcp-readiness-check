import type { ReadinessReport } from "../core/types.js";

export function toMarkdown(report: ReadinessReport): string {
	const lines: string[] = [];
	lines.push("# MCP Readiness Report");
	lines.push("");
	lines.push(`- **Status:** ${report.summary.status}`);
	lines.push(`- **Created at:** ${report.createdAt}`);
	lines.push(`- **Target:** \`${[report.target.command, ...report.target.args].join(" ")}\``);
	lines.push(`- **Tools:** ${report.summary.tools}`);
	lines.push(`- **Resources:** ${report.summary.resources}`);
	lines.push(`- **Prompts:** ${report.summary.prompts}`);
	lines.push(`- **Checks:** ${report.summary.passed} passed · ${report.summary.warnings} warnings · ${report.summary.failed} failed`);
	lines.push("");

	lines.push("## Tools");
	lines.push("");
	if (report.tools.length === 0) lines.push("No tools found.");
	for (const tool of report.tools) {
		lines.push(`### ${tool.name}`);
		lines.push("");
		lines.push(tool.description ?? "No description provided.");
		lines.push("");
		lines.push("```json");
		lines.push(JSON.stringify(tool.inputSchema ?? {}, null, 2));
		lines.push("```");
		lines.push("");
	}

	if (report.resources.length > 0) {
		lines.push("## Resources", "");
		for (const resource of report.resources) lines.push(`- **${resource.name}** — ${resource.uri}${resource.description ? ` — ${resource.description}` : ""}`);
		lines.push("");
	}

	if (report.prompts.length > 0) {
		lines.push("## Prompts", "");
		for (const prompt of report.prompts) lines.push(`- **${prompt.name}**${prompt.description ? ` — ${prompt.description}` : ""}`);
		lines.push("");
	}

	lines.push("## Checks");
	lines.push("");
	for (const check of report.checks) {
		lines.push(`- **${check.severity.toUpperCase()}** — ${check.title}: ${check.message}`);
		for (const detail of check.details ?? []) lines.push(`  - ${detail}`);
	}

	if (report.stderr.length > 0) {
		lines.push("");
		lines.push("## Recent stderr");
		lines.push("");
		lines.push("```text");
		lines.push(...report.stderr);
		lines.push("```");
	}

	return `${lines.join("\n")}\n`;
}
