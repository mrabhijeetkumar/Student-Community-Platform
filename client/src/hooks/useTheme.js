import { useEffect, useState } from "react";

const STORAGE_KEY = "student-community-theme";

export default function useTheme() {
    const [theme, setTheme] = useState(() => window.localStorage.getItem(STORAGE_KEY) || "light");

    useEffect(() => {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.toggle("dark", theme === "dark");
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    return {
        theme,
        toggleTheme() {
            setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");
        }
    };
}
