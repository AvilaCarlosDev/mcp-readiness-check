import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Las pruebas del CLI arrancan procesos reales de Node y de servidores MCP.
		testTimeout: 30_000,
		coverage: {
			provider: "v8",
			include: ["src/**"],
			// cli.ts solo llama a createProgram(); lo ejercitan las pruebas de proceso real, que v8 no mide.
			exclude: ["src/cli.ts"],
			reporter: ["text", "lcov"],
			thresholds: { statements: 90, lines: 90, functions: 90, branches: 75 },
		},
	},
});
