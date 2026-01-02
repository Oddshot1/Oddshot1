import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ViewMode } from "@/lib/types";

const STORAGE_KEY = "oddshot-view-mode";

type ViewModeContextValue = {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
  isGuided: boolean;
  isTerminal: boolean;
  isLoaded: boolean;
};

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>("guided");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "terminal" || stored === "guided") {
      setModeState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setMode = useCallback((newMode: ViewMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "guided" ? "terminal" : "guided";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ViewModeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
      isGuided: mode === "guided",
      isTerminal: mode === "terminal",
      isLoaded,
    }),
    [mode, setMode, toggleMode, isLoaded]
  );

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewModeContext() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return ctx;
}
