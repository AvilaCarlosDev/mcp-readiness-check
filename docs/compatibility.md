# Estado de las pruebas / Test status

[Español](#español) · [English](#english)

## Español

Esta página dice **qué está probado de verdad y qué no**. Si algo no está en la primera lista, no lo des por probado.

### 1. Automatizado en cada push y PR (CI, Ubuntu, Node 22 y 24)

- **94 pruebas** (unitarias y de integración) con cobertura medida: 94 % de sentencias y 83 % de ramas, con umbrales obligatorios (90 % y 75 %).
- Se ejecutan contra el servidor de ejemplo `examples/echo-server.mjs` y contra **fixtures escritos por el autor**: `stderr` ruidoso, catálogo paginado, secretos en `stderr`, metadatos hostiles y un servidor que termina de inmediato. Es decir, son servidores sintéticos, no de terceros.
- El contrato de códigos de salida (`0`, `1`, `2`) se prueba con el binario real en un proceso aparte.
- Escaneo de secretos (gitleaks), auditoría de dependencias y verificación del paquete (`npm pack`).

### 2. Servidores reales de terceros

Se comprobó contra los servidores de referencia oficiales de la organización `modelcontextprotocol`, en la versión `2026.8.31`, con `npm run compat`:

| Servidor | Código | Estado | Herramientas | Nota |
|---|---|---|---|---|
| `server-everything` | 1 | failed | 13 | Hallazgo real: su herramienta `get-env` devuelve todo el entorno del proceso |
| `server-filesystem` | 0 | healthy | 14 | |
| `server-memory` | 0 | healthy | 9 | |
| `server-sequential-thinking` | 0 | healthy | 1 | |

- **Verificado a mano el 2026-09-19** en Linux con Node 26. En esa ocasión se contrastaron los conteos de herramientas, recursos y prompts con un cliente MCP independiente hecho con el SDK oficial; coincidieron en los 4. Ese contraste puntual **no está en el repositorio**.
- **Repetible:** `npm run compat` ejecuta esas comprobaciones, y el flujo [Compatibility](../.github/workflows/compat.yml) lo hace cada semana y bajo demanda en Node 22 y 24. No bloquea los PR, porque usa la red y ejecuta código ajeno con `npx`.

### 3. Lo que NO está probado

- **Servidores independientes de terceros**: solo se probaron los 4 de referencia, todos en Node.js y del mismo mantenedor. No se probó ningún servidor de la comunidad, ni escritos en Python (`uvx`), Go, Rust o Java.
- **Windows y macOS**: el CI es solo Linux.
- **Transporte Streamable HTTP / SSE**: no está soportado, solo stdio.
- **Catálogos grandes**: los servidores de referencia devolvieron una sola página; la paginación solo se probó con un fixture propio.
- **Cortes de conexión a mitad de sesión** y respuestas malformadas más allá de los fixtures existentes.
- **Servidores que exigen credenciales**: la redacción de secretos se probó con fixtures, no con servicios reales.
- **Calidad de la auditoría de seguridad**: no se midió cuántos ataques reales detecta ni cuántos falsos positivos genera, ni se comparó con otras herramientas (por ejemplo `mcp-scan` / `agent-scan`). Es análisis estático heurístico de metadatos.
- **Instalación desde npm**: el paquete todavía no está publicado; solo se probó compilándolo desde el código fuente.

## English

This page states **what is really tested and what is not**. If something is not in the first list, do not assume it is tested.

### 1. Automated on every push and PR (CI, Ubuntu, Node 22 and 24)

- **94 tests** (unit and integration) with measured coverage: 94% statements and 83% branches, with enforced thresholds (90% and 75%).
- They run against the example server `examples/echo-server.mjs` and **fixtures written by the author**: noisy `stderr`, a paginated catalog, secrets in `stderr`, hostile metadata and a server that exits immediately. They are synthetic servers, not third-party ones.
- The exit-code contract (`0`, `1`, `2`) is tested with the real binary in a separate process.
- Secret scanning (gitleaks), dependency audit and package validation (`npm pack`).

### 2. Real third-party servers

Checked against the official reference servers of the `modelcontextprotocol` organization, version `2026.8.31`, with `npm run compat`:

| Server | Code | Status | Tools | Note |
|---|---|---|---|---|
| `server-everything` | 1 | failed | 13 | Real finding: its `get-env` tool returns the whole process environment |
| `server-filesystem` | 0 | healthy | 14 | |
| `server-memory` | 0 | healthy | 9 | |
| `server-sequential-thinking` | 0 | healthy | 1 | |

- **Manually verified on 2026-09-19** on Linux with Node 26. On that occasion the tool, resource and prompt counts were cross-checked with an independent MCP client built on the official SDK; they matched on all 4. That one-off cross-check **is not in the repository**.
- **Repeatable:** `npm run compat` runs those checks, and the [Compatibility](../.github/workflows/compat.yml) workflow runs it weekly and on demand on Node 22 and 24. It does not block PRs, because it uses the network and runs third-party code with `npx`.

### 3. What is NOT tested

- **Independent third-party servers**: only the 4 reference servers were tested, all Node.js and from the same maintainer. No community server, and none written in Python (`uvx`), Go, Rust or Java.
- **Windows and macOS**: CI is Linux only.
- **Streamable HTTP / SSE transport**: not supported, stdio only.
- **Large catalogs**: the reference servers returned a single page; pagination was only tested with the author's own fixture.
- **Connection drops mid-session** and malformed responses beyond the existing fixtures.
- **Servers that require credentials**: secret redaction was tested with fixtures, not with real services.
- **Quality of the security audit**: how many real attacks it detects and how many false positives it produces was not measured, nor compared with other tools (for example `mcp-scan` / `agent-scan`). It is heuristic static analysis of metadata.
- **Installing from npm**: the package is not published yet; it was only tested by building from source.
