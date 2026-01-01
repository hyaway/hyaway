# Responsive Design

> **Status**: Active pattern used throughout the codebase

## Overview

The project uses Tailwind CSS v4 with custom variants for handling constrained viewport scenarios beyond standard breakpoints.

## Custom Variants

Defined in `src/styles.css`:

### `short:` - Limited Vertical Space

```css
@custom-variant short (@media (max-height: 500px));
```

**Covers:**

- Tiny phones
- Foldable secondary screens
- Landscape phones

**Use for:** Hiding non-essential UI, reducing spacing, switching to compact layouts.

### `short-wide:` - Phone Landscape

```css
@custom-variant short-wide (@media (max-height: 500px) and (min-width: 640px));
```

**Covers:**

- Phone landscape specifically (short + horizontal space available)

**Use for:** Overriding `short:` styles when horizontal space allows for different layouts.

## Usage Pattern

Use `short:` as the base for all constrained-height layouts, then `short-wide:` to refine for landscape:

```tsx
className =
  "h-(--header-height) short:h-(--header-height-short) short:hidden short-wide:flex";
```

## Standard Breakpoints

Tailwind's default breakpoints are used for width-based responsive design:

| Breakpoint | Min Width | Typical Use                   |
| ---------- | --------- | ----------------------------- |
| `sm:`      | 640px     | Tablet portrait, large phones |
| `md:`      | 768px     | Tablet landscape              |
| `lg:`      | 1024px    | Desktop                       |
| `xl:`      | 1280px    | Large desktop                 |
| `2xl:`     | 1536px    | Extra large screens           |

## CSS Variables for Layout

<!-- TODO: Document layout variables like --header-height, --sidebar-width, etc. -->

See `src/styles.css` for the full list of CSS custom properties.
