---
applyTo: "**/*.css,**/components/app-shell/**,**/components/page-shell/**"
---

# Responsive Design

Custom Tailwind variants (defined in `src/styles.css`):

- **`short:`** - Limited vertical space (`max-height: 500px`) - tiny phones, foldables, landscape phones
- **`short-wide:`** - Phone landscape specifically (`max-height: 500px` AND `min-width: 640px`)

Pattern: Use `short:` as base for constrained-height, then `short-wide:` to refine for landscape.

See [responsive-design.md](../docs/ui/responsive-design.md) for full documentation.
