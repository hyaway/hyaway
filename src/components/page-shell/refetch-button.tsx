import { IconCheck, IconRefresh } from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BottomNavButton } from "@/components/ui-primitives/bottom-nav-button";

interface RefetchButtonProps {
  onRefetch: () => void;
  isFetching: boolean;
  /** Custom label to display (default: 'Refetch') */
  label?: string;
}

export function RefetchButton({
  onRefetch,
  isFetching,
  label,
}: RefetchButtonProps) {
  const [showCheck, setShowCheck] = useState(false);
  const [clickedRefetch, setClickedRefetch] = useState(false);

  useEffect(() => {
    if (isFetching && clickedRefetch) {
      setShowCheck(false);
    } else if (!isFetching && clickedRefetch) {
      setClickedRefetch(false);
      setShowCheck(true);
      setTimeout(() => setShowCheck(false), 2000);
    }
  }, [isFetching, clickedRefetch]);

  const handleClick = () => {
    setClickedRefetch(true);
    onRefetch();
  };

  const icon = (
    <AnimatePresence mode="wait">
      {showCheck ? (
        <motion.span
          key="check"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <IconCheck className="text-success size-6" />
        </motion.span>
      ) : (
        <IconRefresh className="size-6" />
      )}
    </AnimatePresence>
  );

  return (
    <BottomNavButton
      label={label || isFetching ? "Fetching" : "Refetch"}
      icon={icon}
      onClick={handleClick}
      isLoading={isFetching}
    />
  );
}
