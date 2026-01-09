# Responsive Design

> **Status**: Active pattern used throughout the codebase

## Overview

The project uses Tailwind CSS v4 with a custom `short:` variant for handling constrained viewport scenarios. This variant can be combined (stacked) with standard breakpoint and container query variants.

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

### Combining with Other Variants

The `short:` variant can be stacked with any other variant:

```tsx
// Short + viewport width
className = "short:hidden short:sm:flex";

// Short + container width (inside @container)
className = "short:sr-only short:@xl:not-sr-only";
```

## Usage Patterns

### Pattern 1: Viewport-based (no sidebars)

Use `short:` + `short:sm:` when the component's width follows viewport width:

```tsx
className = "short:hidden short:sm:flex";
```

### Pattern 2: Container-based (with sidebars)

Use `short:` + `short:@xl:` inside `@container` contexts:

```tsx
// Parent has @container class
className = "short:gap-0 short:@xl:gap-1.5";
```

### Pattern 3: Width-only container queries

For width changes unrelated to viewport height, use standard container queries:

```tsx
className = "flex-col @xl:flex-row";
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

## Container Query Sizes

Use with `@` prefix (e.g., `@sm:`) or combined with short (`short:@sm:`):

| Size    | Min Width | Notes |
| ------- | --------- | ----- |
| `@3xs:` | 16rem     | 256px |
| `@2xs:` | 18rem     | 288px |
| `@xs:`  | 20rem     | 320px |
| `@sm:`  | 24rem     | 384px |
| `@md:`  | 28rem     | 448px |
| `@lg:`  | 32rem     | 512px |
| `@xl:`  | 36rem     | 576px |
| `@2xl:` | 42rem     | 672px |

## CSS Variables for Layout

The app shell exposes a small set of layout variables in `src/styles.css` so components can stay consistent across breakpoints and `short:` viewports.

| Variable                 | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `--header-height`        | Default header height                        |
| `--header-height-short`  | Compact header height for `short:` viewports |
| `--footer-height`        | Default mobile footer height                 |
| `--footer-height-sm`     | Tablet/desktop footer height (`sm:`)         |
| `--footer-height-short`  | Compact footer height for `short:` viewports |
| `--sidebar-width`        | Desktop expanded sidebar width               |
| `--sidebar-width-mobile` | Mobile sidebar sheet width                   |
| `--sidebar-width-icon`   | Collapsed icon-only sidebar width            |

### Tailwind Usage

Tailwind v4 supports referencing CSS variables via the parentheses syntax:

```tsx
// Header height adjusts for short viewports
className = "h-(--header-height) short:h-(--header-height-short)";

// Footer height adjusts for both width and short viewports
className =
  "h-(--footer-height) sm:h-(--footer-height-sm) short:h-(--footer-height-short)";

// Sidebar width
className = "w-(--sidebar-width)";
```

See `src/styles.css` for the authoritative definitions and additional variables (animation duration/easing).
