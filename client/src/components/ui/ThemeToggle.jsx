import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle({ theme, toggleTheme }) {
    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="icon-button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
    );
}
