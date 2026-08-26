import { createReactRouterRunConfig } from '@lcabrera/vite-config/run';

export const runConfig = createReactRouterRunConfig({
  // Relative to the app directory, which is the start task's cwd. The repo-root
  // compose env file is this repo's layout, so the config package defaults to
  // the app-local file alone and each app names the rest (ADR-069). Without the
  // repo-root file a bare `react-router-serve` inherits no DB_* and the first
  // DB-backed request throws a ZodError (#329).
  envFiles: ['../../docker/local/.env', './.env'],
});
