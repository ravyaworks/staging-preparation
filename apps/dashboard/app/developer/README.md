# Developer Portal

Self-service developer portal for API key management, API reference documentation, and SDK integration guides.

## Features

- **API Key Management** — Create, rotate, and revoke API keys with granular permissions and usage tracking.
- **Endpoint Reference** — Interactive API documentation with request/response examples, schema definitions, and try-it-out functionality.
- **Code Examples** — Copy-paste ready code snippets in JavaScript, TypeScript, Python, and cURL for every endpoint.
- **SDK Documentation** — Integration guides for the JavaScript/TypeScript SDK, React SDK, and community SDKs.
- **Rate Limits & Usage** — View current rate limits, usage statistics, and plan details for your API keys.

## Architecture

The developer portal is a single-page reference application at `/developer`. It fetches API documentation from the API gateway service and displays it in a structured, searchable layout.

## Dependencies

- API client with elevated permissions for key management
- Documentation rendering utilities
- Code syntax highlighting and copy-to-clipboard functionality
- Interactive API testing components (playground)

## Future Extensions

- Automatic SDK code generation from OpenAPI specs
- Webhook testing tools with event simulation
- API changelog and version migration guides
- Developer community forum integration
- API health status page
- SDK package download and version management
