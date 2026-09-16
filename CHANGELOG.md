# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Full JSON Schema validation for draft-07, 2019-09, and 2020-12 tool input/output contracts.
- Paginated discovery and consistency checks for advertised tools, resources, and prompts.
- Static security findings for tool poisoning, sensitive-data exposure, embedded credentials, sensitive inputs, and risky annotations.
- Automatic redaction for environment values, credential arguments, authorization headers, known provider-key formats, nested sensitive fields, diagnostic messages, and captured `stderr`.
- Tests covering report redaction.
- Package-content validation for release readiness.

### Changed

- Renamed the project from MCP Doctor to MCP Readiness Check to avoid an existing package and clarify its purpose.
- Replaced generic security advisories with findings derived from the server's advertised metadata.
- Replaced the placeholder security policy with project-specific reporting and support guidance.
- Documented the unpublished npm status and truthful source-installation flow.
