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
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import process from 'node:process';

import {
  classifyProbe,
  PROBE_WORKSPACES,
  PROBES,
} from './lib/eslint-pass-probe.mjs';

const REPO_ROOT = process.cwd();

const eslintBin = (workspace) =>
  join(REPO_ROOT, workspace, 'node_modules', '.bin', 'eslint');

const probeRoot = (workspace) => {
  const src = join(REPO_ROOT, workspace, 'src');

  return existsSync(src)
    ? { dir: src, prefix: 'src/' }
    : { dir: join(REPO_ROOT, workspace), prefix: '' };
};

const withProbeFile = (workspace, probe, run) => {
  const { dir: root, prefix } = probeRoot(workspace);
  const dir = mkdtempSync(join(root, '.eslint-probe-'));

  try {
    writeFileSync(join(dir, 'probe.ts'), probe.source(), 'utf8');

    return run(`${prefix}${basename(dir)}/probe.ts`);
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
};

const silentHint = (probe) =>
  `the pass ran but never reported \`${probe.rule}\` for\n  ${probe.silentHint}`;

const hintFor = (verdict, probe) =>
  verdict === 'silent' ? silentHint(probe) : FAILURE_HINT[verdict];

const verdictFor = (workspace, probe) => {
  if (!existsSync(eslintBin(workspace))) {
    return 'no-binary';
  }

  return withProbeFile(workspace, probe, (file) =>
    classifyProbe(lintProbe(workspace, file), probe.rule),
  );
};

const failures = PROBE_WORKSPACES.flatMap((workspace) =>
  PROBES.flatMap((probe) => {
    const verdict = verdictFor(workspace, probe);

    return verdict === 'reported' ? [] : [{ probe, verdict, workspace }];
  }),
);

if (failures.length > 0) {
  for (const { probe, verdict, workspace } of failures) {
    process.stderr.write(
      `✗ ${workspace} (${probe.rule}): ${hintFor(verdict, probe)}\n`,
    );
  }

  process.exitCode = 1;
} else {
  process.stdout.write(
    `eslint pass verified: ${PROBES.length} rule(s) report the planted ` +
      `violation in ${PROBE_WORKSPACES.join(', ')}.\n`,
  );
}
