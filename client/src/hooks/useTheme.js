import { useEffect, useState } from "react";

const STORAGE_KEY = "student-community-theme";

export default function useTheme() {
    const [theme, setTheme] = useState(() => window.localStorage.getItem(STORAGE_KEY) || "dark");

    useEffect(() => {
        document.documentElement.classList.toggle("light", theme === "light");
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    return {
        theme,
        toggleTheme() {
            setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");
        }
    };
}
