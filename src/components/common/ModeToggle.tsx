// src/components/common/ModeToggle.tsx
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/AppContext";
import { SidebarMenuButton } from "@/components/ui/sidebar";

interface ModeToggleProps {
  variant?: "default" | "sidebar" | "simple" | "settings";
}

export function ModeToggle({ variant = "default" }: ModeToggleProps) {
  const { isDarkMode, toggleTheme } = useAppContext();

  if (variant === "sidebar") {
    return (
      <SidebarMenuButton onClick={toggleTheme} aria-label="Toggle theme">
        {isDarkMode ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
        <span>{isDarkMode ? "Light" : "Dark"}</span>
      </SidebarMenuButton>
    );
  }

  if (variant === "simple") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="h-8 w-8 rounded-lg flex items-center justify-center"
      >
        {isDarkMode ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </Button>
    );
  }

  if (variant === "settings") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="h-9 w-9"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="h-10 w-10"
    >
      {isDarkMode ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </Button>
  );
}