import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
	encoding: "utf8",
	stdio: ["ignore", "pipe", "inherit"],
});

if (result.status !== 0) process.exit(result.status ?? 1);

const parsed = JSON.parse(result.stdout);
const packages = Array.isArray(parsed) ? parsed : Object.values(parsed);
const files = new Set(packages.flatMap((entry) => entry.files.map((file) => file.path)));
const requiredFiles = ["dist/cli.js", "README.md", "README.en.md", "LICENSE", "SECURITY.md", "CHANGELOG.md", "report.example.md", "mcp-readiness.config.example.json"];
const missing = requiredFiles.filter((file) => !files.has(file));
const forbiddenFiles = ["dist/core/doctor.js", "dist/core/doctor.d.ts"];
const stale = forbiddenFiles.filter((file) => files.has(file));

if (missing.length > 0) {
	console.error(`Package is missing required files: ${missing.join(", ")}`);
	process.exit(1);
}

if (stale.length > 0) {
	console.error(`Package contains stale pre-rebrand files: ${stale.join(", ")}`);
	process.exit(1);
}

console.log(`Package contains ${files.size} files, including the CLI entry point and release documentation.`);
