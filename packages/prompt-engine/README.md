# @conversation-platform/prompt-engine

Prompt template management with variable substitution, versioning, and composition.

## Responsibilities
- `PromptRegistry` — register, retrieve, compile, and version-track named prompt templates
- `compileTemplate` — substitute `{{variable}}` placeholders with configurable behavior for missing values (`throw`, `skip`, `empty`)
- Template versioning via `incrementVersion` with automatic history capture in the registry
- `SystemPromptBuilder` — fluent builder for assembling system prompts (role, instructions, constraints, rules, examples)
- `UserPromptBuilder` — fluent builder for user prompts (questions, instructions, data, references)
- `validateTemplate` and `validateCompiledContent` for compile-time correctness checks

## Dependencies
- None (zero internal dependencies)

## Public API
Exports `PromptRegistry`, `createTemplate`, `compileTemplate`, `incrementVersion`, `SystemPromptBuilder`, `UserPromptBuilder`, and validator functions.

## Future
Add template inheritance/composition (one template extending another) and multi-language template variants keyed by locale.
