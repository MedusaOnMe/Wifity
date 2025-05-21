import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <i className="ri-sun-line text-xl" aria-hidden="true"></i>
      ) : (
        <i className="ri-moon-line text-xl" aria-hidden="true"></i>
      )}
      <span className="sr-only">
        {theme === "dark" ? "Light" : "Dark"} mode
      </span>
    </Button>
  );
} 