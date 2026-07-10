# Widget Builder

No-code configuration tool for creating and customizing embeddable chat widgets that can be deployed on external websites.

## Features

- **No-Code Configuration** — Configure chat widget appearance and behavior through an intuitive form interface without writing code.
- **Theming** — Customize colors, fonts, positioning, and branding to match your website design.
- **Live Preview** — Real-time preview panel showing how the widget will appear on your website.
- **Embed Code Generation** — Automatically generate JavaScript embed snippets for production deployment.
- **Widget Management** — Create multiple widgets for different websites or use cases, each with independent configuration.

## Architecture

The widget builder is at `/widgets` with dynamic routes for individual widget configuration (`/widgets/[id]`). Widget configuration is stored server-side and served to the widget runtime via a public API.

## Dependencies

- Form components for configuration inputs
- Preview iframe or sandbox for live preview
- Code generation utilities for embed snippets
- API client for widget configuration CRUD

## Future Extensions

- Advanced behavior rules (proactive triggers, timing)
- Analytics integration for widget performance tracking
- A/B testing for widget variants
- Custom CSS injection
- Widget templates and marketplace
- Multi-language widget support
- Mobile-responsive widget layouts
