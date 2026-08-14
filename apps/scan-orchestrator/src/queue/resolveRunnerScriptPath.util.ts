import { createRequire } from 'node:module';
import path from 'node:path';

import type { DeterministicScannerRunner } from './queue.constants.ts';

import { cqmsRepoRoot } from '../cqmsRepoRoot.util.ts';

const requireFromHere = createRequire(import.meta.url);

/**
 * The absolute script the orchestrator spawns for a scanner.
 *
 * An `installed` runner is resolved through node rather than joined onto a
 * path, so the same map works whether `@lcabrera/scan-report` is a workspace
 * link or a registry install — the reason the runners left `.github/skills/`
 * in the first place.
 */
export const resolveRunnerScriptPath = (
  runner: DeterministicScannerRunner,
): string =>
  runner.kind === 'installed'
    ? requireFromHere.resolve(runner.specifier)
    : path.join(cqmsRepoRoot, runner.path);
