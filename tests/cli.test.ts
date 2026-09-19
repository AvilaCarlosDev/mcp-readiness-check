import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXIT_CODES, run } from "../src/program.js";

const raiz = resolve(import.meta.dirname, "..");
const version = JSON.parse(readFileSync(join(raiz, "package.json"), "utf8")).version as string;
const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);

let dir: string;
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "mcp-readiness-cli-"));
});
afterEach(() => {
	rmSync(dir, { recursive: true, force: true });
	process.exitCode = undefined;
});

/** Ejecuta el programa en este mismo proceso (permite medir cobertura). */
async function ejecutar(args: string[]) {
	const salida: string[] = [];
	const errores: string[] = [];
	const log = vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void salida.push(a.join(" ")));
	const err = vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => void errores.push(a.join(" ")));
	try {
		const codigo = await run(["node", "mcp-readiness-check", ...args]);
		return { codigo, salida: salida.join("\n"), error: errores.join("\n") };
	} finally {
		log.mockRestore();
		err.mockRestore();
		process.exitCode = undefined;
	}
}

/** Ejecuta el binario real como lo haría un CI: proceso aparte, código de salida real. */
function proceso(args: string[]) {
	const r = spawnSync(process.execPath, ["--import", "tsx", join(raiz, "src/cli.ts"), ...args], {
		cwd: raiz,
		encoding: "utf8",
		env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
		timeout: 25_000,
	});
	return { codigo: r.status, salida: r.stdout, error: r.stderr };
}

const servidorEjemplo = join(raiz, "examples/echo-server.mjs");
const ejemplo = ["check", "--cmd", "node", "--args", servidorEjemplo];
const hostil = join(raiz, "tests/fixtures/hostile-metadata-server.mjs");

describe("binario real: el contrato de códigos de salida que usa el CI de quien lo adopta", () => {
	it("--version imprime la versión del paquete", () => {
		expect(proceso(["--version"]).salida.trim()).toBe(version);
	});

	it("un servidor sano termina con código 0", () => {
		const r = proceso(ejemplo);
		expect(r.codigo).toBe(0);
		expect(r.salida).toContain("MCP Readiness Report");
	});

	it("un servidor que muere antes del handshake termina con código 1", () => {
		const r = proceso(["check", "--cmd", "node", "--args", join(raiz, "tests/fixtures/exits-immediately.mjs"), "--timeout", "5000"]);
		expect(r.codigo).toBe(1);
	});

	it("un uso incorrecto (falta --cmd) termina con código 2, distinto de un check fallido", () => {
		const r = proceso(["check"]);
		expect(r.codigo).toBe(2);
		expect(r.error).toContain("Provide either --server from config or --cmd <command>.");
	});

	it("una opción desconocida termina con código 2 y lo explica", () => {
		const r = proceso(["check", "--cmd", "node", "--bandera-falsa"]);
		expect(r.codigo).toBe(2);
		expect(r.error).toContain("unknown option '--bandera-falsa'");
	});

	it("un subcomando desconocido termina con código 2", () => {
		const r = proceso(["comando-falso"]);
		expect(r.codigo).toBe(2);
		expect(r.error).toContain("unknown command 'comando-falso'");
	});

	it("--help termina con código 0 y describe los códigos de salida", () => {
		const r = proceso(["--help"]);
		expect(r.codigo).toBe(0);
		expect(r.salida).toContain("Exit codes");
	});

	it("un servidor hostil no puede inyectar secuencias de escape en la terminal", () => {
		const r = proceso(["check", "--cmd", "node", "--args", hostil]);
		expect(r.salida).toContain("MCP Readiness Report");
		expect(r.salida).not.toContain(ESC);
		expect(r.salida).not.toContain(BEL);
	});
});

describe("check: errores de uso", () => {
	it("un servidor que muere antes del handshake termina con código 1", async () => {
		const r = await ejecutar(["check", "--cmd", "node", "--args", join(raiz, "tests/fixtures/exits-immediately.mjs"), "--timeout", "5000"]);
		expect(r.codigo).toBe(1);
	});

	it("un comando que no existe termina con código 1 y un mensaje", async () => {
		const r = await ejecutar(["check", "--cmd", "comando-que-no-existe-xyz", "--timeout", "5000"]);
		expect(r.codigo).toBe(1);
		expect(r.salida + r.error).not.toBe("");
	});

	it("sin --cmd ni --server explica qué falta y termina con código 2", async () => {
		const r = await ejecutar(["check"]);
		expect(r.codigo).toBe(EXIT_CODES.usage);
		expect(r.error).toContain("Provide either --server from config or --cmd <command>.");
	});

	it.each(["abc", "0", "-5"])("un --timeout inválido (%s) termina con código 2 y lo explica", async (valor) => {
		const r = await ejecutar([...ejemplo, "--timeout", valor]);
		expect(r.codigo).toBe(EXIT_CODES.usage);
		expect(r.error).toContain("--timeout must be a positive number of milliseconds.");
	});

	it("--server con un archivo de configuración inexistente termina con código 2", async () => {
		const r = await ejecutar(["check", "--server", "x", "--config", join(dir, "no-existe.json")]);
		expect(r.codigo).toBe(EXIT_CODES.usage);
		expect(r.error).toContain("Config file not found");
	});

	it("--server con un nombre que no está en la configuración lista los disponibles", async () => {
		const config = join(dir, "c.json");
		writeFileSync(config, JSON.stringify({ servers: { eco: { command: "node" } } }));
		const r = await ejecutar(["check", "--server", "otro", "--config", config]);
		expect(r.codigo).toBe(EXIT_CODES.usage);
		expect(r.error).toContain("Available: eco");
	});

	it("--server con una configuración inválida nombra el archivo y el campo", async () => {
		const config = join(dir, "c.json");
		writeFileSync(config, JSON.stringify({ servers: { eco: { args: [] } } }));
		const r = await ejecutar(["check", "--server", "eco", "--config", config]);
		expect(r.codigo).toBe(EXIT_CODES.usage);
		expect(r.error).toContain(config);
		expect(r.error).toContain("servers.eco.command");
	});

	it("--server no acepta propiedades heredadas del objeto como nombre de servidor", async () => {
		const config = join(dir, "c.json");
		writeFileSync(config, JSON.stringify({ servers: { eco: { command: "node" } } }));
		const r = await ejecutar(["check", "--server", "constructor", "--config", config]);
		expect(r.codigo).toBe(EXIT_CODES.usage);
		expect(r.error).toContain("not found in config");
	});
});

