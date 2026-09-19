import type { ReadinessReport } from "../core/types.js";
import { unaLinea } from "../utils/terminal.js";

// Los textos del servidor no son de confianza: sin esto podrían abrir enlaces o HTML
// en el reporte que alguien pegue en un PR, o cerrar un bloque de código antes de tiempo.
function texto(valor: string): string {
	return unaLinea(valor).replace(/[\\`\[\]<>]/g, "\\$&");
}

function delimitador(contenido: string, minimo: number): string {
	const rachas = contenido.match(/`+/g) ?? [];
	return "`".repeat(Math.max(minimo, ...rachas.map((r) => r.length + 1)));
}

function codigoEnLinea(contenido: string): string {
	const limpio = unaLinea(contenido);
	const marca = delimitador(limpio, 1);
	// Un espacio separa el contenido de la marca solo cuando este empieza o termina con "`".
	const relleno = limpio.startsWith("`") || limpio.endsWith("`") ? " " : "";
	return `${marca}${relleno}${limpio}${relleno}${marca}`;
}

function bloque(lineas: string[], lenguaje: string): string[] {
	const marca = delimitador(lineas.join("\n"), 3);
	return [`${marca}${lenguaje}`, ...lineas, marca];
}

export function toMarkdown(report: ReadinessReport): string {
	const lines: string[] = [];
	lines.push("# MCP Readiness Report");
	lines.push("");
	lines.push(`- **Status:** ${report.summary.status}`);
	lines.push(`- **Created at:** ${report.createdAt}`);
	lines.push(`- **Target:** ${codigoEnLinea([report.target.command, ...report.target.args].join(" "))}`);
	lines.push(`- **Tools:** ${report.summary.tools}`);
	lines.push(`- **Resources:** ${report.summary.resources}`);
	lines.push(`- **Prompts:** ${report.summary.prompts}`);
	lines.push(`- **Checks:** ${report.summary.passed} passed · ${report.summary.warnings} warnings · ${report.summary.failed} failed`);
	lines.push("");

	lines.push("## Tools");
	lines.push("");
	if (report.tools.length === 0) lines.push("No tools found.");
	for (const tool of report.tools) {
		lines.push(`### ${texto(tool.name)}`);
		lines.push("");
		lines.push(tool.description === undefined ? "No description provided." : texto(tool.description));
		lines.push("");
		lines.push(...bloque(JSON.stringify(tool.inputSchema ?? {}, null, 2).split("\n"), "json"));
		lines.push("");
	}

	if (report.resources.length > 0) {
		lines.push("## Resources", "");
		for (const resource of report.resources) lines.push(`- **${texto(resource.name)}** — ${texto(resource.uri)}${resource.description ? ` — ${texto(resource.description)}` : ""}`);
		lines.push("");
	}

	if (report.prompts.length > 0) {
		lines.push("## Prompts", "");
		for (const prompt of report.prompts) lines.push(`- **${texto(prompt.name)}**${prompt.description ? ` — ${texto(prompt.description)}` : ""}`);
		lines.push("");
	}

	lines.push("## Checks");
	lines.push("");
	for (const check of report.checks) {
		lines.push(`- **${check.severity.toUpperCase()}** — ${texto(check.title)}: ${texto(check.message)}`);
		for (const detail of check.details ?? []) lines.push(`  - ${texto(detail)}`);
	}

	if (report.stderr.length > 0) {
		lines.push("");
		lines.push("## Recent stderr");
		lines.push("");
		lines.push(...bloque(report.stderr.map((linea) => unaLinea(linea)), "text"));
	}

	return `${lines.join("\n")}\n`;
}
