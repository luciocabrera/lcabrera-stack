/**
 * Gate: the eslint pass actually runs its rules, rather than dying on one.
 *
 * `vp run -r lint:eslint:check` exits non-zero both when it reports findings and
 * when a rule throws, and CI reads only the exit code — so a pass that checks
 * nothing looks exactly like a pass that found something. #472 is what that
 * costs: `eslint-plugin-perfectionist` resolved the TypeScript 7 native port,
 * whose `"."` export carries no compiler API, and the whole pass died with a
 * TypeError in every workspace while `lint:plugins:verify` (Oxlint-only) stayed
 * green.
 *
 * So this plants a misordered import and requires the pass to *report* it. A
 * clean run is not evidence here — the same empty output means "correct code",
 * "rule not loaded" and "rule crashed" (AGENTS.md §7, Rule 14).
 *
 * Effects live here; the rules are pure in `./lib/eslint-pass-probe.mjs`.
 *
 * Usage: node scripts/verify-eslint-pass.mjs
 *
 * The binary probed is the **workspace's own**, which is what
 * `lint:eslint:check` resolves from its bare `eslint` — and, under pnpm's
 * isolated layout, not the same install as any other workspace's. There is no
 * `eslint` in the root `.bin` at all, so probing with a root path silently
 * fails to spawn and reads as a crashed rule; it is absolute so it cannot be
 * resolved through a writeable `PATH` entry (Sonar S4036). The probe file is
 * written inside the workspace so it resolves that workspace's flat config, and
 * eslint's non-zero exit on findings is expected, so the JSON report is read
 * off the thrown error rather than treated as a failure.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import process from 'node:process';

import {
  classifyProbe,
  PROBE_RULE,
  PROBE_WORKSPACES,
  probeSource,
} from './lib/eslint-pass-probe.mjs';

const REPO_ROOT = process.cwd();

const eslintBin = (workspace) =>
  join(REPO_ROOT, workspace, 'node_modules', '.bin', 'eslint');

const withProbeFile = (workspace, run) => {
  const dir = mkdtempSync(join(REPO_ROOT, workspace, '.eslint-probe-'));

  try {
    writeFileSync(join(dir, 'probe.ts'), probeSource(), 'utf8');

    return run(`${basename(dir)}/probe.ts`);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

const lintProbe = (workspace, target) => {
  const args = [target, '--config', 'eslint.config.mjs', '--format', 'json'];

  try {
    return execFileSync(eslintBin(workspace), args, {
      cwd: join(REPO_ROOT, workspace),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (error) {
    return error.stdout ?? '';
  }
};

const FAILURE_HINT = {
  'no-binary':
    `no eslint binary at \`node_modules/.bin/eslint\`. Run \`vp install\`.\n` +
    `  Reported separately because a probe that cannot spawn produces the same\n` +
    `  empty output as a rule that threw, and would otherwise be misread as #472.`,
  crashed:
    `a rule threw, so the pass checked nothing. Run\n` +
    `  vp run -r lint:eslint:check\n` +
    `  and read the TypeError. If it names \`isExternalModuleNameRelative\`, the\n` +
    `  \`packageExtensions\` entry for eslint-plugin-perfectionist in\n` +
    `  pnpm-workspace.yaml has been lost or overridden (#472).`,
  silent:
    `the pass ran but never reported \`${PROBE_RULE}\` for a deliberately\n` +
    `  misordered import, so the rule is not loaded. Check the shared eslint\n` +
    `  configs in @lcabrera/vite-config.`,
};

const verdictFor = (workspace) => {
  if (!existsSync(eslintBin(workspace))) {
    return 'no-binary';
  }

  return withProbeFile(workspace, (file) =>
    classifyProbe(lintProbe(workspace, file)),
  );
};

const failures = PROBE_WORKSPACES.flatMap((workspace) => {
  const verdict = verdictFor(workspace);

  return verdict === 'reported' ? [] : [{ verdict, workspace }];
});

if (failures.length > 0) {
  for (const { verdict, workspace } of failures) {
    process.stderr.write(`✗ ${workspace}: ${FAILURE_HINT[verdict]}\n`);
  }

  process.exitCode = 1;
} else {
  process.stdout.write(
    `eslint pass verified: \`${PROBE_RULE}\` reports the planted violation in ` +
      `${PROBE_WORKSPACES.join(', ')}.\n`,
  );
}