describe("check: formatos de salida", () => {
	it("un servidor sano termina con código 0 y muestra el reporte", async () => {
		const r = await ejecutar(ejemplo);
		expect(r.codigo).toBe(0);
		expect(r.salida).toContain("MCP Readiness Report");
	});

	it("--json imprime solo JSON válido con el resumen", async () => {
		const r = await ejecutar([...ejemplo, "--json"]);
		expect(r.codigo).toBe(0);
		const informe = JSON.parse(r.salida);
		expect(informe.tool).toBe("mcp-readiness-check");
		expect(informe.summary.status).toBe("healthy");
		expect(informe.summary.failed).toBe(0);
	});

	it("--markdown escribe el archivo y lo avisa", async () => {
		const destino = join(dir, "reporte.md");
		const r = await ejecutar([...ejemplo, "--markdown", destino]);
		expect(r.codigo).toBe(0);
		expect(r.salida).toContain(`Markdown report written to: ${destino}`);
		expect(readFileSync(destino, "utf8")).toContain("# MCP Readiness Report");
	});

	it("--json --markdown escribe el archivo sin ensuciar el JSON de la salida", async () => {
		const destino = join(dir, "reporte.md");
		const r = await ejecutar([...ejemplo, "--json", "--markdown", destino]);
		expect(() => JSON.parse(r.salida)).not.toThrow();
		expect(existsSync(destino)).toBe(true);
	});

	it("--no-security-audit omite los checks de seguridad estática", async () => {
		const con = JSON.parse((await ejecutar([...ejemplo, "--json"])).salida).checks.length;
		const sin = JSON.parse((await ejecutar([...ejemplo, "--json", "--no-security-audit"])).salida).checks.length;
		expect(sin).toBeLessThan(con);
	});

	it("funciona con un servidor definido en el archivo de configuración", async () => {
		const config = join(dir, "c.json");
		writeFileSync(config, JSON.stringify({ servers: { eco: { command: "node", args: [servidorEjemplo] } } }));
		const r = await ejecutar(["check", "--server", "eco", "--config", config, "--json"]);
		expect(r.codigo).toBe(0);
		expect(JSON.parse(r.salida).summary.status).toBe("healthy");
	});

	it("un servidor hostil: la consola no recibe bytes de control y --json los deja escapados", async () => {
		const consola = await ejecutar(["check", "--cmd", "node", "--args", hostil]);
		expect(consola.salida).not.toContain(ESC);
		expect(consola.salida).not.toContain(BEL);
		const json = await ejecutar(["check", "--cmd", "node", "--args", hostil, "--json"]);
		expect(json.salida).not.toContain(ESC);
		expect(JSON.parse(json.salida).tools[0].name).toContain("herramienta");
	});
});

describe("init", () => {
	it("crea el archivo de ejemplo con un servidor válido", async () => {
		const destino = join(dir, "mi.config.json");
		const r = await ejecutar(["init", "--output", destino]);
		expect(r.codigo).toBe(0);
		expect(r.salida).toContain(`Created ${destino}`);
		expect(JSON.parse(readFileSync(destino, "utf8")).servers.filesystem.command).toBe("npx");
	});

	it("no sobrescribe un archivo existente sin --force", async () => {
		const destino = join(dir, "mi.config.json");
		writeFileSync(destino, "contenido original");
		const r = await ejecutar(["init", "--output", destino]);
		expect(r.codigo).toBe(EXIT_CODES.usage);
		expect(r.error).toContain("Refusing to overwrite");
		expect(readFileSync(destino, "utf8")).toBe("contenido original");
	});

	it("con --force sobrescribe", async () => {
		const destino = join(dir, "mi.config.json");
		writeFileSync(destino, "contenido original");
		expect((await ejecutar(["init", "--output", destino, "--force"])).codigo).toBe(0);
		expect(readFileSync(destino, "utf8")).toContain("servers");
	});
});
