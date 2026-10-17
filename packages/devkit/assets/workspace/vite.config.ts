/**
 * The one lint and format configuration this workspace loads.
 *
 * From this directory, Vite+ applies the `lint` and `fmt` blocks below and does
 * not apply a nested config. From a package directory, lint and format still
 * use this file unless that package defines its own `lint` or `fmt` block,
 * which Vite+ does not recommend. The check command always uses this file.
 * Per-workspace differences belong here as overrides, with globs resolved
 * from this directory.
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
});
