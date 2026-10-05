import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Relative base so the build works from any GitHub Pages project path
// (https://<user>.github.io/<repo>/) without extra configuration.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
