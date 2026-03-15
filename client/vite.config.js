import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

const DEV_PROXY_TARGET = process.env.VITE_DEV_PROXY_TARGET || "http://localhost:5050";

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: DEV_PROXY_TARGET,
                changeOrigin: true,
            },
            "/socket.io": {
                target: DEV_PROXY_TARGET,
                changeOrigin: true,
                ws: true,
            }
        }
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) {
                        return undefined;
                    }

                    if (id.includes("react-router")) {
                        return "router";
                    }

                    if (id.includes("recharts")) {
                        return "charts";
                    }

                    if (id.includes("framer-motion")) {
                        return "motion";
                    }

                    if (id.includes("@heroicons") || id.includes("lucide-react")) {
                        return "icons";
                    }

                    if (id.includes("socket.io-client")) {
                        return "realtime";
                    }

                    return "vendor";
                }
            }
        }
    },
    css: {
        postcss: {
            plugins: [tailwindcss(), autoprefixer()]
        }
    }
});