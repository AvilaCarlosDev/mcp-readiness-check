# mcp-doctor 🩺

> Connect to an MCP server, inspect what it actually exposes, and get a readable report — before you wire it into an agent.

[![npm](https://img.shields.io/npm/v/@avilacarlosdev/mcp-doctor?color=cb3837&logo=npm)](https://www.npmjs.com/package/@avilacarlosdev/mcp-doctor)
[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-42ffa1.svg)](package.json)
[![MCP](https://img.shields.io/badge/MCP-compatible-ff8c69.svg)](https://modelcontextprotocol.io/)

## The problem

When an MCP server misbehaves, the agent rarely tells you why. You get a tool that never fires, a schema the model cannot fill, or a stdio server that corrupts its own JSON-RPC stream by logging to stdout — and all you see is the agent quietly doing nothing.

`mcp-doctor` connects to the server yourself, over the same transport an agent would use, and tells you what it found.

## What it catches

| Check | Why it matters |
|---|---|
| Connection | The server never initializes — the failure most often mistaken for an agent bug. |
| Capabilities | The server connects but advertises nothing usable. |
| Duplicate names | Two tools share a name; the agent can only ever reach one. |
| Name format | Names outside `[a-zA-Z0-9_-]{1,128}` break some clients. |
| Descriptions | Missing or 3-word descriptions are why a model never picks the tool. |
| Input schemas | A schema that is not a JSON Schema object cannot be filled correctly. |
| Annotations | A tool marked both `readOnlyHint` and `destructiveHint` misleads agents and reviewers. |
| stderr capture | Surfaces the stack trace the agent swallowed. |

## Install

```bash
npm install -g @avilacarlosdev/mcp-doctor
```

> **Note:** the unscoped `mcp-doctor` name on npm belongs to a different project. Always install the scoped package above.

Run it without installing:

```bash
npx @avilacarlosdev/mcp-doctor check --cmd node --args server.mjs
```

## Quick start

```bash
# point it at any stdio MCP server
mcp-doctor check --cmd node --args examples/echo-server.mjs
```

```
🩺 MCP Doctor Report
──────────────────────────────────────────────────────────
Status: healthy
Target: node examples/echo-server.mjs
Tools:  1
Checks: 5 passed · 0 warnings · 0 failed

Tools
  echo — Return the provided message. Useful for smoke testing MCP clients.

Checks
  ✅ Connection: MCP server initialized successfully.
  ✅ Capabilities: Server capabilities were received during initialization.
  ✅ Tools available: The server exposes 1 tool.
  ✅ Unique tool names: All tool names are unique.
  ✅ Tool descriptions: All tools include useful descriptions.
  ℹ️  Stdio stdout hygiene: For stdio MCP servers, logs should go to stderr.
  ℹ️  Review tool side effects: Add accurate readOnlyHint / destructiveHint annotations.
```

## Using a config file

```bash
mcp-doctor init                    # writes mcp-doctor.config.json
mcp-doctor check --server echo     # run a named server
```

```json
{
  "servers": {
    "echo": {
      "command": "node",
      "args": ["examples/echo-server.mjs"],
      "cwd": "."
    }
  }
}
```

## Reports

```bash
mcp-doctor check --server echo --json              # machine-readable
mcp-doctor check --server echo --markdown out.md  # reviewable artifact
```

See [report.example.md](report.example.md) for a full Markdown report.

## In CI

Exit code is `1` when any check fails, so it gates a pipeline as-is. Warnings do not fail the run.

```yaml
- name: Validate MCP server
  run: npx @avilacarlosdev/mcp-doctor check --cmd node --args dist/server.js
```

## Options

| Flag | Default | Purpose |
|---|---|---|
| `--cmd <command>` | — | Server command to run over stdio |
| `--args <args...>` | — | Arguments for `--cmd` |
| `--server <name>` | — | Named server from the config file |
| `--config <path>` | `mcp-doctor.config.json` | Config file location |
| `--cwd <path>` | current dir | Working directory for the server process |
| `--timeout <ms>` | `15000` | Timeout per MCP operation |
| `--json` | off | Print the report as JSON |
| `--markdown <path>` | — | Write a Markdown report |
| `--no-security` | off | Skip security advisories |

## Scope

Today: **stdio transport only.** Streamable HTTP, argument-driven smoke tests, JSON Schema 2020-12 diagnostics, and resource/prompt inspection are on the roadmap, not implemented.

## Development

```bash
git clone https://github.com/AvilaCarlosDev/mcp-doctor.git
cd mcp-doctor
npm install
npm test        # vitest
npm run build   # tsc
npm run dev -- check --cmd node --args examples/echo-server.mjs
```

## Documentation

- [English guide](docs/en/guide.md)
- [Guía en español](docs/es/guia.md)

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE). Built by [Carlos Avila](https://github.com/AvilaCarlosDev).
