// Copyright 2026 hyAway contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  FocusEventHandler,
  KeyboardEvent,
  KeyboardEventHandler,
  Ref,
} from "react";

export type RovingTagActionTriggerProps = {
  onFocus: FocusEventHandler<HTMLButtonElement>;
  onKeyDownCapture: KeyboardEventHandler<HTMLButtonElement>;
  tabIndex: number;
  triggerRef: Ref<HTMLButtonElement>;
};

export type RovingTagButtonProps = {
  onFocus: FocusEventHandler<HTMLButtonElement>;
  onKeyDownCapture: KeyboardEventHandler<HTMLButtonElement>;
  ref: Ref<HTMLButtonElement>;
  tabIndex: number;
};

export function useRovingTagActionTriggers({
  itemCount,
  enabledIndices: providedEnabledIndices,
}: {
  itemCount: number;
  enabledIndices?: Array<number>;
}) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const enabledIndices = useMemo(() => {
    const source =
      providedEnabledIndices ??
      Array.from({ length: itemCount }, (_unused, index) => index);

    return source.filter((index) => index >= 0 && index < itemCount);
  }, [itemCount, providedEnabledIndices]);

  const firstEnabledIndex =
    enabledIndices.length > 0 ? enabledIndices[0] : null;
  const tabbableIndex =
    focusedIndex !== null && enabledIndices.includes(focusedIndex)
      ? focusedIndex
      : firstEnabledIndex;

  useEffect(() => {
    if (focusedIndex !== null && !enabledIndices.includes(focusedIndex)) {
      setFocusedIndex(null);
    }
  }, [enabledIndices, focusedIndex]);

  const setTriggerRef = useCallback(
    (element: HTMLButtonElement | null, index: number) => {
      if (element) {
        triggerRefs.current.set(index, element);
      } else {
        triggerRefs.current.delete(index);
      }
    },
    [],
  );

  const focusEnabledPosition = useCallback(
    (nextPosition: number) => {
      if (enabledIndices.length === 0) return;

      const boundedPosition = Math.max(
        0,
        Math.min(enabledIndices.length - 1, nextPosition),
      );
      const nextIndex = enabledIndices[boundedPosition];

      setFocusedIndex(nextIndex);

      const trigger = triggerRefs.current.get(nextIndex);
      trigger?.scrollIntoView({ block: "nearest", inline: "nearest" });
      trigger?.focus({ preventScroll: true });
    },
    [enabledIndices],
  );

  const handleKeyDownCapture = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const currentPosition = enabledIndices.indexOf(index);
      if (currentPosition === -1) return;

      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          focusEnabledPosition(currentPosition + 1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          focusEnabledPosition(currentPosition - 1);
          break;
        case "Home":
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          focusEnabledPosition(0);
          break;
        case "End":
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          focusEnabledPosition(enabledIndices.length - 1);
          break;
      }
    },
    [enabledIndices, focusEnabledPosition],
  );

  const getBaseProps = useCallback(
    (index: number) => ({
      onFocus: () => {
        if (enabledIndices.includes(index)) setFocusedIndex(index);
      },
      onKeyDownCapture: (event: KeyboardEvent<HTMLButtonElement>) =>
        handleKeyDownCapture(event, index),
      tabIndex: index === tabbableIndex ? 0 : -1,
    }),
    [enabledIndices, handleKeyDownCapture, tabbableIndex],
  );

  const getTriggerProps = useCallback(
    (index: number): RovingTagActionTriggerProps => ({
      ...getBaseProps(index),
      triggerRef: (element) => setTriggerRef(element, index),
    }),
    [getBaseProps, setTriggerRef],
  );

  const getButtonProps = useCallback(
    (index: number): RovingTagButtonProps => ({
      ...getBaseProps(index),
      ref: (element) => setTriggerRef(element, index),
    }),
    [getBaseProps, setTriggerRef],
  );

  return { getButtonProps, getTriggerProps };
}
