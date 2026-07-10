# Component Library

Reusable UI components shared across the dashboard applications. Organized by domain and usage category.

## Directory Structure

- `ui/` — Primitive UI components (buttons, inputs, modals, dropdowns, cards, badges). Base building blocks for the design system.
- `layout/` — Layout components including `DashboardLayout`, `Sidebar`, `Header`, and `PageHeader`. Used by all dashboard applications.
- `chat/` — Conversation UI components. `ChatContainer`, `ChatMessage`, `ChatInput`, and `ConversationSidebar` for the messaging interface.
- `knowledge/` — Knowledge management components. `DocumentUpload` for file upload with progress tracking.
- `workflow/` — Workflow builder components. `WorkflowCanvas` (visual node editor), `WorkflowNodeEditor`, `TriggerSelector`, and `ActionSelector`.
- `analytics/` — Analytics visualization components. `StatCard`, `BarChart`, and `PieChart` for metric display.
- `theme-provider.tsx` — Theme context provider using next-themes for dark mode support.

## Design Principles

- All components follow the project's Tailwind CSS design system
- Components accept `className` prop for style customization
- Domain components (chat, knowledge, workflow) encapsulate business logic and API interactions
- Layout components handle responsive breakpoints and sidebar state management

## Dependencies

- `@conversation-platform/ui` for shared UI primitives
- `lucide-react` for iconography
- `class-variance-authority` and `clsx` for component styling
- `tailwind-merge` for className merging

## Future Extensions

- Component storybook with interactive documentation
- Accessibility-focused component audit and improvements
- Animation and transition primitives
- Data display components (tables, lists, data grids)
- Form components with built-in validation integration
- Mobile-specific component variants
