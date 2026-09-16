#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { Command } from "commander";
import ora from "ora";
import { runReadinessCheck } from "./core/readiness.js";
import { targetFromCommand, targetFromConfig } from "./core/config.js";
import { printConsoleReport } from "./reporters/console.js";
import { toMarkdown } from "./reporters/markdown.js";
import { packageVersion } from "./utils/package.js";

const program = new Command();

program
	.name("mcp-readiness-check")
	.description("Verify MCP server readiness: capabilities, catalogs, schemas, static security, and reports.")
	.version(packageVersion());

program
	.command("check")
	.description("Run a full diagnostic against an MCP server")
	.option("-c, --config <path>", "Path to mcp-readiness.config.json")
	.option("-s, --server <name>", "Server name from config file")
	.option("--cmd <command>", "Server command to run through stdio")
	.option("--args <args...>", "Arguments for --cmd")
	.option("--cwd <path>", "Working directory for the server process")
	.option("--timeout <ms>", "Timeout per MCP operation", "15000")
	.option("--json", "Print JSON report")
	.option("--markdown <path>", "Write Markdown report to a file")
	.option("--no-security-audit", "Disable the static security audit")
	.action(async (options) => {
		try {
			const target = options.server
				? targetFromConfig(options.server, options.config)
				: targetFromCommand(options.cmd, options.args ?? [], options.cwd);

			if (!target.command) {
				throw new Error("Provide either --server from config or --cmd <command>.");
			}

			const timeoutMs = Number(options.timeout);
			if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout must be a positive number of milliseconds.");

			const spinner = ora("Running MCP readiness checks...").start();
			const report = await runReadinessCheck(target, {
				timeoutMs,
				includeSecurityAudit: options.securityAudit,
			});
			spinner.stop();

			if (options.markdown) {
				writeFileSync(options.markdown, toMarkdown(report));
			}

			if (options.json) {
				console.log(JSON.stringify(report, null, 2));
			} else {
				printConsoleReport(report);
				if (options.markdown) console.log(`Markdown report written to: ${options.markdown}`);
			}

			process.exitCode = report.summary.failed > 0 ? 1 : 0;
		} catch (error) {
			console.error(error instanceof Error ? error.message : String(error));
			process.exitCode = 1;
		}
	});

program
	.command("init")
	.description("Create an example mcp-readiness.config.json")
	.option("-o, --output <path>", "Output path", "mcp-readiness.config.json")
	.option("--force", "Overwrite an existing file")
	.action((options) => {
		if (existsSync(options.output) && !options.force) {
			console.error(`Refusing to overwrite existing file: ${options.output}. Use --force to replace it.`);
			process.exitCode = 1;
			return;
		}
		const example = {
			servers: {
				filesystem: {
					command: "npx",
					args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
					cwd: ".",
				},
			},
		};
		writeFileSync(options.output, `${JSON.stringify(example, null, 2)}\n`);
		console.log(`Created ${options.output}`);
	});

program.parseAsync(process.argv);
