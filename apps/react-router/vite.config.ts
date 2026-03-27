import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite-plus";

import { lintConfig } from "./config/vite.lint.config.ts";
import { fmtConfig } from "./config/vite.fmt.config.ts";
import { runConfig } from "./config/vite.run.config.ts";
import { pluginsConfig } from "./config/vite.plugins.config.ts";

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
  plugins: pluginsConfig,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
    },
  },
  run: runConfig,
  server: {
    proxy: {
      "/api": {
        changeOrigin: true,
        target: "http://localhost:3001",
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
});
