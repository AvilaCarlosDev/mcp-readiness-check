export type Severity = "pass" | "info" | "warn" | "fail";

export type AuditCheck = {
	id: string;
	title: string;
	severity: Severity;
	message: string;
	details?: string[];
};

export type ToolInfo = {
	name: string;
	description?: string;
	inputSchema?: unknown;
	outputSchema?: unknown;
	annotations?: Record<string, unknown>;
};

export type ResourceInfo = {
	uri: string;
	name: string;
	description?: string;
	mimeType?: string;
};

export type PromptInfo = {
	name: string;
	description?: string;
	arguments?: Array<{ name: string; description?: string; required?: boolean }>;
};

export type ServerInfo = {
	name: string;
	version: string;
	description?: string;
	websiteUrl?: string;
};

export type ServerTarget = {
	command: string;
	args: string[];
	cwd?: string;
	env?: Record<string, string>;
};

export type ReadinessOptions = {
	timeoutMs: number;
	includeSecurityAudit: boolean;
};

export type ReadinessReport = {
	tool: "mcp-readiness-check";
	version: string;
	createdAt: string;
	target: ServerTarget;
	summary: {
		status: "healthy" | "warning" | "failed";
		passed: number;
		warnings: number;
		failed: number;
		tools: number;
		resources: number;
		prompts: number;
	};
	server?: {
		info?: ServerInfo;
		capabilities?: unknown;
		instructions?: string;
	};
	tools: ToolInfo[];
	resources: ResourceInfo[];
	prompts: PromptInfo[];
	checks: AuditCheck[];
	stderr: string[];
};
