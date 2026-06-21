// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { memo, useMemo } from "react";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCheck,
} from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { linkOptions, useNavigate } from "@tanstack/react-router";

import { getSwipeBindingDescriptor } from "./review-swipe-descriptors";
import { ReviewDecisionFilmstrip } from "./review-decision-filmstrip";
import { ReviewStatsBreakdown } from "./review-stats-breakdown";
import type {
  ReviewDirectionStats,
  ReviewFileIdsByDirection,
  ReviewSource,
} from "@/stores/review-queue-store";
import type {
  SwipeBindings,
  SwipeDirection,
} from "@/stores/review-settings-store";
import type {
  LocalTagServiceInfo,
  RatingServiceInfo,
} from "@/integrations/hydrus-api/models";
import {
  useReviewQueueActions,
  useReviewQueueHistory,
  useReviewQueueSources,
} from "@/stores/review-queue-store";
import { useRatingServices } from "@/integrations/hydrus-api/queries/use-rating-services";
import { useLocalTagServices } from "@/integrations/hydrus-api/queries/services";
import { useGetMediaPagesQuery } from "@/integrations/hydrus-api/queries/manage-pages";
import { Button, LinkButton } from "@/components/ui-primitives/button";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui-primitives/heading";
import { useExistingSearchQueryEntries } from "@/stores/search-queries-store";

const DIRECTION_ICONS: Record<
  SwipeDirection,
  React.ComponentType<{ className?: string }>
> = {
  left: IconArrowLeft,
  right: IconArrowRight,
  up: IconArrowUp,
  down: IconArrowDown,
};

/** Display order matches vim hjkl: left, down, up, right */
const DISPLAY_DIRECTIONS: ReadonlyArray<SwipeDirection> = [
  "left",
  "down",
  "up",
  "right",
];

const PREDEFINED_SOURCE_LABELS: Record<
  Extract<ReviewSource, { type: "predefinedSearch" }>["key"],
  string
> = {
  longestViewed: "Longest viewed",
  mostViewed: "Most viewed",
  randomInbox: "Random inbox",
  recentlyArchived: "Recently archived",
  recentlyInboxed: "Recently inboxed",
  recentlyTrashed: "Recently trashed",
  remoteWatchHistory: "Remote history",
};

const REVIEW_COMPLETION_BUTTON_CLASS = cn(
  "h-auto min-h-14 w-full max-w-full min-w-0 shrink flex-wrap py-3 text-center leading-tight whitespace-normal sm:w-auto",
);
const REVIEW_COMPLETION_BUTTON_VALUE_CLASS = cn("min-w-0 wrap-anywhere");
const REVIEW_COMPLETION_BUTTON_ROW_CLASS = cn(
  "flex w-full flex-row flex-wrap justify-center gap-2 empty:hidden",
);

interface ReviewCompletionProps {
  stats: ReviewDirectionStats;
  bindings: SwipeBindings;
}

