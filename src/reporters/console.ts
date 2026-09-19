import pc from "picocolors";
import type { ReadinessReport, Severity } from "../core/types.js";
import { visible } from "../utils/terminal.js";

const iconBySeverity: Record<Severity, string> = {
	pass: "✅",
	info: "ℹ️ ",
	warn: "⚠️ ",
	fail: "❌",
};

export function printConsoleReport(report: ReadinessReport): void {
	const status = report.summary.status === "healthy" ? pc.green("healthy") : report.summary.status === "warning" ? pc.yellow("warning") : pc.red("failed");

	console.log(pc.bold("\nMCP Readiness Report"));
	console.log(pc.dim("─".repeat(60)));
	console.log(`Status: ${status}`);
	console.log(`Target: ${pc.cyan(visible([report.target.command, ...report.target.args].join(" ")))}`);
	console.log(`Tools:  ${report.summary.tools}`);
	console.log(`Resources: ${report.summary.resources} · Prompts: ${report.summary.prompts}`);
	console.log(`Checks: ${pc.green(`${report.summary.passed} passed`)} · ${pc.yellow(`${report.summary.warnings} warnings`)} · ${pc.red(`${report.summary.failed} failed`)}`);

	if (report.tools.length > 0) {
		console.log(pc.bold("\nTools"));
		for (const tool of report.tools) {
			console.log(`  ${pc.cyan(visible(tool.name))}${tool.description ? pc.dim(` — ${visible(tool.description)}`) : ""}`);
		}
	}

	if (report.resources.length > 0) {
		console.log(pc.bold("\nResources"));
		for (const resource of report.resources) console.log(`  ${pc.cyan(visible(resource.name))}${resource.description ? pc.dim(` — ${visible(resource.description)}`) : ""}`);
	}

	if (report.prompts.length > 0) {
		console.log(pc.bold("\nPrompts"));
		for (const prompt of report.prompts) console.log(`  ${pc.cyan(visible(prompt.name))}${prompt.description ? pc.dim(` — ${visible(prompt.description)}`) : ""}`);
	}

	console.log(pc.bold("\nChecks"));
	for (const check of report.checks) {
		const color = check.severity === "fail" ? pc.red : check.severity === "warn" ? pc.yellow : check.severity === "pass" ? pc.green : pc.cyan;
		console.log(`  ${iconBySeverity[check.severity]} ${color(visible(check.title))}: ${visible(check.message)}`);
		for (const detail of check.details ?? []) console.log(pc.dim(`     - ${visible(detail)}`));
	}

	if (report.stderr.length > 0) {
		console.log(pc.bold("\nRecent stderr"));
		for (const line of report.stderr) console.log(pc.dim(`  ${visible(line)}`));
	}

	console.log();
}
