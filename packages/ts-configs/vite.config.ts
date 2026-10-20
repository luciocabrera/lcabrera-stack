/**
 * Empty on purpose. Without a configuration of its own, this workspace's test
 * task failed when `vp run` launched it from the repository root: Vitest
 * reported that it could not find the current suite before any test ran.
 */

import { defineConfig } from 'vite-plus';

export default defineConfig({});
