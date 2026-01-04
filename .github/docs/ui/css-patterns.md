# CSS Patterns

> **Status**: Active pattern used throughout the codebase

## Overview

This document covers CSS patterns for animations, transitions, and using CSS custom properties to avoid unnecessary React re-renders.

## CSS Variables for Settings

### The Problem

When UI settings (like animation durations) are consumed via Zustand hooks inside individual components, every component re-renders when that setting changes:

```tsx
// ❌ Bad: Every ThumbnailGalleryItem re-renders when duration changes
function ThumbnailGalleryItem({ item }) {
  const hoverDuration = useGalleryHoverZoomDuration(); // Zustand subscription
  return (
    <div style={{ transitionDuration: `${hoverDuration}ms` }}>{/* ... */}</div>
  );
}
```

With 100+ visible items, changing a slider causes 100+ re-renders.

### The Solution: CSS Variables at Root

Read settings once at a parent level and pass them down via CSS custom properties:

```tsx
// ✅ Good: Only parent re-renders, children use CSS variables
function ThumbnailGallery({ items }) {
  const hoverDuration = useGalleryHoverZoomDuration();
  const entryDuration = useGalleryEntryDuration();
  const reflowDuration = useGalleryReflowDuration();

  const style = {
    "--gallery-hover-zoom-duration": `${hoverDuration}ms`,
    "--gallery-entry-duration": `${entryDuration}ms`,
    "--gallery-reflow-duration": `${reflowDuration}ms`,
  } as React.CSSProperties;

  return (
    <div style={style}>
      {items.map((item) => (
        <ThumbnailGalleryItem key={item.id} item={item} />
      ))}
    </div>
  );
}

// Child component - no Zustand subscription, uses CSS variable
function ThumbnailGalleryItem({ item }) {
  return (
    <div className="transition-transform duration-(--gallery-hover-zoom-duration)">
      {/* ... */}
    </div>
  );
}
```

### When to Use This Pattern

Use CSS variables for settings when:

- The setting only affects styling (durations, colors, sizes)
- Many sibling components would otherwise subscribe to the same value
- The setting changes frequently (sliders, real-time adjustments)

Keep using hooks directly when:

- The setting affects component logic/behavior (e.g., `enableContextMenu` affects render tree)
- Only a few components use the value
- The value is needed in JavaScript calculations that can't be done in CSS

## Animation Patterns

### Duration Variables

Use CSS custom properties for animation durations, defined at appropriate scope:

```tsx
// Parent sets the variable
<div style={{ "--gallery-entry-duration": `${entryDuration}ms` }}>
  // Children consume via Tailwind
  <img className="transition-opacity duration-(--gallery-entry-duration)" />
</div>
```

### Tailwind Arbitrary Duration Syntax

Reference CSS variables in Tailwind using the `duration-(--var)` syntax:

```tsx
// Using CSS variable for duration
className = "duration-(--gallery-hover-zoom-duration)";

// Combining with transition properties
className =
  "transition-[scale] duration-(--gallery-hover-zoom-duration) ease-in-out";
```

### Computed Durations with CSS calc()

For durations that need runtime scaling, use CSS `calc()`:

```tsx
// Parent sets base duration
<div style={{ "--gallery-reflow-duration": `${reflowDuration}ms` }}>
  // Child sets multiplier and uses calc in className
  <li
    style={{ "--reflow-duration-multiplier": laneDistance }}
    className="duration-[calc(var(--gallery-reflow-duration)*var(--reflow-duration-multiplier))]"
  />
</div>
```

### Disabling Animations

When animation duration is 0, CSS `duration-0` naturally disables the animation. No conditional class logic needed:

```tsx
// ✅ Good: Works automatically
className="transition-transform duration-(--gallery-reflow-duration)"

// ❌ Avoid: Unnecessary conditional
className={duration > 0 ? "transition-transform" : "transition-none"}
```

### Entry Animations with `starting:`

Use Tailwind's `starting:` variant for entry animations instead of raw CSS `@starting-style`. This applies initial styles that animate to final values when the element enters the DOM.

```tsx
// ✅ Good: Tailwind starting: variant
className = "starting:opacity-0 starting:scale-98 transition-[opacity,scale]";

// ❌ Avoid: Raw CSS @starting-style (less readable, not composable)
```

**How it works:**

1. `starting:opacity-0 starting:scale-98` - Initial state when element enters DOM
2. `transition-[opacity,scale]` - Properties to animate
3. Browser automatically animates from starting state to final state

**Common patterns:**

```tsx
// Fade in
className = "starting:opacity-0 transition-opacity";

// Fade in + scale up
className = "starting:opacity-0 starting:scale-95 transition-[opacity,scale]";

// Slide in from below
className =
  "starting:opacity-0 starting:translate-y-2 transition-[opacity,transform]";
```

**Combine with duration variables:**

```tsx
className =
  "starting:opacity-0 starting:scale-98 transition-[opacity,scale] duration-(--gallery-entry-duration)";
```

**Note:** The `starting:` variant requires browser support for `@starting-style` (Chrome 117+, Safari 17.5+, Firefox 129+). For older browsers, elements will simply appear without animation.

## Gallery-Specific Variables

The thumbnail gallery defines these CSS variables at the gallery root:

| Variable                        | Purpose                       | Set In                   |
| ------------------------------- | ----------------------------- | ------------------------ |
| `--gallery-reflow-duration`     | Column reflow animation       | `thumbnail-gallery.tsx`  |
| `--gallery-entry-duration`      | Thumbnail fade-in             | `thumbnail-gallery.tsx`  |
| `--gallery-hover-zoom-duration` | Hover scale animation         | `thumbnail-gallery.tsx`  |
| `--thumbnail-hover-scale`       | Hover scale factor (per-item) | `thumbnail-gallery-item` |
| `--reflow-duration-multiplier`  | Lane distance scaling         | `thumbnail-gallery-item` |

### Variable Scope

- **Gallery root**: Animation duration settings (shared across all items)
- **Individual items**: Scale factors, multipliers (unique per item based on position)

## Best Practices

1. **Prefer CSS over inline styles** - Use Tailwind classes with CSS variables over `style` props when possible

2. **Memoize style objects** - When using CSS variables in style props, memoize to prevent object recreation:

   ```tsx
   const galleryStyle = useMemo(
     () => ({
       "--gallery-reflow-duration": `${reflowDuration}ms`,
     }),
     [reflowDuration],
   );
   ```

3. **Name variables by scope** - Prefix with component scope: `--gallery-*`, `--sidebar-*`, `--viewer-*`

4. **Document non-obvious variables** - If a child component expects a CSS variable from a parent, document the dependency

5. **Use semantic names** - `--gallery-hover-zoom-duration` not `--dur1`

## Related Documentation

- [Responsive Design](./responsive-design.md) - Breakpoints and container queries
- [Thumbnail Gallery](../features/thumbnail-gallery.md) - Gallery implementation details
- [Settings Architecture](../settings-architecture.md) - How settings are stored and consumed
