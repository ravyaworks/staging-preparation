# Documentation Site

In-app documentation providing getting started guides, API documentation, and architecture overviews for the Conversation Platform.

## Features

- **Getting Started** — Step-by-step guides for new users to set up their account, create conversations, and configure AI agents.
- **API Documentation** — Comprehensive API reference with endpoints, request/response schemas, authentication details, and error codes.
- **Architecture Overview** — High-level architecture documentation covering system design, data flow, and deployment topology.
- **Search** — Full-text search across all documentation with categorized results.

## Architecture

The documentation site is a static documentation layout at `/docs` built with Next.js. Content can be authored in Markdown and rendered with the same components used across the dashboard for consistency.

## Dependencies

- Markdown rendering utilities
- Documentation layout components
- Search indexing utilities

## Future Extensions

- Versioned documentation for different API versions
- Interactive tutorials and walkthroughs
- Video embedding for visual guides
- Community-contributed documentation
- Documentation analytics (popular searches, missing content)
- PDF export for offline reading
