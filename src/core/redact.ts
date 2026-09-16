import type { ReadinessReport, ServerTarget } from "./types.js";

export const REDACTED = "[REDACTED]";

const SENSITIVE_KEY_PATTERN = /(?:api[_-]?key|apiKey|token|secret|password|passwd|private[_-]?key|privateKey|access[_-]?key|accessKey|authorization|credential)s?/i;
const SENSITIVE_FLAG_PATTERN = /^--?(?:api[-_]?key|token|secret|password|passwd|private[-_]?key|access[-_]?key|authorization|auth|credential)s?$/i;

export function redactText(value: string): string {
	return value
		.replace(/(https?:\/\/)[^/\s:@]+:[^@\s/]+@/gi, `$1${REDACTED}@`)
		.replace(/(\bAuthorization\s*[:=]\s*(?:Bearer|Basic)\s+)[^\s,;]+/gi, `$1${REDACTED}`)
		.replace(/(\b(?:Bearer|Basic)\s+)[^\s,;]+/gi, `$1${REDACTED}`)
		.replace(/(\bAuthorization\s*[:=]\s*)(?!(?:Bearer|Basic)\b)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, `$1${REDACTED}`)
		.replace(/(\b(?:api[_-]?key|token|secret|password|passwd|private[_-]?key|access[_-]?key|credential)s?\b\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi, `$1${REDACTED}`)
		.replace(/\bsk-(?:or-)?[A-Za-z0-9_-]{12,}\b/g, REDACTED)
		.replace(/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, REDACTED)
		.replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, REDACTED);
}

export function redactArguments(args: string[]): string[] {
	let redactNext = false;

	return args.map((argument) => {
		if (redactNext) {
			redactNext = false;
			return REDACTED;
		}

		if (SENSITIVE_FLAG_PATTERN.test(argument)) {
			redactNext = true;
			return argument;
		}

		const equalsIndex = argument.indexOf("=");
		const assignmentKey = argument.slice(0, equalsIndex);
		if (equalsIndex > 0 && /^(?:--?)?[A-Za-z_][A-Za-z0-9_-]*$/.test(assignmentKey) && isSensitiveKey(assignmentKey)) {
			return `${argument.slice(0, equalsIndex + 1)}${REDACTED}`;
		}

		return redactText(argument);
	});
}

export function sanitizeTarget(target: ServerTarget): ServerTarget {
	return {
		command: redactText(target.command),
		args: redactArguments(target.args),
		...(target.cwd ? { cwd: redactText(target.cwd) } : {}),
		...(target.env
			? {
					env: Object.fromEntries(Object.keys(target.env).map((key) => [key, REDACTED])),
				}
			: {}),
	};
}

export function sanitizeReport(report: ReadinessReport): ReadinessReport {
	return {
		...report,
		target: sanitizeTarget(report.target),
		server: report.server ? (redactUnknown(report.server) as ReadinessReport["server"]) : undefined,
		tools: report.tools.map((tool) => ({
			...tool,
			description: tool.description ? redactText(tool.description) : undefined,
			inputSchema: redactUnknown(tool.inputSchema),
			outputSchema: redactUnknown(tool.outputSchema),
			annotations: tool.annotations ? (redactUnknown(tool.annotations) as Record<string, unknown>) : undefined,
		})),
		resources: report.resources.map((resource) => ({
			...resource,
			uri: redactText(resource.uri),
			name: redactText(resource.name),
			description: resource.description ? redactText(resource.description) : undefined,
		})),
		prompts: report.prompts.map((prompt) => ({
			...prompt,
			name: redactText(prompt.name),
			description: prompt.description ? redactText(prompt.description) : undefined,
			arguments: prompt.arguments?.map((argument) => ({
				...argument,
				name: redactText(argument.name),
				description: argument.description ? redactText(argument.description) : undefined,
			})),
		})),
		checks: report.checks.map((check) => ({
			...check,
			message: redactText(check.message),
			details: check.details?.map(redactText),
		})),
		stderr: report.stderr.map(redactText),
	};
}

function redactUnknown(value: unknown, key?: string): unknown {
	if (key && isSensitiveKey(key)) return REDACTED;
	if (typeof value === "string") return redactText(value);
	if (Array.isArray(value)) return value.map((item) => redactUnknown(item));
	if (value && typeof value === "object") {
		return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactUnknown(entryValue, entryKey)]));
	}
	return value;
}

function isSensitiveKey(key: string): boolean {
	return SENSITIVE_KEY_PATTERN.test(key.replace(/^--?/, ""));
}
