---
applyTo: "**/components/thumbnail-gallery/**,**/hooks/use-responsive-grid.ts,**/hooks/use-masonry-navigation.ts,**/hooks/use-scroll-restoration.ts"
---

# Thumbnail Gallery Development

The thumbnail gallery uses:

- Masonry layout with TanStack Virtual for window virtualization
- Infinite scroll with batched metadata fetching
- Keyboard navigation via `useMasonryNavigation`
- Scroll restoration via `useScrollRestoration`

See [thumbnail-gallery.md](../docs/features/thumbnail-gallery.md) for full documentation.
