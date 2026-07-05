import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';

import { cqmsRepoRoot } from './cqmsRepoRoot.util.ts';

/**
 * Defense-in-depth only — this package has no DB access (TECH_SPEC §2.6:
 * agent-runner is deliberately free of any DB dependency, kept separate
 * from scan-ingestion). The real authority check — targetProjectPath must
 * match a row in cqms.projects.local_path — is the caller's
 * responsibility (admin_system's background job). This just guards
 * against the one thing agent-runner CAN verify on its own: never let a
 * scan target resolve to this CQMS repo's own source/credentials.
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

  if (
    resolvedTarget === resolvedCqmsRoot ||
    resolvedCqmsRoot.startsWith(`${resolvedTarget}${sep}`)
  ) {
    throw new Error(
      'targetProjectPath must not be, or contain, the CQMS repo itself.',
    );
  }
};
