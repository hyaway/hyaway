---
applyTo: "**/*.css,**/components/**,**/-components/**"
---

# Responsive Design

Custom Tailwind variants (defined in `src/styles.css`):

- **`short:`** - Limited vertical space (`max-height: 500px`) - tiny phones, foldables, landscape phones

Combine `short:` with other variants:

- **`short:sm:`, `short:md:`, etc.** - Short viewport + viewport width
- **`short:@sm:`, `short:@xl:`, etc.** - Short viewport + container width (inside `@container`)

**Pattern:** Use `short:` for height-based compactness, then stack with width variants to restore features.

```tsx
// Viewport-based
className = "short:hidden short:sm:flex";

// Container-based (inside @container)
className = "short:sr-only short:@xl:not-sr-only";
```

See [responsive-design.md](../docs/ui/responsive-design.md) for full documentation.
