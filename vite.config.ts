import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { randomUUID } from "node:crypto";
const base = process.env.VITE_BASE_PATH || "/";
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) throw Error("Invalid base path");
const version = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT || "1"}`
  : randomUUID();
export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: "build-version",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ version }),
        });
      },
    },
  ],
  define: { "import.meta.env.VITE_APP_BUILD_ID": JSON.stringify(version) },
  build: { sourcemap: false },
  server: { host: "0.0.0.0" },
});
