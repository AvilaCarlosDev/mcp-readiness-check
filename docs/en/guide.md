# MCP Readiness Check guide

`mcp-readiness-check` verifies a stdio MCP server before it is connected to an agent.

## What is verified

- real MCP initialization and server identity;
- every page of advertised tools, resources, and prompts;
- capability declarations against reachable catalogs;
- tool names, descriptions, and annotations;
- input and output schemas using their declared JSON Schema dialect;
- static security indicators in server instructions, tool metadata, and schemas;
- secret-safe console, JSON, and Markdown reports.

Supported schema dialects are draft-07, 2019-09, and 2020-12. Unsupported dialects fail explicitly.

## Installation

```bash
npm install --global @avilacarlosdev/mcp-readiness-check
```

For local development:

```bash
git clone https://github.com/AvilaCarlosDev/mcp-readiness-check.git
cd mcp-readiness-check
npm ci
npm run build
```

## Usage

```bash
mcp-readiness-check check --cmd node --args examples/echo-server.mjs
mcp-readiness-check init
mcp-readiness-check check --server filesystem
mcp-readiness-check check --server filesystem --json
mcp-readiness-check check --server filesystem --markdown report.md
```

## Security interpretation

The security audit is evidence-based static analysis. It checks advertised metadata for prompt-injection language, embedded credential values, sensitive inputs, and risky annotation inconsistencies. Heuristic findings require human review.

It does not execute tools or claim to be a penetration test. Use `--no-security-audit` to disable this layer.

All supplied environment values and common credential patterns are redacted from reports. Review every artifact before sharing it because custom secret formats can exist.

## Automation

Failed checks return exit code `1`. Warnings remain visible but return `0`, making the command suitable for CI without treating every heuristic as a release blocker.

This project complements the interactive MCP Inspector; it does not replace it.
