// Los nombres, descripciones y mensajes vienen de un servidor MCP que todavía no se
// ha verificado. Sin este saneamiento podría borrar la pantalla, cambiar el título de
// la ventana, escribir en el portapapeles (OSC 52) o fingir líneas del reporte.
const CONTROL = /[\u0000-\u001f\u007f-\u009f‪-‮⁦-⁩]/g;

const NOMBRADOS: Record<string, string> = { "\n": "\\n", "\r": "\\r", "\t": "\\t" };

function escapar(caracter: string): string {
	const conocido = NOMBRADOS[caracter];
	if (conocido) return conocido;
	const codigo = caracter.charCodeAt(0);
	return codigo > 0xff ? `\\u${codigo.toString(16).padStart(4, "0")}` : `\\x${codigo.toString(16).padStart(2, "0")}`;
}

/** Deja visibles, como texto, los caracteres de control y los que reordenan el texto. */
export function visible(texto: string): string {
	return texto.replace(CONTROL, escapar);
}

/** Como `visible`, pero los saltos de línea pasan a espacios: para texto de una sola línea. */
export function unaLinea(texto: string): string {
	return visible(texto.replace(/\r?\n|\r/g, " "));
}
