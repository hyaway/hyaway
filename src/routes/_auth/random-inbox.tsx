import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { PageHeading } from "@/components/page/page-heading";
import { PageLoading } from "@/components/page/page-loading";
import { useRandomInboxFilesQuery } from "@/integrations/hydrus-api/queries/search";
import { ImageGrid } from "@/components/image-grid/image-grid";
import { Button } from "@/components/ui-primitives/button";
import { Separator } from "@/components/ui-primitives/separator";

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
  const [showDice, setShowDice] = useState(true);

  // Show dice when loading finishes
  useEffect(() => {
    if (!isLoading) {
      setShowDice(true);
    }
  }, [isLoading]);

  const handleShuffle = () => {
    setShowDice(false); // Trigger exit animation
    setDiceIndex(Math.floor(Math.random() * 6));
    queryClient.resetQueries({
      queryKey: ["searchFiles", "randomInbox"],
    });
  };

  const shuffleButton = (
    <Button onClick={handleShuffle} disabled={isLoading || isError}>
      <span className="mr-1 size-4">
        <AnimatePresence>
          {showDice && (
            <motion.span
              key={diceIndex}
              initial={{ rotate: -180, scale: 0 }}
              animate={{
                rotate: 0,
                scale: 1,
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              exit={{
                rotate: 2700,
                scale: 0,
                transition: { duration: 5, ease: "easeOut" },
              }}
              className="absolute block"
            >
              <HugeiconsIcon icon={DICE_ICONS[diceIndex]} className="size-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      Shuffle
    </Button>
  );

  if (isLoading) {
    return (
      <PageLoading title="Random inbox">
        {shuffleButton}
        <Separator className="my-2" />
      </PageLoading>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeading title="Random inbox" />
        {shuffleButton}
        <Separator className="my-2" />
        <PageError
          error={error}
          fallbackMessage="An unknown error occurred while fetching random inbox files."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeading title="Random inbox" />
      {shuffleButton}
      <Separator className="my-2" />
      {data?.file_ids && data.file_ids.length > 0 ? (
        <div>
          <p>Number of files: {data.file_ids.length}</p>
          <ImageGrid fileIds={data.file_ids} />
        </div>
      ) : (
        <p>No inbox files found.</p>
      )}
    </div>
  );
}
