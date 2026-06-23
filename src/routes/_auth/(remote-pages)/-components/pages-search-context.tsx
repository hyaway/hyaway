// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface PagesSearchContextValue {
  query: string;
  setQuery: (value: string) => void;
}

const PagesSearchContext = createContext<PagesSearchContextValue | null>(null);

export function PagesSearchProvider({
  children,
  initialQuery,
}: {
  children: React.ReactNode;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");

  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const value = useMemo(() => ({ query, setQuery }), [query]);

  return (
    <PagesSearchContext.Provider value={value}>
      {children}
    </PagesSearchContext.Provider>
  );
}

export function usePagesSearch() {
  const context = useContext(PagesSearchContext);
  if (!context) {
    throw new Error("usePagesSearch must be used within PagesSearchProvider");
  }
  return context;
}
