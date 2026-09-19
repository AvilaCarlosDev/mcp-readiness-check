# MCP Readiness Check

[English](README.en.md) · **Español**

> Verifica lo que un servidor MCP por stdio realmente anuncia antes de conectarlo a un agente.

[![CI](https://github.com/AvilaCarlosDev/mcp-readiness-check/actions/workflows/ci.yml/badge.svg)](https://github.com/AvilaCarlosDev/mcp-readiness-check/actions/workflows/ci.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.12-42ffa1.svg)](package.json)
[![MCP](https://img.shields.io/badge/MCP-compatible-ff8c69.svg)](https://modelcontextprotocol.io/)

MCP Readiness Check lanza un servidor por stdio, realiza un handshake MCP real, inventaría cada página de catálogo anunciada, valida los contratos de las herramientas, ejecuta una auditoría de seguridad estática y produce reportes revisables.

![MCP Readiness Check ejecutándose contra su servidor de ejemplo](docs/assets/mcp-readiness-check-demo.png)

<details>
<summary>Ver la demostración del CLI</summary>

![Demostración animada del CLI de MCP Readiness Check](docs/assets/mcp-readiness-check-demo.gif)

</details>

## Comprobaciones verificadas

| Área | Qué se comprueba |
|---|---|
| Conexión | Inicialización, comportamiento ante timeouts, identidad del servidor y mensajes de fallo accionables |
| Capacidades | Grupos anunciados, identidad del servidor y herramientas/recursos/prompts comparados con lo que realmente se descubre |
| Catálogos | Todas las páginas de herramientas, recursos y prompts que anuncia el servidor |
| Calidad de herramientas | Nombres únicos y portables, descripciones útiles y coherencia de las anotaciones |
| JSON Schema | Compilación completa del metaesquema para esquemas de entrada/salida draft-07, 2019-09 y 2020-12 |
| Seguridad estática | Indicios de envenenamiento de herramientas, credenciales incrustadas, entradas sensibles y anotaciones riesgosas o contradictorias |
| Manejo de secretos | Valores de entorno, argumentos con credenciales, cabeceras de autorización, patrones de claves de proveedores, campos sensibles anidados y stderr |
| Automatización | Reportes en consola, JSON y Markdown, con código de salida distinto de cero cuando falla una comprobación |

## Instalación

```bash
npm install --global @avilacarlosdev/mcp-readiness-check
```

El paquete es `@avilacarlosdev/mcp-readiness-check`; el ejecutable instalado es `mcp-readiness-check`.

Ejecutarlo sin instalación global:

```bash
npx @avilacarlosdev/mcp-readiness-check --help
```

## Inicio rápido

```bash
mcp-readiness-check check --cmd node --args examples/echo-server.mjs
```

Probar un servidor stdio publicado:

```bash
mcp-readiness-check check \
  --cmd npx \
  --args -y @modelcontextprotocol/server-everything
```

## Configuración

```bash
mcp-readiness-check init
mcp-readiness-check check --server filesystem
```

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "cwd": "."
    }
  }
}
```

El archivo por defecto es `mcp-readiness.config.json`. Usa `--config <ruta>` para elegir otro.
`init` no sobrescribe un archivo existente salvo que se indique `--force`.

Si el archivo no es JSON válido o no cumple el esquema, el error indica la ruta y el campo exacto (por ejemplo `servers.api.command`).

## Reportes

```bash
mcp-readiness-check check --server filesystem --json
mcp-readiness-check check --server filesystem --markdown readiness-report.md
```

Consulta [report.example.md](report.example.md) para ver un ejemplo completo en Markdown.

## Auditoría de seguridad estática

La auditoría evalúa la evidencia expuesta durante la inicialización y el descubrimiento de catálogos. Detecta:

- lenguaje conocido de inyección de prompts y exfiltración de secretos en descripciones de herramientas o instrucciones del servidor;
- herramientas que anuncian explícitamente devolver credenciales, secretos o datos del entorno del proceso;
- campos de esquema con aspecto de credencial que contienen valores por defecto, constantes, ejemplos o valores de enum;
- herramientas de alto impacto cuyas anotaciones de seguridad faltan o se contradicen;
- entradas sensibles que merecen una revisión de registro y persistencia;
- comandos de lanzamiento envueltos en un shell y objetivos de ejecutores de paquetes sin versión fijada.

Los hallazgos basados en palabras clave de comportamiento se marcan explícitamente como heurísticos y requieren revisión humana. Los valores que parecen credenciales nunca se incluyen en el detalle de un hallazgo.

Usa `--no-security-audit` solo cuando quieras a propósito comprobar esquemas y capacidades sin estos hallazgos.

## Redacción de secretos

Los reportes ocultan cada valor de entorno suministrado y los patrones de credenciales comunes en argumentos, metadatos, esquemas, diagnósticos, URI de recursos, prompts y stderr capturado.

La redacción es defensa en profundidad. Prefiere variables de entorno o un gestor de secretos, e inspecciona los artefactos antes de compartirlos. Reporta en privado los patrones no detectados mediante [SECURITY.md](SECURITY.md).

## Salida de servidor no confiable

Todo lo que un servidor anuncia (nombres y descripciones de herramientas, recursos y prompts, mensajes de comprobaciones y `stderr`) se trata como no confiable. Antes de llegar a la consola o a un reporte Markdown, los caracteres de control y los que reordenan el texto se muestran como escapes visibles (`\x1b`, `‮`) en lugar de interpretarse. Así un servidor hostil no puede borrar la pantalla, cambiar el título de la terminal, escribir en el portapapeles (OSC 52) ni fingir líneas del reporte. En los reportes Markdown se neutralizan los enlaces, el HTML y los bloques de código que provengan del servidor. La salida `--json` conserva los datos originales, con el escape propio de JSON.

## CI

Una comprobación fallida termina con código `1`; las advertencias no hacen fallar el comando.

```yaml
- name: Verify MCP readiness
  run: mcp-readiness-check check --cmd node --args dist/server.js
```

## Opciones

| Opción | Por defecto | Propósito |
|---|---|---|
| `--cmd <comando>` | — | Comando del servidor que se lanza por stdio |
| `--args <args...>` | — | Argumentos que se pasan al comando del servidor |
| `--server <nombre>` | — | Servidor con nombre del archivo de configuración |
| `--config <ruta>` | `mcp-readiness.config.json` | Ubicación del archivo de configuración |
| `--cwd <ruta>` | directorio actual | Directorio de trabajo del servidor |
| `--timeout <ms>` | `15000` | Timeout por operación MCP |
| `--json` | desactivado | Imprime un reporte legible por máquinas |
| `--markdown <ruta>` | — | Escribe un reporte en Markdown |
| `--no-security-audit` | desactivado | Desactiva los hallazgos de seguridad estática |

## Alcance y límites

- solo transporte stdio;
- se inspeccionan catálogos y contratos, pero las herramientas no se ejecutan;
- la auditoría de seguridad es análisis estático de los metadatos anunciados, no una prueba de penetración en tiempo de ejecución;
- los dialectos de JSON Schema no soportados fallan de forma explícita en lugar de aceptarse en silencio;
- el tamaño del catálogo, la paginación, el tamaño de los esquemas y el stderr capturado tienen límites defensivos;
- Streamable HTTP y las sondas seguras de herramientas opcionales quedan como trabajo futuro.

El proyecto complementa, y no reemplaza, al [MCP Inspector](https://github.com/modelcontextprotocol/inspector) interactivo.

## Desarrollo

```bash
npm ci
npm test
npm run test:coverage   # exige un umbral de cobertura
npm run build
npm run pack:check
npm run demo:assets:portable
npm run dev -- check --cmd node --args examples/echo-server.mjs
```

Los recursos multimedia del README se capturaron desde una sesión real de Kitty ejecutando el CLI. `npm run demo:assets:portable` genera recursos portables a partir de la misma salida real del CLI cuando no hay una captura del compositor. Requiere Google Chrome e ImageMagick en local; ninguno hace falta para compilar o usar el paquete.

## Documentación

- [Guía en español](docs/es/guia.md)
- [English guide](docs/en/guide.md)
- [Contribuir](CONTRIBUTING.md) · [Política de seguridad](SECURITY.md) · [Código de conducta](CODE_OF_CONDUCT.md) · [Registro de cambios](CHANGELOG.md)

## Créditos

Creado y mantenido por [Carlos Avila](https://github.com/AvilaCarlosDev). Desarrollado con el apoyo de Claude (Anthropic) como asistente de revisión de arquitectura y redacción de pruebas; las decisiones de diseño y la revisión final son del autor.

## Licencia

MIT — ver [LICENSE](LICENSE).
