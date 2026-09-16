# Security Policy

## Supported versions

`mcp-readiness-check` has not published its first npm release yet. Security fixes are currently applied to the latest commit on `main`.

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Older commits and forks | No |

After the first release, this table will list the supported package versions.

## Reporting a vulnerability

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

## Security model

`mcp-readiness-check` launches user-selected MCP server commands and inspects their advertised capabilities and catalogs. Only run commands and configuration files you trust.

Generated reports automatically redact common credential patterns and every environment value. Redaction is defense in depth and cannot guarantee detection of every custom secret format. Review reports before publishing or attaching them to issues.
