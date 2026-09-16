import { describe, expect, it } from "vitest";
import { checkCapabilities } from "../src/core/capabilities.js";

describe("capability analysis", () => {
	it("compares advertised capabilities with discovered catalogs", () => {
		const checks = checkCapabilities(
			{ tools: {}, resources: {}, prompts: {} },
			{ name: "fixture", version: "1.0.0" },
			{
				tools: [{ name: "echo", inputSchema: { type: "object" } }],
				resources: [{ name: "readme", uri: "file:///README.md" }],
				prompts: [{ name: "review" }],
				discovered: new Set(["tools", "resources", "prompts"]),
			},
		);
		expect(checks.filter((check) => check.severity === "fail" || check.severity === "warn")).toHaveLength(0);
		expect(checks.filter((check) => check.id.endsWith(".discovery"))).toHaveLength(3);
	});

	it("fails missing server identity and unreachable advertised catalogs", () => {
		const checks = checkCapabilities(
			{ tools: {} },
			undefined,
			{ tools: [], resources: [], prompts: [], discovered: new Set() },
		);
		expect(checks.some((check) => check.id === "server.metadata" && check.severity === "fail")).toBe(true);
		expect(checks.some((check) => check.id === "capabilities.tools.discovery" && check.severity === "fail")).toBe(true);
	});
});
