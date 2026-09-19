# Política de seguridad / Security policy

[Español](#español) · [English](#english)

## Español

### Versiones soportadas

`mcp-readiness-check` todavía no ha publicado su primera versión en npm. Las correcciones de seguridad se aplican al último commit de `main`.

| Versión | Soportada |
| --- | --- |
| `main` | Sí |
| Commits anteriores y forks | No |

Tras la primera publicación, esta tabla listará las versiones soportadas del paquete.

### Cómo reportar una vulnerabilidad

No divulgues una vulnerabilidad en un issue público.

Usa el reporte privado de vulnerabilidades de GitHub para este repositorio:

<https://github.com/AvilaCarlosDev/mcp-readiness-check/security/advisories/new>

Incluye:

- el comando o formato de reporte afectado;
- pasos para reproducirlo con credenciales de marcador de posición;
- el comportamiento esperado y el real;
- el impacto potencial;
- una propuesta de corrección, si la tienes.

No incluyas nunca claves de API, tokens, contraseñas, configuración privada de servidores ni reportes sin redactar.

Deberías recibir un acuse de recibo en siete días. Los reportes confirmados se evaluarán, se corregirán en una rama privada y se divulgarán cuando exista una versión corregida.

### Modelo de seguridad

`mcp-readiness-check` lanza comandos de servidores MCP elegidos por el usuario e inspecciona sus capacidades y catálogos anunciados. Ejecuta solo comandos y archivos de configuración en los que confíes.

**Todo lo que anuncia el servidor es no confiable.** Los nombres, descripciones, mensajes y `stderr` se muestran con los caracteres de control y de reordenamiento como escapes visibles (`\x1b`), y en los reportes Markdown se neutralizan los enlaces, el HTML y los bloques de código, para que un servidor hostil no pueda manipular la terminal ni el reporte.

Los reportes generados ocultan automáticamente los patrones comunes de credenciales y cada valor de entorno. La redacción es defensa en profundidad y no puede garantizar la detección de todo formato de secreto propio. Revisa los reportes antes de publicarlos o adjuntarlos a un issue.

### Historial de correcciones

- Sin publicar: se corrigió la inyección de secuencias de escape de terminal y de marcado a través de los metadatos del servidor (CWE-150). No afectó a ninguna versión publicada en npm.

## English

### Supported versions

`mcp-readiness-check` has not published its first npm release yet. Security fixes are currently applied to the latest commit on `main`.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Older commits and forks | No |

After the first release, this table will list the supported package versions.

### Reporting a vulnerability

Please do not disclose a vulnerability in a public issue.

Use GitHub's private vulnerability reporting for this repository:

<https://github.com/AvilaCarlosDev/mcp-readiness-check/security/advisories/new>

Include:

- the affected command or report format;
- reproduction steps using placeholder credentials;
- the expected and actual behavior;
- the potential impact;
- a suggested fix, if available.

Never include real API keys, tokens, passwords, private server configuration, or unredacted reports.

You should receive an acknowledgement within seven days. Confirmed reports will be assessed, fixed on a private branch, and disclosed after a patched version is available.

### Security model

`mcp-readiness-check` launches user-selected MCP server commands and inspects their advertised capabilities and catalogs. Only run commands and configuration files you trust.

**Everything a server advertises is untrusted.** Names, descriptions, messages and `stderr` are shown with control and text-reordering characters as visible escapes (`\x1b`), and in Markdown reports links, HTML and code fences are neutralized, so a hostile server cannot manipulate the terminal or the report.

Generated reports automatically redact common credential patterns and every environment value. Redaction is defense in depth and cannot guarantee detection of every custom secret format. Review reports before publishing or attaching them to issues.

### Fix history

- Unreleased: fixed terminal escape-sequence and markup injection through server metadata (CWE-150). It did not affect any version published to npm.
