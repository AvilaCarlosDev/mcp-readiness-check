import { describe, expect, it } from "vitest";
import { runReadinessCheck } from "../src/core/readiness.js";
import { REDACTED } from "../src/core/redact.js";
import { toMarkdown } from "../src/reporters/markdown.js";

describe("runReadinessCheck", () => {
	it("returns a working report without leaking target or stderr secrets", async () => {
		const report = await runReadinessCheck(
			{
				command: process.execPath,
				args: ["tests/fixtures/secret-stderr-server.mjs", "--token", "argument-secret-for-test"],
				env: { TEST_API_KEY: "environment-secret-for-test" },
			},
			{ timeoutMs: 5_000, includeSecurityAudit: false },
		);

		expect(report.summary.status).toBe("healthy");
		expect(report.summary.tools).toBe(1);
		expect(report.target.args).toEqual(["tests/fixtures/secret-stderr-server.mjs", "--token", REDACTED]);
		expect(report.target.env).toEqual({ TEST_API_KEY: REDACTED });
		expect(report.stderr).toContain(`api_key=${REDACTED}`);

		const serialized = JSON.stringify(report);
		expect(serialized).not.toContain("argument-secret-for-test");
		expect(serialized).not.toContain("environment-secret-for-test");
		expect(toMarkdown(report)).not.toContain("argument-secret-for-test");
		expect(toMarkdown(report)).not.toContain("environment-secret-for-test");
	});

	it("discovers every page of each advertised catalog", async () => {
		const report = await runReadinessCheck(
			{ command: process.execPath, args: ["tests/fixtures/paginated-catalog-server.mjs"] },
			{ timeoutMs: 5_000, includeSecurityAudit: true },
		);

		expect(report.summary.status).toBe("healthy");
		expect(report.summary.tools).toBe(2);
		expect(report.summary.resources).toBe(2);
		expect(report.summary.prompts).toBe(2);
		expect(report.checks.filter((check) => check.id.endsWith(".discovery") && check.severity === "pass")).toHaveLength(3);
	});

	it("bounds captured stderr from noisy servers", async () => {
		const report = await runReadinessCheck(
			{ command: process.execPath, args: ["tests/fixtures/noisy-stderr-server.mjs"] },
			{ timeoutMs: 5_000, includeSecurityAudit: false },
		);
		expect(report.stderr).toHaveLength(50);
		expect(report.stderr.at(-1)).toBe("fixture-line-59");
		expect(report.stderr).not.toContain("fixture-line-0");
	});
});
