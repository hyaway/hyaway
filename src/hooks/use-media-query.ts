"use client";

import { useLayoutEffect, useState } from "react";

export const useMediaQuery = (query: string) => {
  const [value, setValue] = useState(() => matchMedia(query).matches);

  useLayoutEffect(() => {
    const mediaQueryList = matchMedia(query);

    // Sync state in case query changed between render and effect
    setValue(mediaQueryList.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setValue(event.matches);
    };

    mediaQueryList.addEventListener("change", onChange);
    return () => mediaQueryList.removeEventListener("change", onChange);
  }, [query]);

  return value;
};
