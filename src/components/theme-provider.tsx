"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Applies the `dark` class on <html> and persists the user's theme choice. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}