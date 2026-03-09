import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    dir: "src",
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.git/**",
    ],
    coverage: {
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
