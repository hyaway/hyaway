// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { createContext, useContext, useMemo, useState } from "react";

interface FileTagsFilterContextValue {
  filterValue: string;
  setFilterValue: (value: string) => void;
}

const FileTagsFilterContext = createContext<FileTagsFilterContextValue | null>(
  null,
);

export function FileTagsFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [filterValue, setFilterValue] = useState("");
  const value = useMemo(
    () => ({ filterValue, setFilterValue }),
    [filterValue, setFilterValue],
  );

  return (
    <FileTagsFilterContext.Provider value={value}>
      {children}
    </FileTagsFilterContext.Provider>
  );
}

export function useFileTagsFilter() {
  const context = useContext(FileTagsFilterContext);
  const [localFilterValue, setLocalFilterValue] = useState("");

  return (
    context ?? {
      filterValue: localFilterValue,
      setFilterValue: setLocalFilterValue,
    }
  );
}
