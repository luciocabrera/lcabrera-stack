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

import { parseJsonc } from './lib/jsonc.mjs';
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
      .filter((entry) =>
        existsSync(join(REPO_ROOT, group, entry.name, 'package.json')),
      )
      .map((entry) => `${group}/${entry.name}`);
  } catch {
    return [];
  }
};

/**
 * The root Vite+ config — the source of truth both readers below use.
 *
 * `@lcabrera/vite-config` ships the `createLintConfig` factory; this repo owns
 * the roster it is called with, and the root config is where that data lives
 * (ADR-069, ADR-042). Reading the built object rather than the factory is what
 * keeps this gate honest about the config Oxlint actually loads.
 */
const lintConfigModule = () => import(join(REPO_ROOT, 'vite.config.ts'));

/** The classification the root Oxlint config declares, read from the config itself. */
const runtimeLists = async () => (await lintConfigModule()).WORKSPACE_RUNTIMES;

/** The same classification as Biome declares it. */
const biomeRosters = () =>
  workspaceRosters(
    parseJsonc(readFileSync(join(REPO_ROOT, 'biome.jsonc'), 'utf8'))
      .overrides ?? [],
  );

/** The plugin families the root config actually names. */
const configuredPlugins = async () =>
  (await lintConfigModule()).lintConfig.plugins;

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

/** The two roster configs, each with the fix its own failure needs. */
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

/** Every roster complaint, as ready-to-print lines. */
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
        '  entry, or an UNPROBED_PLUGINS reason, in scripts/lib/lint-plugins.mjs.\n',
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

await main();
