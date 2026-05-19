import { resolve } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command }) => ({
  root: command === "serve" ? resolve(__dirname, "examples") : undefined,
  plugins: [react(), dts({ include: ["src"] })],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: { globals: { react: "React", "react-dom": "ReactDOM" } },
    },
  },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: {
    root: __dirname,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
}));
