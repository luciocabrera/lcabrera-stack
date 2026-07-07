import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';

import { cqmsRepoRoot } from './cqmsRepoRoot.util.ts';

/**
 * Defense-in-depth only — this package has no DB access (TECH_SPEC §2.6:
 * agent-runner is deliberately free of any DB dependency, kept separate
 * from scan-ingestion). The real authority check — targetProjectPath must
 * match a row in cqms.projects.local_path — is the caller's
 * responsibility (admin_system's background job).
 *
 * Self-scan (target = the CQMS repo root itself) is ALLOWED since ADR-020
 * — credential exposure is handled by the secret-file PreToolUse guard
 * (secretFileGuardHook), not by banning the target. What stays
 * rejected is any ANCESTOR of the repo (e.g. $HOME): that would hand the
 * session everything around the repo too (~/.ssh, other checkouts) —
 * scope the guard cannot meaningfully bound.
 */
export const assertSafeTargetPath = (targetProjectPath: string): void => {
  if (!targetProjectPath.startsWith(sep)) {
    throw new Error('targetProjectPath must be absolute.');
  }

  if (!existsSync(targetProjectPath)) {
    throw new Error(`targetProjectPath does not exist: ${targetProjectPath}`);
  }

  const resolvedTarget = resolve(targetProjectPath);
  const resolvedCqmsRoot = resolve(cqmsRepoRoot);

  if (resolvedCqmsRoot.startsWith(`${resolvedTarget}${sep}`)) {
    throw new Error('targetProjectPath must not contain the CQMS repo itself.');
  }
};
