// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useSearchResultsInstantDefault } from "@/stores/search-settings-store";

const SEARCH_RESULTS_ROUTE_FULL_PATH = "/_auth/(search)/search/$searchId/";

export function useSearchPageState() {
  const { searchId } = useParams({ from: SEARCH_RESULTS_ROUTE_FULL_PATH });
  const { instant } = useSearch({ from: SEARCH_RESULTS_ROUTE_FULL_PATH });
  const instantDefault = useSearchResultsInstantDefault();
  const navigate = useNavigate();

  const setInstantSearch = useCallback(
    (checked: boolean) => {
      navigate({
        to: "/search/$searchId",
        params: { searchId },
        search: { instant: checked },
        replace: true,
      });
    },
    [navigate, searchId],
  );

  return {
    searchId,
    instant,
    instantSearch: instant ?? instantDefault,
    setInstantSearch,
  };
}
