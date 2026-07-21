/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: "#eaf5ff",
                    100: "#d5ebff",
                    200: "#abd7ff",
                    300: "#7cc2ff",
                    400: "#4ca8ff",
                    500: "#208cf8",
                    600: "#1473e6",
                    700: "#0f5bb8",
                    800: "#124f95",
                    900: "#123f73"
                },
                accent: {
                    50: "#fff7eb",
                    100: "#ffeccc",
                    200: "#ffd59a",
                    300: "#ffbc61",
                    400: "#ffa032",
                    500: "#ff8a00",
                    600: "#db7000",
                    700: "#b65706",
                    800: "#93450d",
                    900: "#783b0f"
                },
                canvas: {
                    base: "#0d0d14",
                    surface: "#13131e",
                    elevated: "#1a1a28",
                    soft: "#20202e",
                    hover: "#27273a"
                },
            },
            boxShadow: {
                soft: "0 18px 48px rgba(2, 6, 23, 0.28)",
                glow: "0 0 0 1px rgba(99,102,241,0.2), 0 8px 32px rgba(99,102,241,0.15)"
            },
            borderRadius: {
                "4xl": "2rem"
            }
        }
    },
    plugins: []
};