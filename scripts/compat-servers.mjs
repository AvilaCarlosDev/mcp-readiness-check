// Servidores MCP de terceros contra los que se comprueba la herramienta, y qué se espera de cada uno.
// Solo paquetes de la organización oficial `modelcontextprotocol`, fijados a una versión exacta:
// si publican otra, este resultado no cambia por sorpresa; se actualiza a propósito.

export const SERVIDORES = [
	{
		nombre: "everything",
		paquete: "@modelcontextprotocol/server-everything@2026.8.31",
		args: [],
		esperado: { codigo: 1, estado: "failed", tools: 13 },
		nota: "Es un servidor de demostración; su herramienta get-env devuelve todo el entorno del proceso, y eso es un hallazgo real de seguridad.",
	},
	{
		nombre: "filesystem",
		paquete: "@modelcontextprotocol/server-filesystem@2026.8.31",
		args: ["{directorio}"],
		esperado: { codigo: 0, estado: "healthy", tools: 14 },
		nota: "Recibe un directorio permitido; no anuncia recursos ni prompts.",
	},
	{
		nombre: "memory",
		paquete: "@modelcontextprotocol/server-memory@2026.8.31",
		args: [],
		esperado: { codigo: 0, estado: "healthy", tools: 9 },
		nota: "Grafo de conocimiento en memoria; anuncia herramientas y un recurso.",
	},
	{
		nombre: "sequential-thinking",
		paquete: "@modelcontextprotocol/server-sequential-thinking@2026.8.31",
		args: [],
		esperado: { codigo: 0, estado: "healthy", tools: 1 },
		nota: "Un servidor mínimo con una sola herramienta.",
	},
];

/** Compara un resultado real con lo esperado y devuelve todos los problemas, no solo el primero. */
export function evaluar(informe, codigo, esperado) {
	if (!informe) return { ok: false, problemas: [`sin informe (código de salida ${codigo}): la herramienta no produjo JSON`] };
	const problemas = [];
	if (codigo !== esperado.codigo) problemas.push(`código de salida ${codigo}, se esperaba ${esperado.codigo}`);
	if (informe.summary.status !== esperado.estado) problemas.push(`estado ${informe.summary.status}, se esperaba ${esperado.estado}`);
	if (informe.summary.tools !== esperado.tools) problemas.push(`${informe.summary.tools} herramientas, se esperaban ${esperado.tools}`);
	return { ok: problemas.length === 0, problemas };
}
