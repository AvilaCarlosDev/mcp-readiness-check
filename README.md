# MCP Readiness Check

> Verify what a stdio MCP server actually advertises before connecting it to an agent.

[![CI](https://github.com/AvilaCarlosDev/mcp-readiness-check/actions/workflows/ci.yml/badge.svg)](https://github.com/AvilaCarlosDev/mcp-readiness-check/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-42ffa1.svg)](package.json)
[![MCP](https://img.shields.io/badge/MCP-compatible-ff8c69.svg)](https://modelcontextprotocol.io/)

MCP Readiness Check launches a server over stdio, performs a real MCP handshake, inventories every advertised catalog page, validates tool contracts, runs a static security audit, and produces reviewable reports.

## Verified checks

| Area | What is checked |
|---|---|
| Connection | Initialization, timeout behavior, server identity, and actionable failure output |
| Capabilities | Advertised groups, server identity, and tools/resources/prompts compared with successful discovery |
| Catalogs | All pages of tools, resources, and prompts advertised by the server |
| Tool quality | Unique and portable names, useful descriptions, and annotation consistency |
| JSON Schema | Full meta-schema compilation for draft-07, 2019-09, and 2020-12 input/output schemas |
| Static security | Tool-poisoning indicators, embedded credential material, sensitive inputs, and risky or contradictory annotations |
| Secret handling | Environment values, credential arguments, authorization headers, provider-key patterns, nested sensitive fields, and stderr |
| Automation | Console, JSON, and Markdown reports with non-zero exit codes for failed checks |

## Install

> **Release status:** the npm package has not been published yet. Use the repository while the first release is prepared.

```bash
git clone https://github.com/AvilaCarlosDev/mcp-readiness-check.git
cd mcp-readiness-check
npm ci
npm run build
npm link
```

The planned package and executable are both named `@avilacarlosdev/mcp-readiness-check` and `mcp-readiness-check`.

## Quick start

```bash
mcp-readiness-check check --cmd node --args examples/echo-server.mjs
```

Test a published stdio server:

```bash
mcp-readiness-check check \
  --cmd npx \
  --args -y @modelcontextprotocol/server-everything
```

## Configuration

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

The default file is `mcp-readiness.config.json`. Use `--config <path>` to select another file.
`init` refuses to overwrite an existing file unless `--force` is supplied.

## Reports

```bash
mcp-readiness-check check --server filesystem --json
mcp-readiness-check check --server filesystem --markdown readiness-report.md
```

See [report.example.md](report.example.md) for a complete Markdown example.

## Static security audit

The audit evaluates evidence exposed during initialization and catalog discovery. It detects:

- known prompt-injection and secret-exfiltration language in tool descriptions or server instructions;
- tools that explicitly advertise returning credentials, secrets, or process environment data;
- credential-like schema fields containing defaults, constants, examples, or enum values;
- high-impact tools whose safety annotations are missing or contradictory;
- sensitive inputs that deserve logging and persistence review.
- shell-wrapped launch commands and unpinned package-runner targets.

Findings based on behavior keywords are explicitly labeled as heuristic and require human review. Values that resemble credentials are never included in finding details.

Use `--no-security-audit` only when you intentionally want schema and capability checks without these findings.

## Secret redaction

Reports redact every supplied environment value plus common credential patterns in arguments, metadata, schemas, diagnostics, resource URIs, prompts, and captured stderr.

Redaction is defense in depth. Prefer environment variables or a secret manager, and inspect artifacts before sharing them. Report missed patterns privately through [SECURITY.md](SECURITY.md).

## CI

A failed check exits with code `1`; warnings do not fail the command.

```yaml
- name: Verify MCP readiness
  run: mcp-readiness-check check --cmd node --args dist/server.js
```

## Options

| Flag | Default | Purpose |
|---|---|---|
| `--cmd <command>` | — | Server command to launch over stdio |
| `--args <args...>` | — | Arguments passed to the server command |
| `--server <name>` | — | Named server from the config file |
| `--config <path>` | `mcp-readiness.config.json` | Config file location |
| `--cwd <path>` | current directory | Working directory for the server |
| `--timeout <ms>` | `15000` | Timeout per MCP operation |
| `--json` | off | Print a machine-readable report |
| `--markdown <path>` | — | Write a Markdown report |
| `--no-security-audit` | off | Disable static security findings |

## Scope and limits

- stdio transport only;
- catalogs and contracts are inspected, but tools are not executed;
- the security audit is static analysis of advertised metadata, not a runtime penetration test;
- unsupported JSON Schema dialects fail explicitly instead of being silently accepted;
- catalog size, pagination, schema size, and captured stderr have defensive limits;
- Streamable HTTP and opt-in safe tool probes are future work.

The project complements, rather than replaces, the interactive [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

## Development

```bash
npm ci
npm test
npm run build
npm run pack:check
npm run dev -- check --cmd node --args examples/echo-server.mjs
```

## Documentation

- [English guide](docs/en/guide.md)
- [Guía en español](docs/es/guia.md)
- [Contributing](CONTRIBUTING.md)

## License

MIT — see [LICENSE](LICENSE). Built by [Carlos Avila](https://github.com/AvilaCarlosDev).
