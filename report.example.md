# MCP Readiness Report

- **Status:** healthy
- **Created at:** 2026-09-16T12:17:35.489Z
- **Target:** `node examples/echo-server.mjs`
- **Tools:** 1
- **Resources:** 0
- **Prompts:** 0
- **Checks:** 13 passed · 0 warnings · 0 failed

## Tools

### echo

Return the provided message. Useful for smoke testing MCP clients.

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "Message to return"
    }
  },
  "required": [
    "message"
  ],
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Checks

- **PASS** — Connection: MCP server initialized successfully.
- **PASS** — Tools available: The server exposes 1 tool.
- **PASS** — Unique tool names: All tool names are unique.
- **PASS** — Tool descriptions: All tools include useful descriptions.
- **PASS** — inputSchema: echo: inputSchema is valid draft-07 JSON Schema with an object root.
- **PASS** — Server metadata: Server identifies itself as mcp-readiness-check-echo-example 0.1.0.
- **PASS** — Advertised capabilities: Server advertised 1 capability group.
  - tools
- **PASS** — Tools discovery: Advertised tools capability is reachable and returned 1 item.
- **PASS** — Launch target: No shell wrapper or unpinned package-runner target was detected.
- **PASS** — Prompt-injection indicators: No known prompt-injection or secret-exfiltration patterns were found in advertised metadata.
- **PASS** — Sensitive data exposure: No tool explicitly advertises returning credentials, secrets, or process environment data.
- **PASS** — Embedded credential material: No credential-like values were embedded in advertised schemas.
- **PASS** — Security-relevant annotations: No missing or contradictory annotations were found for tools identified as high impact.
