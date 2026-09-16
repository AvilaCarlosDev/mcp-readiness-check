import { describe, expect, it } from "vitest";
import { checkToolSchemas } from "../src/core/schema.js";

describe("JSON Schema validation", () => {
	it.each([
		"http://json-schema.org/draft-07/schema#",
		"https://json-schema.org/draft/2019-09/schema",
		"https://json-schema.org/draft/2020-12/schema",
	])("validates the declared %s dialect", ($schema) => {
		const checks = checkToolSchemas({
			name: "echo",
			inputSchema: { $schema, type: "object", properties: { message: { type: "string", minLength: 1 } }, required: ["message"] },
		});
		expect(checks).toHaveLength(1);
		expect(checks[0]?.severity).toBe("pass");
	});

	it("fails malformed schemas rather than only checking the root shape", () => {
		const checks = checkToolSchemas({
			name: "broken",
			inputSchema: { type: "object", properties: { count: { type: "not-a-json-schema-type" } } },
		});
		expect(checks.some((check) => check.severity === "fail" && check.id.endsWith(".invalid"))).toBe(true);
	});

	it("validates outputSchema when advertised", () => {
		const checks = checkToolSchemas({
			name: "structured",
			inputSchema: { type: "object", properties: {} },
			outputSchema: { type: "array", items: { type: "string" } },
		});
		expect(checks.some((check) => check.id.includes("output_schema.root_type") && check.severity === "fail")).toBe(true);
	});

	it("rejects schemas above the defensive size limit", () => {
		const checks = checkToolSchemas({
			name: "oversized",
			inputSchema: { type: "object", description: "x".repeat(1_000_001), properties: {} },
		});
		expect(checks.some((check) => check.id.endsWith(".size") && check.severity === "fail")).toBe(true);
	});
});
