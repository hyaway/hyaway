# UI Primitives

> **Status**: Active pattern used throughout the codebase

## Overview

Base UI components following [shadcn/ui](https://ui.shadcn.com/) patterns. These are low-level building blocks built on Base UI primitives.

**For detailed API and usage examples**, use the shadcn MCP tool or visit [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

**For Base UI primitives documentation**, see [base-ui.com/llms.txt](https://base-ui.com/llms.txt).

## Available Components

### Layout & Structure

| Component   | File              | Description                                        |
| ----------- | ----------------- | -------------------------------------------------- |
| Card        | `card.tsx`        | Container with header, content, footer             |
| Collapsible | `collapsible.tsx` | Expandable content section                         |
| Separator   | `separator.tsx`   | Visual divider                                     |
| Sidebar     | `sidebar.tsx`     | App sidebar (modified for dual left/right support) |
| ScrollArea  | `scroll-area.tsx` | Custom scrollbar container                         |

> **Note:** The Sidebar component is **modified from shadcn's default** to support both left and right collapsible sidebars simultaneously. State is per-side via `useSidebarSide(side)` from `stores/sidebar-store.ts`. See [State Management](../state-management.md#sidebar-store) for details.

### Forms & Inputs

| Component   | File               | Description                    |
| ----------- | ------------------ | ------------------------------ |
| Button      | `button.tsx`       | Clickable button with variants |
| Input       | `input.tsx`        | Text input field               |
| Textarea    | `textarea.tsx`     | Multi-line text input          |
| InputGroup  | `input-group.tsx`  | Input with prefix/suffix       |
| Label       | `label.tsx`        | Form field label               |
| Field       | `field.tsx`        | Label + input + error wrapper  |
| Switch      | `switch.tsx`       | Toggle switch                  |
| Slider      | `slider.tsx`       | Range slider                   |
| Toggle      | `toggle.tsx`       | Toggle button                  |
| ToggleGroup | `toggle-group.tsx` | Group of toggle buttons        |

### Overlays & Dialogs

| Component    | File                | Description                   |
| ------------ | ------------------- | ----------------------------- |
| Dialog       | `dialog.tsx`        | Modal dialog                  |
| Sheet        | `sheet.tsx`         | Slide-out panel               |
| Drawer       | `drawer.tsx`        | Mobile-friendly bottom drawer |
| Popover      | `popover.tsx`       | Floating content panel        |
| Tooltip      | `tooltip.tsx`       | Hover tooltip                 |
| ContextMenu  | `context-menu.tsx`  | Right-click menu              |
| DropdownMenu | `dropdown-menu.tsx` | Click-triggered menu          |
| Alert        | `alert.tsx`         | Alert/notification banner     |

### Navigation

| Component       | File                    | Description            |
| --------------- | ----------------------- | ---------------------- |
| Breadcrumb      | `breadcrumb.tsx`        | Navigation breadcrumbs |
| NavigationMenu  | `navigation-menu.tsx`   | Primary navigation     |
| BottomNavButton | `bottom-nav-button.tsx` | Mobile bottom nav item |

### Display

| Component | File           | Description               |
| --------- | -------------- | ------------------------- |
| Badge     | `badge.tsx`    | Small label/tag           |
| Heading   | `heading.tsx`  | Semantic headings (h1-h6) |
| Skeleton  | `skeleton.tsx` | Loading placeholder       |
| Spinner   | `spinner.tsx`  | Loading spinner           |

### Utilities

| Component   | File               | Description                           |
| ----------- | ------------------ | ------------------------------------- |
| TouchTarget | `touch-target.tsx` | Expands touch area for small elements |
| Item        | `item.tsx`         | Generic list item primitive           |

## Usage Pattern

Import directly from the component file:

```tsx
import { Button } from "@/components/ui-primitives/button";
import { Card, CardHeader, CardContent } from "@/components/ui-primitives/card";
```

## Customization

Components use Tailwind CSS and CSS variables for theming. Override styles via:

- `className` prop for one-off changes
- CSS variables in `src/styles.css` for global theme changes

## Adding New Primitives

Use the shadcn CLI to add components:

```bash
npx shadcn@latest add [component-name]
```

Components are installed to `src/components/ui-primitives/`.
