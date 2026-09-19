// Comprueba mcp-readiness-check contra servidores MCP reales de terceros (ver compat-servers.mjs).
// Requiere red (usa `npx`) y la herramienta compilada: `npm run compat`.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SERVIDORES, evaluar } from "./compat-servers.mjs";

const directorio = mkdtempSync(join(tmpdir(), "mcp-compat-"));
writeFileSync(join(directorio, "nota.txt"), "prueba");

let fallos = 0;
console.log(`Node ${process.version} · ${process.platform}\n`);
console.log("servidor".padEnd(22), "resultado".padEnd(10), "código".padEnd(7), "estado".padEnd(9), "tools", " detalle");

for (const servidor of SERVIDORES) {
	const args = servidor.args.map((a) => (a === "{directorio}" ? directorio : a));
	const r = spawnSync(
		process.execPath,
		["dist/cli.js", "check", "--cmd", "npx", "--args", "-y", servidor.paquete, ...args, "--timeout", "60000", "--json"],
		{ encoding: "utf8", timeout: 180_000 },
	);
	let informe;
	try {
		informe = JSON.parse(r.stdout);
	} catch {
		informe = undefined;
	}
	const { ok, problemas } = evaluar(informe, r.status, servidor.esperado);
	if (!ok) fallos++;
	console.log(
		servidor.nombre.padEnd(22),
		(ok ? "ok" : "FALLA").padEnd(10),
		String(r.status).padEnd(7),
		String(informe?.summary.status ?? "-").padEnd(9),
		String(informe?.summary.tools ?? "-").padEnd(5),
		ok ? servidor.nota : problemas.join("; "),
	);
}

rmSync(directorio, { recursive: true, force: true });
console.log(fallos === 0 ? "\nTodos los servidores dieron el resultado esperado." : `\n${fallos} servidor(es) no dieron el resultado esperado.`);
process.exit(fallos === 0 ? 0 : 1);
