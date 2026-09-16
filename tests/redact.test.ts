import { describe, expect, it } from "vitest";
import { REDACTED, redactArguments, redactText, sanitizeReport, sanitizeTarget } from "../src/core/redact.js";
import type { ReadinessReport } from "../src/core/types.js";

describe("report redaction", () => {
	it("redacts every environment value while preserving variable names", () => {
		const target = sanitizeTarget({
			command: "node",
			args: ["server.mjs"],
			env: { OPENROUTER_API_KEY: "test-openrouter-secret", NODE_ENV: "test" },
		});

		expect(target.env).toEqual({ OPENROUTER_API_KEY: REDACTED, NODE_ENV: REDACTED });
		expect(JSON.stringify(target)).not.toContain("test-openrouter-secret");
	});

	it("redacts secrets passed as flags, assignments, authorization tokens and known provider keys", () => {
		const bearerHeader = ["Authorization: Bearer", "bearer-value-for-test"].join(" ");
		const basicHeader = ["Authorization: Basic", ["dXNlcjpwYXNzd29yZA", "=="].join("")].join(" ");
		const providerKey = ["sk", "or", "v1", "abcdefghijklmnopqrstuvwxyz"].join("-");
		const args = redactArguments([
			"--token",
			"token-value-for-test",
			"--api-key=inline-value-for-test",
			"OPENROUTER_API_KEY=environment-value-for-test",
			bearerHeader,
			basicHeader,
			providerKey,
			"safe-value",
		]);

		expect(args).toEqual([
			"--token",
			REDACTED,
			`--api-key=${REDACTED}`,
			`OPENROUTER_API_KEY=${REDACTED}`,
			`Authorization: Bearer ${REDACTED}`,
			`Authorization: Basic ${REDACTED}`,
			REDACTED,
			"safe-value",
		]);
	});

	it("redacts nested sensitive fields, check details and stderr", () => {
		const report: ReadinessReport = {
			tool: "mcp-readiness-check",
			version: "0.2.0",
			createdAt: "2026-09-16T00:00:00.000Z",
			target: { command: "node", args: ["server.mjs"] },
			summary: { status: "warning", passed: 1, warnings: 1, failed: 0, tools: 1, resources: 0, prompts: 0 },
			server: { capabilities: { apiKey: "nested-value-for-test" } },
			tools: [
				{
					name: "example",
					inputSchema: {
						type: "object",
						properties: { token: { type: "string", default: "schema-value-for-test" } },
					},
				},
			],
			resources: [],
			prompts: [],
			checks: [{ id: "example", title: "Example", severity: "warn", message: "password=message-value-for-test", details: ["token: detail-value-for-test"] }],
			stderr: ["Authorization: Bearer stderr-value-for-test"],
		};

		const sanitized = sanitizeReport(report);
		const serialized = JSON.stringify(sanitized);

		expect(serialized).not.toContain("nested-value-for-test");
		expect(serialized).not.toContain("schema-value-for-test");
		expect(serialized).not.toContain("message-value-for-test");
		expect(serialized).not.toContain("detail-value-for-test");
		expect(serialized).not.toContain("stderr-value-for-test");
		expect(redactText("normal diagnostic text")).toBe("normal diagnostic text");
		expect(redactText("https://user:password@example.com/path")).toBe("https://[REDACTED]@example.com/path");
	});
});
