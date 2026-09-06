#!/usr/bin/env node
/**
 * Gate: the root lint configs are wired the way they claim — every Oxlint
 * plugin family loaded, no workspace config shadowing the root, and both the
 * Oxlint and Biome rosters classifying every workspace exactly once.
 *
 * Two mechanisms, because the failures differ. A plugin family is proven by
 * planting a violation — loaded-and-clean looks identical to not-loaded. A
 * roster is proven by reading the config against the workspaces on disk, since
 * no planted code can flag a glob that matches nothing.
 * See `docs/decisions/ADR-042-oxlint-config-at-the-root.md`.
 *
 * Effects live here; the rules are pure in `./lint-plugins.mjs`.
 *
 * Usage: repo-verify-lint-plugins
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

import { parseJsonc } from './jsonc.mjs';
import {
  configsDeclaringLint,
  multiplyClassifiedWorkspaces,
  PLUGIN_PROBES,
  pluginsWithoutCoverage,
  probeCode,
  probeFilename,
  silentProbes,
  staleRuntimeGlobs,
  unclassifiedWorkspaces,
  workspaceRosters,
} from './lint-plugins.mjs';

const REPO_ROOT = process.cwd();

const VP = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

const withProbeDir = (run) => {
  const dir = mkdtempSync(join(REPO_ROOT, '.oxlint-probe-'));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

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

const workspaceDirs = (group) => {
  try {
    return readdirSync(join(REPO_ROOT, group), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) =>
        existsSync(join(REPO_ROOT, group, entry.name, 'package.json')),
      )
      .map((entry) => `${group}/${entry.name}`);
  } catch {
    return [];
  }
};

const LINT_CONFIG = 'vite.config.ts';

const lintConfigModule = () => {
  if (!existsSync(join(REPO_ROOT, LINT_CONFIG))) {
    throw new Error(
      `Lint-plugin gate: no ${LINT_CONFIG} at the repository root. The gate reads WORKSPACE_RUNTIMES and lintConfig.plugins from it, so there is nothing to prove.`,
    );
  }
  return import(join(REPO_ROOT, LINT_CONFIG));
};

const runtimeLists = async () => (await lintConfigModule()).WORKSPACE_RUNTIMES;

const biomeRosters = () =>
  workspaceRosters(
    parseJsonc(readFileSync(join(REPO_ROOT, 'biome.jsonc'), 'utf8'))
      .overrides ?? [],
  );

const configuredPlugins = async () =>
  (await lintConfigModule()).lintConfig.plugins;

const workspaceConfigs = () =>
  ['vite.config.ts', ...workspaceDirs('apps'), ...workspaceDirs('packages')]
    .map((entry) => (entry.endsWith('.ts') ? entry : `${entry}/vite.config.ts`))
    .filter((path) => existsSync(join(REPO_ROOT, path)))
    .map((path) => ({
      path,
      text: readFileSync(join(REPO_ROOT, path), 'utf8'),
    }));

const rosterSources = async () => [
  {
    fix:
      '  Add it to `browser`, `node` or `agnostic` in WORKSPACE_RUNTIMES in\n' +
      '  the root vite.config.ts.\n',
    lists: await runtimeLists(),
    name: 'the root Oxlint config',
  },
  {
    fix:
      '  Add it to the React or the Node `includes` roster in the\n' +
      '  `overrides` array of biome.jsonc.\n',
    lists: biomeRosters(),
    name: 'biome.jsonc',
  },
];

const rosterFailures = ({ sources, workspaces }) =>
  sources.flatMap(({ fix, lists, name }) => [
    ...unclassifiedWorkspaces({ runtimes: lists, workspaces }).map(
      (workspace) => `${workspace} is in no workspace list in ${name}.\n${fix}`,
    ),
    ...multiplyClassifiedWorkspaces({ runtimes: lists, workspaces }).map(
      (workspace) =>
        `${workspace} is in more than one workspace list in ${name}.\n` +
        '  Every workspace belongs to exactly one — remove the duplicate.\n',
    ),
    ...staleRuntimeGlobs({ runtimes: lists, workspaces }).map(
      (glob) =>
        `${glob} is in a workspace list in ${name} but matches no ` +
        'workspace — remove it.\n',
    ),
  ]);

const main = async () => {
  const workspaces = [...workspaceDirs('apps'), ...workspaceDirs('packages')];
  const rosters = rosterFailures({
    sources: await rosterSources(),
    workspaces,
  });
  const plugins = await configuredPlugins();
  const uncovered = pluginsWithoutCoverage(plugins);

  const stray = configsDeclaringLint(workspaceConfigs());
  const silent = withProbeDir((dir) => {
    for (const probe of PLUGIN_PROBES)
      writeFileSync(join(dir, probeFilename(probe)), probe.code);
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
        '  packages/vite-configs/src/vite.lint.shared.config.ts.\n',
    );
  for (const line of rosters) process.stdout.write(line);
  for (const plugin of uncovered)
    process.stdout.write(
      `The \`${plugin}\` family is in PLUGINS but neither probed nor exempt.\n` +
        '  A configured family with no probe is one this gate cannot prove live,\n' +
        '  which is the exact failure it exists to catch. Add a PLUGIN_PROBES\n' +
        '  entry, or an UNPROBED_PLUGINS reason, in lint-plugins.mjs of @lcabrera/repo-standards.\n',
    );

  const failures =
    stray.length + silent.length + rosters.length + uncovered.length;
  if (failures > 0) {
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    `Lint config: ${PLUGIN_PROBES.length} of ${plugins.length} plugin families ` +
      `proven live by a planted violation (the rest documented as unprobeable), ` +
      `${workspaces.length} workspaces classified exactly once by the Oxlint and ` +
      'Biome rosters alike, no workspace config shadows the root.\n',
  );
};

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
