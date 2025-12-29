import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  DiceFaces01Icon,
  DiceFaces02Icon,
  DiceFaces03Icon,
  DiceFaces04Icon,
  DiceFaces05Icon,
  DiceFaces06Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageError } from "@/components/page/page-error";
import { EmptyState } from "@/components/page/empty-state";
import { PageFloatingBar } from "@/components/page/page-floating-bar";
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { RandomInboxSettingsPopover } from "@/components/settings/random-inbox-settings-popover";
import { useRandomInboxFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";

const DICE_ICONS = [
  DiceFaces01Icon,
  DiceFaces02Icon,
  DiceFaces03Icon,
  DiceFaces04Icon,
  DiceFaces05Icon,
  DiceFaces06Icon,
];

export const Route = createFileRoute("/_auth/random-inbox")({
  component: RouteComponent,
  beforeLoad: () => ({
    getTitle: () => "Random inbox",
  }),
});

function RouteComponent() {
  const { data, isLoading, isError, error } = useRandomInboxFilesQuery();
  const queryClient = useQueryClient();
  const [diceIndex, setDiceIndex] = useState(2);

  const handleShuffle = () => {
    setDiceIndex(Math.floor(Math.random() * 6));
    queryClient.resetQueries({
      queryKey: ["searchFiles", "randomInbox"],
    });
  };

  const diceIcon = (
    <span className="relative size-6">
      <AnimatePresence>
        <motion.span
          key={diceIndex}
          initial={{ rotate: -180, scale: 0 }}
          animate={{
            rotate: 0,
            scale: 1,
            transition: { duration: 0.15, ease: "easeOut" },
          }}
          className="absolute inset-0"
        >
          <HugeiconsIcon icon={DICE_ICONS[diceIndex]} className="size-6" />
        </motion.span>
      </AnimatePresence>
    </span>
  );

  const shuffleButton = (
    <BottomNavButton
      key="shuffle"
      label="Shuffle"
      icon={diceIcon}
      onClick={handleShuffle}
      isLoading={isLoading}
      disabled={isError}
    />
  );

  if (isLoading) {
    return (
      <>
        <PageLoading title="Random inbox" />
        <PageFloatingBar
          leftContent={shuffleButton}
          rightContent={<RandomInboxSettingsPopover />}
        />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="pb-16">
          <PageHeading title="Random inbox" />
          <PageError
            error={error}
            fallbackMessage="An unknown error occurred while fetching random inbox files."
          />
        </div>
        <PageFloatingBar
          leftContent={shuffleButton}
          rightContent={<RandomInboxSettingsPopover />}
        />
      </>
    );
  }

  return (
    <>
      <div className="pb-16">
        <PageHeading
          title={`Random inbox (${data?.file_ids?.length ?? 0} files)`}
        />
        {data?.file_ids && data.file_ids.length > 0 ? (
          <ImageGrid fileIds={data.file_ids} />
        ) : (
          <EmptyState message="No inbox files found." />
        )}
      </div>
      <PageFloatingBar
        leftContent={shuffleButton}
        rightContent={<RandomInboxSettingsPopover />}
      />
    </>
  );
}
