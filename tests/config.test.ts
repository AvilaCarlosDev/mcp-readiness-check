import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig, targetFromCommand, targetFromConfig } from "../src/core/config.js";

let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), "mcp-readiness-config-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function escribir(contenido: string, nombre = "mcp-readiness.config.json"): string {
	const ruta = join(dir, nombre);
	writeFileSync(ruta, contenido);
	return ruta;
}

describe("loadConfig", () => {
	it("lee una configuración válida y aplica args vacío por defecto", () => {
		const ruta = escribir(JSON.stringify({ servers: { api: { command: "node" } } }));
		expect(loadConfig(ruta).servers.api).toEqual({ command: "node", args: [] });
	});

	it("conserva args, cwd y env", () => {
		const ruta = escribir(
			JSON.stringify({ servers: { api: { command: "node", args: ["s.mjs"], cwd: "/x", env: { TOKEN: "t" } } } }),
		);
		expect(loadConfig(ruta).servers.api).toEqual({ command: "node", args: ["s.mjs"], cwd: "/x", env: { TOKEN: "t" } });
	});

	it("usa mcp-readiness.config.json del directorio actual cuando no se indica ruta", () => {
		escribir(JSON.stringify({ servers: { local: { command: "node" } } }));
		const anterior = process.cwd();
		process.chdir(dir);
		try {
			expect(Object.keys(loadConfig().servers)).toEqual(["local"]);
		} finally {
			process.chdir(anterior);
		}
	});

	it("informa la ruta cuando el archivo no existe", () => {
		const ruta = join(dir, "no-existe.json");
		expect(() => loadConfig(ruta)).toThrowError(`Config file not found: ${ruta}`);
	});

	it("un JSON inválido indica de qué archivo se trata", () => {
		const ruta = escribir("{ esto no es json");
		expect(() => loadConfig(ruta)).toThrowError(new RegExp(`${ruta.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*not valid JSON`));
	});

	it("un archivo vacío se trata como JSON inválido, no como un error críptico", () => {
		const ruta = escribir("");
		expect(() => loadConfig(ruta)).toThrowError(/not valid JSON/);
	});

	it("un error de esquema nombra el servidor y el campo, en texto legible", () => {
		const ruta = escribir(JSON.stringify({ servers: { api: { args: ["x"] } } }));
		let mensaje = "";
		try {
			loadConfig(ruta);
		} catch (error) {
			mensaje = (error as Error).message;
		}
		expect(mensaje).toContain("servers.api.command");
		expect(mensaje.trim().startsWith("[")).toBe(false);
	});

	it("rechaza un comando vacío", () => {
		const ruta = escribir(JSON.stringify({ servers: { api: { command: "" } } }));
		expect(() => loadConfig(ruta)).toThrowError(/servers\.api\.command/);
	});

	it("rechaza args que no son una lista de textos", () => {
		const ruta = escribir(JSON.stringify({ servers: { api: { command: "node", args: "no-lista" } } }));
		expect(() => loadConfig(ruta)).toThrowError(/servers\.api\.args/);
	});

	it("rechaza un archivo sin la clave servers", () => {
		const ruta = escribir(JSON.stringify({ otra: {} }));
		expect(() => loadConfig(ruta)).toThrowError(/servers/);
	});
});

describe("targetFromConfig", () => {
	it("devuelve el servidor pedido", () => {
		const ruta = escribir(JSON.stringify({ servers: { a: { command: "node", args: ["a.mjs"] }, b: { command: "python" } } }));
		expect(targetFromConfig("b", ruta)).toEqual({ command: "python", args: [] });
	});

	it("si el servidor no existe, lista los disponibles", () => {
		const ruta = escribir(JSON.stringify({ servers: { a: { command: "node" }, b: { command: "node" } } }));
		expect(() => targetFromConfig("z", ruta)).toThrowError("Server 'z' not found in config. Available: a, b");
	});

	it("si no hay servidores, indica none", () => {
		const ruta = escribir(JSON.stringify({ servers: {} }));
		expect(() => targetFromConfig("z", ruta)).toThrowError("Available: none");
	});

	it("no confunde un nombre con propiedades heredadas del objeto", () => {
		const ruta = escribir(JSON.stringify({ servers: { a: { command: "node" } } }));
		expect(() => targetFromConfig("constructor", ruta)).toThrowError(/not found/);
		expect(() => targetFromConfig("__proto__", ruta)).toThrowError(/not found/);
	});
});

describe("targetFromCommand", () => {
	it("arma el destino con comando, argumentos y directorio", () => {
		mkdirSync(join(dir, "sub"));
		expect(targetFromCommand("node", ["s.mjs"], join(dir, "sub"))).toEqual({
			command: "node",
			args: ["s.mjs"],
			cwd: join(dir, "sub"),
		});
	});
});
