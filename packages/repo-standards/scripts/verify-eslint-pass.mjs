#!/usr/bin/env node
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
 * Effects live here; the rules are pure in `./eslint-pass-probe.mjs`.
 *
 * Usage: repo-verify-eslint-pass
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
 *
 * A root package that lints a directory outside every workspace
 * (`gates.eslintPass.rootPassDir`) is probed through the gate itself: the plant
 * goes under that directory and `vp run -r lint:eslint:check` runs from the
 * root, so a root task that leaves the fan-out fails here as well as a config
 * that stops loading the rule.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, posix } from 'node:path';
import process from 'node:process';

import { readGates } from './config.mjs';
import {
  classifyFanOut,
  classifyProbe,
  PROBE_RULE,
  probeSource,
} from './eslint-pass-probe.mjs';

const REPO_ROOT = process.cwd();
const { probeWorkspaces: PROBE_WORKSPACES, rootPassDir: ROOT_PASS_DIR } =
  readGates(REPO_ROOT).eslintPass;
const VP_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'vp');
const FAN_OUT = ['run', '-r', 'lint:eslint:check'];

const eslintBin = (workspace) =>
  join(REPO_ROOT, workspace, 'node_modules', '.bin', 'eslint');

const withProbeFile = (parent, run) => {
  const dir = mkdtempSync(join(REPO_ROOT, parent, '.eslint-probe-'));

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

const runFanOut = () => {
  const options = {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  };

  try {
    return { output: execFileSync(VP_BIN, FAN_OUT, options), status: 0 };
  } catch (error) {
    return {
      output: `${error.stdout ?? ''}\n${error.stderr ?? ''}`,
      status: error.status ?? 1,
    };
  }
};

const FAILURE_HINT = {
  blocked:
    `\`vp ${FAN_OUT.join(' ')}\` failed without reporting the probe planted\n` +
    `  under this directory. The task runner stops the remaining tasks when\n` +
    `  one fails, so the root task may never have run. Run the fan-out, fix\n` +
    `  what it reports, and run this gate again.`,
  crashed:
    `a rule threw, so the pass checked nothing. Run\n` +
    `  vp run -r lint:eslint:check\n` +
    `  and read the TypeError. If it names \`isExternalModuleNameRelative\`, the\n` +
    `  \`packageExtensions\` entry for eslint-plugin-perfectionist in\n` +
    `  pnpm-workspace.yaml has been lost or overridden (#472).`,
  'no-binary':
    `no eslint binary at \`node_modules/.bin/eslint\`. Run \`vp install\`.\n` +
    `  Reported separately because a probe that cannot spawn produces the same\n` +
    `  empty output as a rule that threw, and would otherwise be misread as #472.`,
  'no-dir':
    `\`gates.eslintPass.rootPassDir\` names a directory that does not exist,\n` +
    `  so the root eslint pass could not be probed.`,
  'no-vp': `no \`vp\` binary at \`node_modules/.bin/vp\`. Run \`vp install\`.`,
  silent:
    `the pass ran but never reported \`${PROBE_RULE}\` for a deliberately\n` +
    `  misordered import, so the rule is not loaded. Check the shared eslint\n` +
    `  configs in @lcabrera/vite-config.`,
  unreported:
    `\`vp ${FAN_OUT.join(' ')}\` never reported \`${PROBE_RULE}\` for a\n` +
    `  misordered import planted under this directory. Check that the root\n` +
    `  package still defines a \`lint:eslint:check\` script, that it lints this\n` +
    `  directory, and that the root eslint config neither ignores it nor\n` +
    `  drops the rule.`,
};

const verdictFor = (workspace) => {
  if (!existsSync(eslintBin(workspace))) {
    return 'no-binary';
  }

  return withProbeFile(workspace, (file) =>
    classifyProbe(lintProbe(workspace, file)),
  );
};

const rootVerdict = () => {
  if (!existsSync(join(REPO_ROOT, ROOT_PASS_DIR))) {
    return 'no-dir';
  }

  if (!existsSync(VP_BIN)) {
    return 'no-vp';
  }

  return withProbeFile(ROOT_PASS_DIR, (file) =>
    classifyFanOut({
      ...runFanOut(),
      probePath: posix.join(ROOT_PASS_DIR, file),
    }),
  );
};

const PROBE_TARGETS = [
  ...PROBE_WORKSPACES.map((workspace) => ({
    label: workspace,
    verdict: () => verdictFor(workspace),
  })),
  ...(ROOT_PASS_DIR === ''
    ? []
    : [{ label: `the root pass over ${ROOT_PASS_DIR}`, verdict: rootVerdict }]),
];

const probeFailures = () =>
  PROBE_TARGETS.flatMap((target) => {
    const verdict = target.verdict();

    return verdict === 'reported' ? [] : [{ label: target.label, verdict }];
  });

const report = () => {
  if (PROBE_WORKSPACES.length === 0) {
    process.stderr.write(
      '✗ `gates.eslintPass.probeWorkspaces` names no workspace in devkit.config.json, so no eslint pass was probed.\n',
    );
    return 1;
  }

  const failures = probeFailures();

  if (failures.length > 0) {
    for (const { label, verdict } of failures) {
      process.stderr.write(`✗ ${label}: ${FAILURE_HINT[verdict]}\n`);
    }

    return 1;
  }

  process.stdout.write(
    `eslint pass verified: \`${PROBE_RULE}\` reports the planted violation in ` +
      `${PROBE_TARGETS.map((target) => target.label).join(', ')}.\n`,
  );

  return 0;
};

process.exitCode = report();