export function ReviewCompletion({ stats, bindings }: ReviewCompletionProps) {
  const { clearQueue } = useReviewQueueActions();
  const total = stats.left + stats.right + stats.up + stats.down;
  const history = useReviewQueueHistory();
  const sources = useReviewQueueSources();
  const { servicesMap } = useRatingServices();
  const { localTagServicesByKey } = useLocalTagServices();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Derive file IDs by direction from history - stable reference via useMemo
  const fileIdsByDirection = useMemo(() => {
    const byDirection: ReviewFileIdsByDirection = {
      left: [],
      right: [],
      up: [],
      down: [],
    };
    for (const entry of history) {
      byDirection[entry.direction].push(entry.fileId);
    }
    return byDirection;
  }, [history]);

  // Directions that actually have files assigned
  const activeDirections = useMemo(
    () => DISPLAY_DIRECTIONS.filter((d) => fileIdsByDirection[d].length > 0),
    [fileIdsByDirection],
  );

  const handleNewRandomInbox = async () => {
    await queryClient.resetQueries({
      queryKey: ["searchFiles", "randomInbox"],
    });

    await navigate({ to: "/random-inbox" });
  };

  const handleRecentlyInboxed = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["searchFiles", "recentlyInboxed"],
    });

    await navigate({ to: "/recently-inboxed" });
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 pb-16">
      {/* Header section - centered with max width */}
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 px-4">
        {/* Success icon */}
        <div className="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-xl">
          <IconCheck className="size-10" strokeWidth={2.5} />
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Review complete!</h2>
          <p className="text-muted-foreground mt-1">
            You reviewed {total} {total === 1 ? "file" : "files"}
          </p>
        </div>

        {/* Stats */}
        <ReviewStatsBreakdown
          stats={stats}
          bindings={bindings}
          variant="grid"
          hideZero={false}
        />
      </div>

      {/* Decision filmstrips - only for directions with files */}
      {activeDirections.length > 0 && (
        <div className="flex w-full flex-col gap-6">
          <Heading level={3} className="text-center leading-normal">
            Review breakdown
          </Heading>
          {activeDirections.map((direction) => (
            <DecisionFilmstripSection
              key={direction}
              direction={direction}
              fileIds={fileIdsByDirection[direction]}
              bindings={bindings}
              servicesMap={servicesMap}
              tagServicesMap={localTagServicesByKey}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex w-full flex-col items-center gap-2">
        <Heading level={3}>What's next?</Heading>
        <div className={REVIEW_COMPLETION_BUTTON_ROW_CLASS}>
          {sources.map((source) => (
            <ReviewSourceButton
              key={getReviewSourceKey(source)}
              source={source}
            />
          ))}
        </div>
        <div className={REVIEW_COMPLETION_BUTTON_ROW_CLASS}>
          <LinkButton
            variant="outline"
            size="xl"
            className={REVIEW_COMPLETION_BUTTON_CLASS}
            to="/pages"
            search={{ q: undefined }}
          >
            Pages
          </LinkButton>
          <Button
            variant="outline"
            size="xl"
            className={REVIEW_COMPLETION_BUTTON_CLASS}
            onClick={handleNewRandomInbox}
          >
            New random inbox
          </Button>
          <Button
            variant="outline"
            size="xl"
            className={REVIEW_COMPLETION_BUTTON_CLASS}
            onClick={handleRecentlyInboxed}
          >
            Refreshed recently inboxed
          </Button>
          <Button
            variant="outline"
            className={REVIEW_COMPLETION_BUTTON_CLASS}
            onClick={clearQueue}
            size="xl"
          >
            Clear review queue
          </Button>
        </div>
      </div>
    </div>
  );
}

function getReviewSourceKey(source: ReviewSource) {
  switch (source.type) {
    case "remotePage":
      return `remotePage:${source.pageKey}`;
    case "searchPage":
      return `searchPage:${source.entryKey}`;
    case "predefinedSearch":
      return `predefinedSearch:${source.key}`;
    default:
      source satisfies never;
      return "";
  }
}

function ReviewSourceButton({ source }: { source: ReviewSource }) {
  switch (source.type) {
    case "remotePage":
      return <RemotePageReviewSourceButton source={source} />;
    case "searchPage":
      return <SearchPageReviewSourceButton source={source} />;
    case "predefinedSearch":
      return <PredefinedSearchReviewSourceButton source={source} />;
    default:
      source satisfies never;
      return null;
  }
}

function PredefinedSearchReviewSourceButton({
  source,
}: {
  source: Extract<ReviewSource, { type: "predefinedSearch" }>;
}) {
  const link = getPredefinedSearchSourceLink(source);

  return (
    <LinkButton
      variant="outline"
      size="xl"
      className={REVIEW_COMPLETION_BUTTON_CLASS}
      {...link}
    >
      <span className={REVIEW_COMPLETION_BUTTON_VALUE_CLASS}>
        {PREDEFINED_SOURCE_LABELS[source.key]}
      </span>
    </LinkButton>
  );
}

function getPredefinedSearchSourceLink(
  source: Extract<ReviewSource, { type: "predefinedSearch" }>,
) {
  switch (source.key) {
    case "longestViewed":
      return linkOptions({ to: "/longest-viewed" });
    case "mostViewed":
      return linkOptions({ to: "/most-viewed" });
    case "randomInbox":
      return linkOptions({ to: "/random-inbox" });
    case "recentlyArchived":
      return linkOptions({ to: "/recently-archived" });
    case "recentlyInboxed":
      return linkOptions({ to: "/recently-inboxed" });
    case "recentlyTrashed":
      return linkOptions({ to: "/recently-trashed" });
    case "remoteWatchHistory":
      return linkOptions({ to: "/remote-history" });
    default:
      source.key satisfies never;
      return linkOptions({ to: "/" });
  }
}

function RemotePageReviewSourceButton({
  source,
}: {
  source: Extract<ReviewSource, { type: "remotePage" }>;
}) {
  const { data: mediaPages = [] } = useGetMediaPagesQuery();
  const page = useMemo(
    () => mediaPages.find((item) => item.page_key === source.pageKey),
    [mediaPages, source.pageKey],
  );

  if (!page) return null;

  return (
    <LinkButton
      variant="outline"
      size="xl"
      className={REVIEW_COMPLETION_BUTTON_CLASS}
      {...linkOptions({
        to: "/pages/$pageId",
        params: { pageId: page.slug },
      })}
    >
      <span className="text-muted-foreground">Page:</span>
      <span className={REVIEW_COMPLETION_BUTTON_VALUE_CLASS}>{page.name}</span>
    </LinkButton>
  );
}

function SearchPageReviewSourceButton({
  source,
}: {
  source: Extract<ReviewSource, { type: "searchPage" }>;
}) {
  const entryKeys = useMemo(() => [source.entryKey], [source.entryKey]);
  const entries = useExistingSearchQueryEntries(entryKeys);
  const entry = entries[source.entryKey];

  if (!entry) return null;

  return (
    <LinkButton
      variant="outline"
      size="xl"
      className={REVIEW_COMPLETION_BUTTON_CLASS}
      {...linkOptions({
        to: "/search/$searchId",
        params: { searchId: source.entryKey },
      })}
    >
      <span className="text-muted-foreground">Search:</span>
      <span className={REVIEW_COMPLETION_BUTTON_VALUE_CLASS}>
        {entry.displayName ?? source.entryKey}
      </span>
    </LinkButton>
  );
}

interface DecisionFilmstripSectionProps {
  direction: SwipeDirection;
  fileIds: Array<number>;
  bindings: SwipeBindings;
  servicesMap: Map<string, RatingServiceInfo>;
  tagServicesMap: Map<string, LocalTagServiceInfo>;
}

const DecisionFilmstripSection = memo(function DecisionFilmstripSectionMemo({
  direction,
  fileIds,
  bindings,
  servicesMap,
  tagServicesMap,
}: DecisionFilmstripSectionProps) {
  const binding = bindings[direction];
  const descriptor = useMemo(
    () => getSwipeBindingDescriptor(binding, servicesMap, tagServicesMap),
    [binding, servicesMap, tagServicesMap],
  );
  const ActionIcon = descriptor.icon;
  const DirectionIcon = DIRECTION_ICONS[direction];

  return (
    <div className="w-full">
      <Heading
        level={4}
        className="flex items-center justify-center gap-2 text-lg/normal 2xl:text-2xl/loose"
      >
        <div
          className={cn(
            "hidden aspect-square size-7 items-center justify-center rounded-lg min-[400px]:inline-flex 2xl:size-10",
            descriptor.bgClass,
            descriptor.textClass,
          )}
        >
          <ActionIcon className="size-3 2xl:size-4" />
          <DirectionIcon className="size-3 2xl:size-4" />
        </div>
        <span>
          {descriptor.label}{" "}
          <span className="text-muted-foreground font-normal tabular-nums">
            ({fileIds.length})
          </span>
        </span>
      </Heading>
      <ReviewDecisionFilmstrip fileIds={fileIds} scrollKey={direction} />
    </div>
  );
});
