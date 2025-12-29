import { CheckIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui-primitives/button";
import { Spinner } from "@/components/ui-primitives/spinner";

interface RefetchButtonProps {
  onRefetch: () => void;
  isFetching: boolean;
}

export function RefetchButton({ onRefetch, isFetching }: RefetchButtonProps) {
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

  return (
    <Button onClick={handleClick} disabled={isFetching}>
      Refetch
      {isFetching ? (
        <Spinner className="size-5" />
      ) : (
        <AnimatePresence>
          {showCheck && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <CheckIcon className="size-5" />
            </motion.span>
          )}
        </AnimatePresence>
      )}
    </Button>
  );
}
