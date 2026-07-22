/**
 * Gate: the root Oxlint config actually has every plugin family loaded, and no
 * workspace config carries a `lint` block that Vite+ will silently ignore.
 *
 * Both failures are invisible by construction — a plugin that is not loaded and
 * code that is clean produce the same empty output — so this lints a deliberate
 * violation per family rather than reading the config. See
 * `docs/cqms/decisions/ADR-042-oxlint-config-at-the-root.md`.
 *
 * Effects live here; the rules are pure in `./lib/lint-plugins.mjs`.
 *
 * Usage: node scripts/verify-lint-plugins.mjs
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

import {
  configsDeclaringLint,
  PLUGIN_PROBES,
  probeCode,
  silentProbes,
} from './lib/lint-plugins.mjs';

const REPO_ROOT = process.cwd();

/**
 * Absolute, so the command cannot be resolved through a writeable `PATH` entry
 * (Sonar S4036). The workspace-local binary is the same `vp` the gate runs under.
 */
const VP = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

/**
 * Probes are linted from a directory inside the repo so they resolve the root
 * config, then removed. A path under `ignorePatterns` would be skipped, and one
 * outside the repo would not pick the config up at all.
 */
const withProbeDir = (run) => {
  const dir = mkdtempSync(join(REPO_ROOT, '.oxlint-probe-'));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

/**
 * Every diagnostic code Oxlint reports for a directory.
 *
 * Oxlint exits non-zero precisely when it finds something, which here is the
 * success case — so the report is read off the thrown error's stdout.
 */
const lintCodes = (dir) => {
  const options = {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  };
  const args = ['lint', '--format=json', relative(REPO_ROOT, dir)];
  let raw = '';
  try {
    raw = execFileSync(VP, args, options);
  } catch (error) {
    raw = error.stdout ?? '';
  }
  const start = raw.indexOf('{');
  if (start === -1) return [];
  return JSON.parse(raw.slice(start)).diagnostics.map(({ code }) => code);
};

/** Workspace directories under `apps/` and `packages/`. */
const workspaceDirs = (group) => {
  try {
    return readdirSync(join(REPO_ROOT, group), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${group}/${entry.name}`);
  } catch {
    return [];
  }
};

/**
 * Every `vite.config.ts` in the repo, root included.
 *
 * Walked rather than asked of `git ls-files`: shelling out to a bare `git`
 * resolves it through `PATH` (Sonar S4036), and there is nothing here the
 * filesystem cannot answer.
 */
const workspaceConfigs = () =>
  ['vite.config.ts', ...workspaceDirs('apps'), ...workspaceDirs('packages')]
    .map((entry) => (entry.endsWith('.ts') ? entry : `${entry}/vite.config.ts`))
    .filter((path) => existsSync(join(REPO_ROOT, path)))
    .map((path) => ({
      path,
      text: readFileSync(join(REPO_ROOT, path), 'utf8'),
    }));

const main = () => {
  const stray = configsDeclaringLint(workspaceConfigs());
  const silent = withProbeDir((dir) => {
    for (const probe of PLUGIN_PROBES)
      writeFileSync(join(dir, `${probe.plugin}.probe.ts`), probe.code);
    return silentProbes({
      probes: PLUGIN_PROBES,
      reportedCodes: lintCodes(dir),
    });
  });

  for (const path of stray)
    process.stdout.write(
      `${path} declares \`lint\`, which Vite+ never loads from a workspace config.\n` +
        '  Move it to the root config as a `lint.overrides` entry.\n',
    );
  for (const probe of silent)
    process.stdout.write(
      `Oxlint did not report ${probeCode(probe)} for a deliberate violation.\n` +
        `  The \`${probe.plugin}\` family is not loaded — add it to PLUGINS in\n` +
        '  packages/vite-configs/vite.lint.shared.config.ts.\n',
    );

  if (stray.length + silent.length > 0) {
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    `Oxlint config: ${PLUGIN_PROBES.length} plugin families proven live, ` +
      'no workspace config shadows the root.\n',
  );
};

main();
