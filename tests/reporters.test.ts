import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReadinessReport } from "../src/core/types.js";
import { printConsoleReport } from "../src/reporters/console.js";
import { toMarkdown } from "../src/reporters/markdown.js";

const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);

function informe(cambios: Partial<ReadinessReport> = {}): ReadinessReport {
	return {
		tool: "mcp-readiness-check",
		version: "0.0.0",
		createdAt: "2026-09-19T00:00:00.000Z",
		target: { command: "node", args: ["server.mjs"] },
		summary: { status: "healthy", passed: 2, warnings: 0, failed: 0, tools: 1, resources: 1, prompts: 1 },
		tools: [{ name: "buscar", description: "Busca cosas" }],
		resources: [{ uri: "file:///a", name: "archivo", description: "Un archivo" }],
		prompts: [{ name: "resumir", description: "Resume" }],
		checks: [{ id: "c1", title: "Handshake", severity: "pass", message: "Conectado" }],
		stderr: [],
		...cambios,
	};
}

let salida: string[];

beforeEach(() => {
	salida = [];
	vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
		salida.push(args.join(" "));
	});
});
afterEach(() => vi.restoreAllMocks());

const consola = () => salida.join("\n");

describe("printConsoleReport", () => {
	it("muestra estado, destino, conteos, catálogos y checks", () => {
		printConsoleReport(informe());
		const texto = consola();
		expect(texto).toContain("MCP Readiness Report");
		expect(texto).toContain("healthy");
		expect(texto).toContain("node server.mjs");
		expect(texto).toContain("Tools:  1");
		expect(texto).toContain("Resources: 1 · Prompts: 1");
		expect(texto).toContain("buscar");
		expect(texto).toContain("Busca cosas");
		expect(texto).toContain("Handshake: Conectado");
	});

	it.each([
		["warning", "warning"],
		["failed", "failed"],
	] as const)("muestra el estado %s", (status, esperado) => {
		printConsoleReport(informe({ summary: { ...informe().summary, status } }));
		expect(consola()).toContain(esperado);
	});

	it("omite las secciones vacías", () => {
		printConsoleReport(informe({ tools: [], resources: [], prompts: [], stderr: [] }));
		const texto = consola();
		expect(texto).not.toContain("\nTools\n");
		expect(texto).not.toContain("Recent stderr");
	});

	it("incluye los detalles de cada check y el stderr reciente", () => {
		printConsoleReport(
			informe({
				checks: [{ id: "c", title: "Esquema", severity: "warn", message: "Revisar", details: ["campo x", "campo y"] }],
				stderr: ["línea de error"],
			}),
		);
		const texto = consola();
		expect(texto).toContain("- campo x");
		expect(texto).toContain("- campo y");
		expect(texto).toContain("Recent stderr");
		expect(texto).toContain("línea de error");
	});

	it("una herramienta sin descripción no imprime un guion suelto", () => {
		printConsoleReport(informe({ tools: [{ name: "sola" }] }));
		expect(consola()).not.toMatch(/sola.*—/);
	});
});

describe("seguridad de la terminal: los metadatos del servidor no son de confianza", () => {
	const hostil = informe({
		tools: [{ name: `herramienta${ESC}[2J`, description: `${ESC}]0;TITULO${BEL}${ESC}[31mVERIFICADO${ESC}[0m${ESC}]52;c;aGFja2Vk${BEL}\nStatus: healthy` }],
		resources: [{ uri: "file:///x", name: `recurso${ESC}[H`, description: `desc${BEL}` }],
		prompts: [{ name: `prompt${ESC}c`, description: "ok" }],
		checks: [{ id: "c", title: "T", severity: "pass", message: `m${ESC}[2J`, details: [`d${ESC}[1m`] }],
		stderr: [`err${ESC}]52;c;eA==${BEL}`],
	});

	it("la consola no emite ESC ni BEL provenientes del servidor", () => {
		printConsoleReport(hostil);
		expect(consola()).not.toContain(ESC);
		expect(consola()).not.toContain(BEL);
	});

	it("la consola deja visible qué se neutralizó en lugar de ocultarlo", () => {
		printConsoleReport(hostil);
		expect(consola()).toContain("\\x1b");
	});

	it("un salto de línea del servidor no puede fingir una línea del reporte", () => {
		printConsoleReport(hostil);
		const lineasFalsas = consola().split("\n").filter((linea) => linea.trim().startsWith("Status: healthy"));
		expect(lineasFalsas).toHaveLength(1); // solo la línea real del estado, no la que trae la descripción
		expect(lineasFalsas[0]).toBe("Status: healthy");
	});

	it("el Markdown tampoco contiene caracteres de control del servidor", () => {
		const md = toMarkdown(hostil);
		expect(md).not.toContain(ESC);
		expect(md).not.toContain(BEL);
	});

	it("el Markdown no permite inyectar encabezados con saltos de línea", () => {
		const md = toMarkdown(informe({ tools: [{ name: "t", description: "normal\n# Status: healthy\n## Checks" }] }));
		expect(md.split("\n").filter((l) => l.startsWith("# ") || l.startsWith("## Checks"))).toEqual(["# MCP Readiness Report", "## Checks"]);
	});
});

