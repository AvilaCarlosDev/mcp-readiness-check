import { redactText } from "./redact.js";
import type { AuditCheck, ServerTarget, ToolInfo } from "./types.js";

const SENSITIVE_KEY = /(?:api[_-]?key|apiKey|token|secret|password|passwd|private[_-]?key|privateKey|access[_-]?key|accessKey|authorization|credential)s?/i;
const HIGH_IMPACT = /\b(?:delete|remove|destroy|drop|truncate|execute|exec|shell|command|terminal|write|update|create|upload|send|publish|deploy|payment|transfer)\b/i;
const NETWORK_ACCESS = /\b(?:http|url|fetch|network|webhook|upload|download|remote|email|send)\b/i;
const SENSITIVE_DISCLOSURE = /\b(?:returns?|reveals?|prints?|reads?|lists?|exposes?)\b[^.\n]{0,80}\b(?:environment variables?|secrets?|credentials?|tokens?|passwords?)\b/i;
const PROMPT_INJECTION = [
	/ignore (?:all |any )?(?:previous|prior|system) instructions/i,
	/disregard (?:all |any )?(?:previous|prior|system) instructions/i,
	/(?:send|upload|exfiltrat\w*)[^.\n]{0,80}(?:secret|token|password|credential|environment variable|system prompt)/i,
	/(?:hide|conceal|do not tell|don't tell)[^.\n]{0,60}(?:user|operator|human)/i,
];

export function auditSecurity(tools: ToolInfo[], instructions?: string, target?: ServerTarget): AuditCheck[] {
	const checks: AuditCheck[] = [];
	checks.push(...auditLaunchTarget(target));
	const poisoned = tools.filter((tool) => containsPromptInjection(`${tool.name}\n${tool.description ?? ""}`)).map((tool) => tool.name);
	if (instructions && containsPromptInjection(instructions)) poisoned.push("server instructions");

	checks.push(poisoned.length > 0
		? {
				id: "security.prompt_injection",
				title: "Prompt-injection indicators",
				severity: "fail",
				message: "Advertised metadata contains instruction patterns associated with tool poisoning or secret exfiltration.",
				details: unique(poisoned),
			}
		: {
				id: "security.prompt_injection",
				title: "Prompt-injection indicators",
				severity: "pass",
				message: "No known prompt-injection or secret-exfiltration patterns were found in advertised metadata.",
			});

	const disclosureTools = tools
		.filter((tool) => SENSITIVE_DISCLOSURE.test(`${tool.name}\n${tool.description ?? ""}`))
		.map((tool) => tool.name);
	checks.push(disclosureTools.length > 0
		? {
				id: "security.sensitive_data_exposure",
				title: "Sensitive data exposure",
				severity: "fail",
				message: "Some tools advertise behavior that can return credentials, secrets, or process environment data.",
				details: unique(disclosureTools),
			}
		: {
				id: "security.sensitive_data_exposure",
				title: "Sensitive data exposure",
				severity: "pass",
				message: "No tool explicitly advertises returning credentials, secrets, or process environment data.",
			});

	const embeddedSecrets = tools.flatMap((tool) => [
		...findEmbeddedSensitiveValues(tool.inputSchema, `${tool.name}.inputSchema`),
		...findEmbeddedSensitiveValues(tool.outputSchema, `${tool.name}.outputSchema`),
	]);
	checks.push(embeddedSecrets.length > 0
		? {
				id: "security.embedded_credentials",
				title: "Embedded credential material",
				severity: "fail",
				message: "Sensitive schema fields contain defaults, constants, examples, or enum values. Values are intentionally omitted from this report.",
				details: unique(embeddedSecrets),
			}
		: {
				id: "security.embedded_credentials",
				title: "Embedded credential material",
				severity: "pass",
				message: "No credential-like values were embedded in advertised schemas.",
			});

	const annotationRisks: string[] = [];
	for (const tool of tools) {
		const text = `${tool.name} ${tool.description ?? ""}`;
		const annotations = tool.annotations ?? {};
		if (HIGH_IMPACT.test(text) && annotations.readOnlyHint !== false && annotations.destructiveHint !== true) {
			annotationRisks.push(`${tool.name}: high-impact behavior is not declared`);
		}
		if (HIGH_IMPACT.test(text) && annotations.readOnlyHint === true) {
			annotationRisks.push(`${tool.name}: high-impact behavior conflicts with readOnlyHint=true`);
		}
		if (NETWORK_ACCESS.test(text) && annotations.openWorldHint === false) {
			annotationRisks.push(`${tool.name}: network-facing behavior conflicts with openWorldHint=false`);
		}
	}
	checks.push(annotationRisks.length > 0
		? {
				id: "security.annotations",
				title: "Security-relevant annotations",
				severity: "warn",
				message: "Some high-impact tools have missing or contradictory safety annotations. These are heuristic findings and require review.",
				details: unique(annotationRisks),
			}
		: {
				id: "security.annotations",
				title: "Security-relevant annotations",
				severity: "pass",
				message: "No missing or contradictory annotations were found for tools identified as high impact.",
			});

	const sensitiveInputs = tools.flatMap((tool) => findSensitiveFields(tool.inputSchema, `${tool.name}.inputSchema`));
	if (sensitiveInputs.length > 0) {
		checks.push({
			id: "security.sensitive_inputs",
			title: "Sensitive inputs",
			severity: "info",
			message: "Some tools accept credential-like fields. Confirm the server avoids logging or persisting them.",
			details: unique(sensitiveInputs),
		});
	}

	return checks;
}

function auditLaunchTarget(target?: ServerTarget): AuditCheck[] {
	if (!target) return [];
	const findings: string[] = [];
	const executable = target.command.split(/[\\/]/).at(-1)?.toLowerCase() ?? target.command.toLowerCase();
	if (["bash", "sh", "zsh", "fish", "cmd", "cmd.exe", "powershell", "pwsh"].includes(executable)) {
		findings.push("Server is launched through a general-purpose command shell.");
	}
	if (["npx", "npm", "pnpm", "yarn", "bunx"].includes(executable)) {
		const packageSpec = target.args.find((argument) => !argument.startsWith("-"));
		if (packageSpec && !hasPinnedVersion(packageSpec)) findings.push(`Package runner uses an unpinned package: ${redactText(packageSpec)}`);
	}
	return [findings.length > 0
		? {
				id: "security.launch_target",
				title: "Launch target",
				severity: "warn",
				message: "The server launch command has supply-chain or command-execution risk that should be reviewed.",
				details: findings,
			}
		: {
				id: "security.launch_target",
				title: "Launch target",
				severity: "pass",
				message: "No shell wrapper or unpinned package-runner target was detected.",
			}];
}

function hasPinnedVersion(packageSpec: string): boolean {
	if (packageSpec.startsWith("." ) || packageSpec.startsWith("/") || packageSpec.startsWith("file:") || packageSpec.startsWith("git")) return true;
	const versionSeparator = packageSpec.lastIndexOf("@");
	return packageSpec.startsWith("@") ? versionSeparator > packageSpec.indexOf("/") : versionSeparator > 0;
}

function containsPromptInjection(text: string): boolean {
	return PROMPT_INJECTION.some((pattern) => pattern.test(text));
}

function findEmbeddedSensitiveValues(value: unknown, path: string, sensitive = false): string[] {
	if (Array.isArray(value)) return value.flatMap((item, index) => findEmbeddedSensitiveValues(item, `${path}[${index}]`, sensitive));
	if (!isRecord(value)) return [];
	const findings: string[] = [];
	for (const [key, child] of Object.entries(value)) {
		const childPath = `${path}.${key}`;
		const childSensitive = sensitive || SENSITIVE_KEY.test(key);
		if (childSensitive && ["default", "const", "examples", "enum"].includes(key) && hasMaterialValue(child)) {
			findings.push(childPath);
		}
		findings.push(...findEmbeddedSensitiveValues(child, childPath, childSensitive));
	}
	return findings;
}

function findSensitiveFields(value: unknown, path: string): string[] {
	if (Array.isArray(value)) return value.flatMap((item, index) => findSensitiveFields(item, `${path}[${index}]`));
	if (!isRecord(value)) return [];
	const findings: string[] = [];
	for (const [key, child] of Object.entries(value)) {
		const childPath = `${path}.${key}`;
		if (SENSITIVE_KEY.test(key)) findings.push(childPath);
		findings.push(...findSensitiveFields(child, childPath));
	}
	return findings;
}

function hasMaterialValue(value: unknown): boolean {
	if (typeof value === "string") return value.trim().length > 0;
	if (Array.isArray(value)) return value.length > 0;
	return value !== undefined && value !== null;
}

function unique(values: string[]): string[] {
	return [...new Set(values)].slice(0, 100);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
