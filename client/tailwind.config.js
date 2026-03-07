/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#eef2ff",
                    100: "#e0e7ff",
                    200: "#c7d2fe",
                    300: "#a5b4fc",
                    400: "#818cf8",
                    500: "#6366f1",
                    600: "#4f46e5",
                    700: "#4338ca",
                    800: "#3730a3",
                    900: "#312e81"
                },
                accent: {
                    50: "#eff6ff",
                    100: "#dbeafe",
                    200: "#bae6fd",
                    300: "#7dd3fc",
                    400: "#38bdf8",
                    500: "#0ea5e9",
                    600: "#0284c7",
                    700: "#0369a1",
                    800: "#075985",
                    900: "#0c4a6e"
                },
                canvas: {
                    light: "#e2e8f0",
                    dark: "#0f172a"
                },
                panel: {
                    DEFAULT: "#1e293b",
                    muted: "#334155"
                }
            },
            backgroundImage: {
                "social-grid": "radial-gradient(circle at top, rgba(99, 102, 241, 0.18), transparent 28%), radial-gradient(circle at right top, rgba(56, 189, 248, 0.12), transparent 24%), linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 1))"
            },
            boxShadow: {
                soft: "0 18px 48px rgba(2, 6, 23, 0.28)",
                glow: "0 0 0 1px rgba(255,255,255,0.03), 0 18px 50px rgba(56,189,248,0.12)"
            },
            borderRadius: {
                "4xl": "2rem"
            }
        }
    },
    plugins: []
};