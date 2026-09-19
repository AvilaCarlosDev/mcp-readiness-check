import { describe, expect, it } from "vitest";
// @ts-expect-error — módulo .mjs de scripts/ sin declaraciones de tipos
import { SERVIDORES, evaluar } from "../scripts/compat-servers.mjs";

const informe = (tools: number, status = "healthy") => ({ summary: { status, tools, resources: 0, prompts: 0, failed: status === "failed" ? 1 : 0 } });

describe("evaluar", () => {
	const esperado = { codigo: 0, estado: "healthy", tools: 14 };

	it("acepta un resultado que cumple todo lo esperado", () => {
		expect(evaluar(informe(14), 0, esperado)).toEqual({ ok: true, problemas: [] });
	});

	it("detecta un código de salida distinto", () => {
		const r = evaluar(informe(14), 2, esperado);
		expect(r.ok).toBe(false);
		expect(r.problemas.join(" ")).toContain("código de salida 2");
	});

	it("detecta un estado distinto", () => {
		const r = evaluar(informe(14, "failed"), 0, esperado);
		expect(r.problemas.join(" ")).toContain("estado failed");
	});

	it("detecta que cambió el número de herramientas", () => {
		const r = evaluar(informe(12), 0, esperado);
		expect(r.problemas.join(" ")).toContain("12 herramientas");
	});

	it("informa todos los problemas a la vez", () => {
		expect(evaluar(informe(1, "failed"), 1, esperado).problemas).toHaveLength(3);
	});

	it("un resultado sin informe (la herramienta no produjo JSON) es un fallo explícito", () => {
		const r = evaluar(undefined, 2, esperado);
		expect(r.ok).toBe(false);
		expect(r.problemas[0]).toContain("sin informe");
	});
});

describe("SERVIDORES", () => {
	it("fija cada paquete a una versión exacta, para que la prueba sea reproducible", () => {
		for (const s of SERVIDORES) expect(s.paquete).toMatch(/^@[\w-]+\/[\w-]+@\d[\w.-]*$/);
	});

	it("solo incluye paquetes de la organización oficial modelcontextprotocol", () => {
		for (const s of SERVIDORES) expect(s.paquete.startsWith("@modelcontextprotocol/")).toBe(true);
	});

	it("documenta por qué cada servidor tiene el resultado esperado", () => {
		for (const s of SERVIDORES) expect(s.nota.length).toBeGreaterThan(10);
	});
});
