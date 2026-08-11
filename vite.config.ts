import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command }) => ({
  root: command === "serve" ? resolve(__dirname, "examples") : undefined,
  plugins: [
    react(),
    dts({
      include: ["src"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      // One flattened, self-contained dist/index.d.ts. post-build.mjs copies it to
      // index.d.cts so `require()` consumers on node16 resolution get types too.
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: { react: "React", "react-dom": "ReactDOM" },
        // Without this the package throws when imported from a React Server Component.
        banner: '"use client";',
      },
    },
  },
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: {
    root: __dirname,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "happy-dom",
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      reporter: ["text-summary", "json-summary"],
    },
  },
}));
