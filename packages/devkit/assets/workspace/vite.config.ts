/**
 * The one lint and format configuration this workspace loads.
 *
 * Vite+ reads `lint` and `fmt` from the root config only, so a workspace's own
 * config is never consulted for them and every per-workspace difference belongs
 * here as an override, with globs resolved from this directory.
 */

import { createFmtConfig } from '@lcabrera/vite-config/fmt';
import { createLintConfig } from '@lcabrera/vite-config/lint';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: createFmtConfig(),
  lint: createLintConfig({
    workspaceRuntimes: {
      browser: ['apps/*/**'],
      node: ['packages/*/**'],
    },
  }),
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
});
