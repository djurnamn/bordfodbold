"use client";

import { resolveMode, setMode, type DjuiMode } from "@bordfodbold/ui/scripts";
import { useCallback, useEffect, useState } from "react";

/** The same options the root layout's bootstrap script uses. */
export const modeOptions = { defaultMode: "dark" as const, respectSystemPreference: false };

export function useMode(): { mode: DjuiMode; toggle: () => void } {
  const [mode, setCurrent] = useState<DjuiMode>(modeOptions.defaultMode);
  useEffect(() => {
    setCurrent(resolveMode(modeOptions));
  }, []);
  const toggle = useCallback(() => {
    setCurrent((current) => {
      const next: DjuiMode = current === "dark" ? "light" : "dark";
      setMode(next, modeOptions);
      return next;
    });
  }, []);
  return { mode, toggle };
}
