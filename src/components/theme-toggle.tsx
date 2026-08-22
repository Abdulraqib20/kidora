"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORDER = ["light", "dark", "system"] as const;
const LABELS = { light: "Light", dark: "Dark", system: "System" } as const;
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/** Icon button cycling through light, dark, and system themes. */
export function ThemeToggle() {
  // Hydration-safe "is mounted" check without setState in an effect.
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { theme, setTheme, resolvedTheme } = useTheme();

  const currentTheme = mounted ? (theme ?? "system") : "system";
  const label = LABELS[currentTheme as keyof typeof LABELS] ?? "System";

  const cycleTheme = () => {
    const next = ORDER[(ORDER.indexOf(currentTheme as (typeof ORDER)[number]) + 1) % ORDER.length];
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Theme: ${label} (click to change)`}
      title={`Theme: ${label}`}
    >
      {!mounted || resolvedTheme === "light" ? <Sun /> : <Moon />}
    </Button>
  );
}