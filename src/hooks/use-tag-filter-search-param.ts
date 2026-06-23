// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route as AuthRoute } from "@/routes/_auth";

export function useTagFilterSearchParam() {
  const navigate = useNavigate();
  const { tagFilter } = AuthRoute.useSearch();
  const value = tagFilter ?? "";

  const setValue = useCallback(
    (nextValue: string) => {
      void navigate({
        to: ".",
        search: (current) => ({
          ...current,
          tagFilter: nextValue ? nextValue : undefined,
        }),
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  return [value, setValue] as const;
}
