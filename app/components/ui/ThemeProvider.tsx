import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Enhanced ThemeProvider for clean monochrome theming
export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      themes={["light", "dark"]}
      value={{
        light: "light",
        dark: "dark",
      }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = React.useContext(NextThemesProvider as any);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
