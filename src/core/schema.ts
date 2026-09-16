import AjvModule, { type ErrorObject } from "ajv";
import Ajv2019Module from "ajv/dist/2019.js";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import type { AuditCheck, ToolInfo } from "./types.js";

const validatorOptions = { allErrors: true, strict: false, validateFormats: true, logger: false } as const;
const MAX_SCHEMA_BYTES = 1_000_000;
const validators = {
	draft7: new AjvModule.default(validatorOptions),
	draft2019: new Ajv2019Module.default(validatorOptions),
	draft2020: new Ajv2020Module.default(validatorOptions),
};
for (const validator of Object.values(validators)) addFormatsModule.default(validator);

export function checkToolSchemas(tool: ToolInfo): AuditCheck[] {
	return [
		...checkSchema(tool.name, "input", tool.inputSchema, true),
		...(tool.outputSchema === undefined ? [] : checkSchema(tool.name, "output", tool.outputSchema, false)),
	];
}

function checkSchema(toolName: string, kind: "input" | "output", schema: unknown, required: boolean): AuditCheck[] {
	const label = `${kind}Schema`;
	const id = `tool.${toolName}.${kind}_schema`;

	if (schema === undefined) {
		return required
			? [{ id: `${id}.missing`, title: `${label}: ${toolName}`, severity: "fail", message: `${label} is required.` }]
			: [];
	}

	if (!isRecord(schema)) {
		return [{ id: `${id}.shape`, title: `${label}: ${toolName}`, severity: "fail", message: `${label} must be a JSON Schema object.` }];
	}

	if (schema.type !== "object") {
		return [{
			id: `${id}.root_type`,
			title: `${label} root type: ${toolName}`,
			severity: "fail",
			message: `${label} must describe an object at its root for MCP tool arguments or structured output.`,
		}];
	}

	if (JSON.stringify(schema).length > MAX_SCHEMA_BYTES) {
		return [{
			id: `${id}.size`,
			title: `${label}: ${toolName}`,
			severity: "fail",
			message: `${label} exceeds the ${MAX_SCHEMA_BYTES}-byte safety limit.`,
		}];
	}

	try {
		const validator = selectValidator(schema.$schema);
		const valid = validator.validateSchema(schema);
		if (!valid) return [invalidSchemaCheck(id, label, toolName, validator.errors ?? [])];
		validator.compile(schema);
	} catch (error) {
		return [{
			id: `${id}.invalid`,
			title: `${label}: ${toolName}`,
			severity: "fail",
			message: `${label} is not valid for its declared JSON Schema dialect.`,
			details: [error instanceof Error ? error.message : String(error)],
		}];
	}

	return [{
		id: `${id}.valid`,
		title: `${label}: ${toolName}`,
		severity: "pass",
		message: `${label} is valid ${dialectName(schema.$schema)} JSON Schema with an object root.`,
	}];
}

function invalidSchemaCheck(id: string, label: string, toolName: string, errors: ErrorObject[]): AuditCheck {
	return {
		id: `${id}.invalid`,
		title: `${label}: ${toolName}`,
		severity: "fail",
		message: `${label} is not valid for its declared JSON Schema dialect.`,
		details: errors.slice(0, 10).map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"} (${error.schemaPath})`),
	};
}

function selectValidator(schemaDialect: unknown) {
	if (typeof schemaDialect !== "string" || schemaDialect.includes("2020-12")) return validators.draft2020;
	if (schemaDialect.includes("2019-09")) return validators.draft2019;
	if (schemaDialect.includes("draft-07")) return validators.draft7;
	throw new Error(`Unsupported JSON Schema dialect: ${schemaDialect}`);
}

function dialectName(schemaDialect: unknown): string {
	if (typeof schemaDialect !== "string") return "2020-12";
	if (schemaDialect.includes("2019-09")) return "2019-09";
	if (schemaDialect.includes("draft-07")) return "draft-07";
	return schemaDialect;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
