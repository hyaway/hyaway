/**
 * Parse a display tag into namespace and tag parts.
 */
export function parseTag(displayTag: string): {
  namespace: string;
  tag: string;
} {
  const idx = displayTag.indexOf(":");
  if (idx === -1) {
    return { namespace: "", tag: displayTag };
  }
  return {
    namespace: displayTag.slice(0, idx),
    tag: displayTag.slice(idx + 1),
  };
}

/**
 * Compare two tags for sorting.
 * Namespaced tags come first, then sorted by namespace, then by tag name.
 */
export function compareTags(
  a: { namespace: string; tag: string },
  b: { namespace: string; tag: string },
): number {
  const aHasNamespace = a.namespace !== "";
  const bHasNamespace = b.namespace !== "";

  // Namespaced tags first
  if (aHasNamespace !== bHasNamespace) return aHasNamespace ? -1 : 1;

  // Sort by namespace
  if (aHasNamespace) {
    const nsCompare = a.namespace.localeCompare(b.namespace);
    if (nsCompare !== 0) return nsCompare;
  }

  // Sort by tag name
  return a.tag.localeCompare(b.tag);
}

/**
 * Compare two tag strings for sorting.
 */
export function compareTagStrings(a: string, b: string): number {
  return compareTags(parseTag(a), parseTag(b));
}
