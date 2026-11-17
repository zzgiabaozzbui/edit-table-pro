import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Static build of this demo for GitHub Pages (`npm run build:demo`, .github/workflows/pages.yml).
// The root vite.config.ts builds the library; this one builds the demo app only.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./", // served from /edit-table-pro/, relative paths keep it working at any sub-path
  plugins: [react()],
  build: { outDir: "../dist/demo", emptyOutDir: true },
  resolve: {
    alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) },
  },
});
