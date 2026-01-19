// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

export {};

declare global {
  interface Highlight extends Set<Range> {}

  interface HighlightRegistry {
    clear: () => void;
    delete: (name: string) => boolean;
    get: (name: string) => Highlight | undefined;
    has: (name: string) => boolean;
    set: (name: string, highlight: Highlight) => void;
  }

  interface CSS {
    highlights: HighlightRegistry;
  }

  var Highlight: {
    new (...ranges: Array<Range>): Highlight;
  };
}