describe("Markdown: los textos del servidor no pueden alterar la estructura del reporte", () => {
	it("los enlaces y el HTML del servidor quedan como texto", () => {
		const md = toMarkdown(informe({ tools: [{ name: "t", description: "[pulsa aquí](https://malo.example) <img src=x onerror=1>" }] }));
		expect(md).toContain("\\[pulsa aquí\\](https://malo.example)"); // los corchetes escapados anulan el enlace
		expect(md).not.toMatch(/(^|[^\\])\]\(https:\/\/malo/);
		expect(md).not.toMatch(/(^|[^\\])<img/); // solo aparece escapado: \\<img
	});

	it("un ``` dentro del stderr no cierra el bloque de código antes de tiempo", () => {
		const lineas = toMarkdown(informe({ stderr: ["antes", "```", "# Status: healthy", "```"] })).split("\n");
		const abre = lineas.findIndex((l) => /^`{4,}text$/.test(l));
		expect(abre).toBeGreaterThan(-1);
		const cierre = lineas.findIndex((l, i) => i > abre && /^`{4,}$/.test(l));
		expect(cierre).toBe(abre + 5); // abre, 4 líneas de stderr, cierra
		expect(lineas.slice(abre + 1, cierre)).toEqual(["antes", "```", "# Status: healthy", "```"]);
	});

	it("un ``` dentro del esquema de una herramienta no cierra su bloque JSON", () => {
		const md = toMarkdown(informe({ tools: [{ name: "t", inputSchema: { description: "```\n# inyectado" } }] }));
		expect(md.split("\n").some((l) => l.startsWith("# inyectado"))).toBe(false);
	});

	it("un ` dentro del destino no rompe el código en línea", () => {
		const md = toMarkdown(informe({ target: { command: "node", args: ["a`b"] } }));
		expect(md).toContain("``node a`b``");
	});

	it("los caracteres que reordenan el texto (RLO) se muestran escapados", () => {
		const md = toMarkdown(informe({ tools: [{ name: "abc\u202Efdp.exe" }] }));
		expect(md).not.toContain("\u202E");
		expect(md).toContain("\\u202e");
	});
});

describe("toMarkdown", () => {
	it("genera el reporte completo con catálogos, checks y detalles", () => {
		const md = toMarkdown(
			informe({
				checks: [{ id: "c", title: "Esquema", severity: "fail", message: "Roto", details: ["campo x"] }],
				stderr: ["algo salió mal"],
			}),
		);
		expect(md).toContain("# MCP Readiness Report");
		expect(md).toContain("- **Status:** healthy");
		expect(md).toContain("`node server.mjs`");
		expect(md).toContain("### buscar");
		expect(md).toContain("- **archivo** — file:///a — Un archivo");
		expect(md).toContain("- **resumir** — Resume");
		expect(md).toContain("- **FAIL** — Esquema: Roto");
		expect(md).toContain("  - campo x");
		expect(md).toContain("```text\nalgo salió mal\n```");
		expect(md.endsWith("\n")).toBe(true);
	});

	it("sin herramientas indica que no se encontraron y omite catálogos vacíos", () => {
		const md = toMarkdown(informe({ tools: [], resources: [], prompts: [], stderr: [] }));
		expect(md).toContain("No tools found.");
		expect(md).not.toContain("## Resources");
		expect(md).not.toContain("## Prompts");
		expect(md).not.toContain("Recent stderr");
	});

	it("una herramienta sin descripción usa el texto por defecto", () => {
		expect(toMarkdown(informe({ tools: [{ name: "t" }] }))).toContain("No description provided.");
	});
});
