# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security / Seguridad

- Terminal escape-sequence injection through server metadata (CWE-150): a hostile server could clear the screen, change the terminal title, write to the clipboard (OSC 52) or fake report lines through tool, resource and prompt names and descriptions, check messages and `stderr`. Control and text-reordering characters are now shown as visible escapes. / Inyección de secuencias de escape de terminal a través de los metadatos del servidor: ahora los caracteres de control y de reordenamiento se muestran como escapes visibles.
- Markdown reports neutralize links, HTML and code fences that come from the server. / Los reportes Markdown neutralizan los enlaces, el HTML y los bloques de código que provienen del servidor.

### Changed / Cambiado

- **Minimum Node.js is now 22.12** (was 20). `commander` 15 requires Node 22.12+, Vitest 5 requires 22.12, 24 or 26+, and Node 20 reached end of life on 2026-04-30. CI now tests Node 22 and 24. The package is not published yet, so no released version is affected. / **El mínimo de Node.js pasa a 22.12** (antes 20): `commander` 15 y Vitest 5 lo exigen y Node 20 ya está fuera de soporte. El CI prueba Node 22 y 24.
- Dependencies updated together and verified as a set: `commander` 14→15, `@modelcontextprotocol/sdk` 1.29→1.30, `zod` 4.4→4.6, `ora` 9.4.0→9.4.1, and dev tooling `typescript` 6→7, `vitest` 4→5, `@types/node` 25→26, `tsx`. / Dependencias actualizadas y verificadas en conjunto.

### Fixed / Corregido

- `--server constructor` (or any inherited object property) was accepted as an existing server. / `--server constructor` se aceptaba como un servidor existente.
- Configuration errors now name the file, the server and the field (`servers.api.command`) instead of a raw `SyntaxError` or the raw Zod issue array. / Los errores de configuración nombran el archivo, el servidor y el campo.

### Added / Añadido

- 54 new tests (77 in total): configuration loading, the CLI exit-code contract, JSON/Markdown output, `init`, both reporters and terminal safety. / 54 pruebas nuevas (77 en total).
- Coverage measurement with enforced thresholds (`npm run test:coverage`). / Medición de cobertura con umbrales obligatorios.
- CI: secret scanning (gitleaks), AI-watermark check and Dependabot for npm and GitHub Actions. / CI: escaneo de secretos, verificación de marcas de agua y Dependabot.
- Spanish README (`README.md`) with the English one in `README.en.md`, code of conduct, and issue/PR templates. / README en español, código de conducta y plantillas.

## [0.3.0] - 2026-09-16

### Added

- Full JSON Schema validation for draft-07, 2019-09, and 2020-12 tool input/output contracts.
- Paginated discovery and consistency checks for advertised tools, resources, and prompts.
- Static security findings for tool poisoning, sensitive-data exposure, embedded credentials, sensitive inputs, and risky annotations.
- Automatic redaction for environment values, credential arguments, authorization headers, known provider-key formats, nested sensitive fields, diagnostic messages, and captured `stderr`.
- Tests covering report redaction.
- Package-content validation for release readiness.

### Changed

- Renamed the project from MCP Doctor to MCP Readiness Check to avoid an existing package and clarify its purpose.
- Replaced generic security advisories with findings derived from the server's advertised metadata.
- Replaced the placeholder security policy with project-specific reporting and support guidance.
- Documented the unpublished npm status and truthful source-installation flow.
