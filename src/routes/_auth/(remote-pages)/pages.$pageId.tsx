// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { Outlet, createFileRoute } from "@tanstack/react-router";

import { buildPageGroupMetaByPageKey } from "./-hooks/use-page-group-meta";
import type { GetPagesResponse } from "@/integrations/hydrus-api/models";
import { getPages } from "@/integrations/hydrus-api/api-client";
import {
  buildPagesTree,
  flattenPagesToMedia,
  resolvePageKeyFromParam,
} from "@/integrations/hydrus-api/queries/manage-pages";

export const Route = createFileRoute("/_auth/(remote-pages)/pages/$pageId")({
  component: () => <Outlet />,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["getPages"],
      queryFn: getPages,
    }),
  beforeLoad: ({ params, context }) => ({
    getTitle: () => {
      const cached = context.queryClient.getQueryData<GetPagesResponse>([
        "getPages",
      ]);
      if (cached?.pages) {
        const mediaPages = flattenPagesToMedia(cached.pages);
        const resolved = resolvePageKeyFromParam(params.pageId, mediaPages);
        if (resolved) {
          const tree = buildPagesTree(cached.pages);
          const groupMeta = tree
            ? buildPageGroupMetaByPageKey(tree).get(resolved.page.page_key)
            : null;
          return groupMeta?.label
            ? `${groupMeta.label} / ${resolved.page.name}`
            : resolved.page.name;
        }
      }
      return params.pageId;
    },
  }),
});
