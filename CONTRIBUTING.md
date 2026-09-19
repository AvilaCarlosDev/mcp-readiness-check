# Contribuir / Contributing

[Español](#español) · [English](#english)

## Español

Gracias por tu interés en mejorar `mcp-readiness-check`.

### Desarrollo

```bash
npm install
npm run lint             # tsc --noEmit
npm run test:coverage    # pruebas con umbral de cobertura
npm run build
npm run pack:check
```

### Principios

- Los diagnósticos deben ser accionables.
- Prefiere mensajes claros a una salida ingeniosa.
- No ocultes los errores del protocolo MCP.
- Evita valores por defecto inseguros para servidores remotos.
- Lo que anuncia un servidor es **no confiable**: todo texto suyo que llegue a la consola o a un reporte Markdown debe pasar por `visible`/`unaLinea` (`src/utils/terminal.ts`).
- Mantén la documentación en español e inglés: si cambias una, actualiza la otra.

### Pull requests

Incluye:

- un resumen corto;
- los pasos de validación;
- capturas o una salida de ejemplo cuando cambie la salida del CLI;
- actualizaciones de la documentación para el comportamiento visible al usuario;
- pruebas para el cambio, incluidos los casos límite (entrada vacía, JSON inválido, servidor que falla o se cuelga).

El CI rechaza marcas de agua de IA en archivos y mensajes de commit (por ejemplo, trailers `Co-Authored-By` de asistentes). Si usaste un asistente, menciónalo en la descripción del PR.

## English

Thanks for your interest in improving `mcp-readiness-check`.

### Development

```bash
npm install
npm run lint             # tsc --noEmit
npm run test:coverage    # tests with a coverage threshold
npm run build
npm run pack:check
```

### Principles

- Keep diagnostics actionable.
- Prefer clear messages over clever output.
- Do not hide MCP protocol errors.
- Avoid unsafe defaults for remote servers.
- Whatever a server advertises is **untrusted**: any of its text that reaches the console or a Markdown report must go through `visible`/`unaLinea` (`src/utils/terminal.ts`).
- Keep documentation in Spanish and English: if you change one, update the other.

### Pull requests

Please include:

- a short summary;
- validation steps;
- screenshots or sample output when CLI output changes;
- docs updates for user-facing behavior;
- tests for the change, including edge cases (empty input, invalid JSON, a server that fails or hangs).

CI rejects AI watermarks in files and commit messages (for example assistant `Co-Authored-By` trailers). If you used an assistant, say so in the PR description instead.
