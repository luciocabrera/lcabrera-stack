#!/usr/bin/env node
/**
 * Gate: the root lint configs are wired the way they claim — every Oxlint
 * plugin family loaded, every rule the config turns on by name still reported,
 * no workspace config declaring a `lint`, `fmt` or `staged` block, and both the
 * Oxlint and Biome rosters classifying every workspace exactly once.
 *
 * Two mechanisms, because the failures differ. A plugin family or a named rule
 * is proven by planting a violation — loaded-and-clean looks identical to
 * not-loaded. A roster is proven by reading the config against the workspaces
 * on disk, since no planted code can flag a glob that matches nothing.
 * See `docs/decisions/ADR-042-oxlint-config-at-the-root.md`.
 *
 * Effects live here; the rules are pure in `./lint-plugins.mjs`.
 *
 * Usage: repo-verify-lint-plugins
 * Exit codes: 0 when every check passes, 1 on any failure or an unreadable config.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import process from 'node:process';

import { parseJsonc } from './jsonc.mjs';
import {
  configsDeclaringKeys,
  familyPlacements,
  malformedProbes,
  mergePlacements,
  multiplyClassifiedWorkspaces,
  namedRules,
  placeRuleProbes,
  PLUGIN_PROBES,
  pluginsWithoutCoverage,
  probeCode,
  RULE_PROBES,
  silentPlacements,
  staleRuntimeGlobs,
  unclassifiedWorkspaces,
  workspaceRosters,
} from './lint-plugins.mjs';

const REPO_ROOT = process.cwd();

const VP = join(REPO_ROOT, 'node_modules', '.bin', 'vp');

const withProbeDir = (run) => {
  const dir = mkdtempSync(join(REPO_ROOT, '.oxlint-probe-'));
  const created = [dir];
  try {
    return run(basename(dir), created);
  } finally {
    for (const path of created) rmSync(path, { force: true, recursive: true });
  }
};

const plantProbes = (placements, created) => {
  const roots = new Set(placements.map(({ root }) => root));
  roots.delete(basename(created[0]));
  for (const root of roots) {
    const absolute = join(REPO_ROOT, root);
    if (existsSync(absolute))
      throw new Error(`Lint-plugin gate: ${root} already exists.`);
    created.push(mkdirSync(absolute, { recursive: true }));
  }
  for (const { path, probe } of placements) {
    mkdirSync(dirname(join(REPO_ROOT, path)), { recursive: true });
    writeFileSync(join(REPO_ROOT, path), probe.code);
  }
};

const lintDiagnostics = (paths) => {
  const options = {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  };
  let raw;
  try {
    raw = execFileSync(VP, ['lint', '--format=json', ...paths], options);
  } catch (error) {
    raw = error.stdout ?? '';
  }
  try {
    return { diagnostics: JSON.parse(raw.slice(raw.indexOf('{'))).diagnostics };
  } catch {
    return { refused: raw.trim() || 'Oxlint printed no report.' };
  }
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

const runtimeLists = async () => {
  const module = await lintConfigModule();
  return module.WORKSPACE_RUNTIMES;
};

const biomeRosters = () =>
  workspaceRosters(
    parseJsonc(readFileSync(join(REPO_ROOT, 'biome.jsonc'), 'utf8'))
      .overrides ?? [],
  );

const configuredLint = async () => {
  const module = await lintConfigModule();
  const extra = module.LINT_RULE_PROBES ?? [];
  if (!Array.isArray(extra) || malformedProbes(extra).length > 0)
    throw new Error(
      `Lint-plugin gate: LINT_RULE_PROBES in ${LINT_CONFIG} must be an array of { code, plugin, rule } strings.`,
    );
  return {
    config: module.lintConfig,
    probes: [...PLUGIN_PROBES, ...RULE_PROBES, ...extra],
  };
};

const workspaceConfigs = () =>
  ['vite.config.ts', ...workspaceDirs('apps'), ...workspaceDirs('packages')]
    .map((entry) => (entry.endsWith('.ts') ? entry : `${entry}/vite.config.ts`))
    .filter((path) => existsSync(join(REPO_ROOT, path)))
    .map((path) => ({
      path,
      text: readFileSync(join(REPO_ROOT, path), 'utf8'),
    }));

const ROOT_ONLY_KEYS = {
  fmt:
    '  A package-directory `vp fmt` would use a workspace block, and\n' +
    '  `vp check` would not. Move a path it must skip into the root\n' +
    '  `fmt` `ignorePatterns`.\n',
  lint:
    '  A package-directory lint run would use a workspace block, and\n' +
    '  `vp check` would not. Move it to the root config as a\n' +
    '  `lint.overrides` entry.\n',
  staged:
    '  `vp staged` run from that package reads this block instead of the\n' +
    '  root one, and the pre-commit hook runs from the root. Add the\n' +
    '  command to the root `staged` chain.\n',
};

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

const silentMessage = ({ named, path, probe }) =>
  `Oxlint did not report ${probeCode(probe)} for the deliberate violation in ${path}.\n` +
  (named === undefined
    ? `  Either the \`${probe.plugin}\` family is not loaded — add it to PLUGINS in\n` +
      '  packages/vite-configs/src/vite.lint.shared.config.ts — or the root lint\n' +
      `  config turns \`${probeCode(probe)}\` off, or Oxlint no longer reports it.\n`
    : `  The root lint config turns \`${named.id}\` on in \`${named.entry}\`. Either the\n` +
      `  \`${probe.plugin}\` plugin is not loaded for that path, or a later entry turns\n` +
      '  the rule off there, or Oxlint no longer reports this case under that id.\n');

const missingMessage = ({ entry, id }) =>
  `\`${id}\` is turned on by name in \`${entry}\` of the root lint config, and no\n` +
  '  probe proves Oxlint reports it. A named rule can stop reporting while the\n' +
  '  config still loads, and only a planted violation shows it. Add a RULE_PROBES\n' +
  '  entry in lint-plugins.mjs of @lcabrera/repo-standards, or a LINT_RULE_PROBES\n' +
  `  export in the root ${LINT_CONFIG}.\n`;

const unplaceableMessage = ({ entry, files, id }) =>
  `\`${id}\` is turned on in \`${entry}\`, and no glob in its files (${files.join(', ')})\n` +
  '  gives a path the gate can plant its probe at. It fills a `*` or `**` path\n' +
  '  segment and one `*` in the file name, and the name must end in the probe\n' +
  '  extension; braces, classes, `..`, an absolute path and a name without\n' +
  '  `*` cannot be filled.\n';

const probeRules = ({ config, probes }) =>
  withProbeDir((dir, created) => {
    const rules = placeRuleProbes({
      dir,
      probes,
      rules: namedRules(config),
    });
    const placements = mergePlacements([
      ...familyPlacements(dir),
      ...rules.placed,
    ]);
    plantProbes(placements, created);
    const { diagnostics, refused } = lintDiagnostics(
      placements.map(({ path }) => path),
    );
    return {
      missing: rules.missing,
      named: rules.placed.length,
      refused: refused === undefined ? [] : [refused],
      silent:
        refused === undefined
          ? silentPlacements({ diagnostics, placements })
          : [],
      unplaceable: rules.unplaceable,
    };
  });

const main = async () => {
  const workspaces = [...workspaceDirs('apps'), ...workspaceDirs('packages')];
  const rosters = rosterFailures({
    sources: await rosterSources(),
    workspaces,
  });
  const lint = await configuredLint();
  const { plugins } = lint.config;
  const uncovered = pluginsWithoutCoverage(plugins);

  const stray = configsDeclaringKeys(
    workspaceConfigs(),
    Object.keys(ROOT_ONLY_KEYS),
  );
  const { missing, named, refused, silent, unplaceable } = probeRules(lint);

  for (const { key, path } of stray)
    process.stdout.write(
      `${path} declares \`${key}\`. This repo keeps that block in the root config.\n` +
        ROOT_ONLY_KEYS[key],
    );
  for (const output of refused)
    process.stdout.write(
      'Oxlint refused the lint config, so no probe could run:\n' +
        `${output.replaceAll(/^(?=.)/gmu, '  ')}\n`,
    );
  for (const placement of silent)
    process.stdout.write(silentMessage(placement));
  for (const rule of missing) process.stdout.write(missingMessage(rule));
  for (const rule of unplaceable)
    process.stdout.write(unplaceableMessage(rule));
  for (const line of rosters) process.stdout.write(line);
  for (const plugin of uncovered)
    process.stdout.write(
      `The \`${plugin}\` family is in PLUGINS but neither probed nor exempt.\n` +
        '  A configured family with no probe is one this gate cannot prove live,\n' +
        '  which is the exact failure it exists to catch. Add a PLUGIN_PROBES\n' +
        '  entry, or an UNPROBED_PLUGINS reason, in lint-plugins.mjs of @lcabrera/repo-standards.\n',
    );

  const failures =
    stray.length +
    refused.length +
    silent.length +
    missing.length +
    unplaceable.length +
    rosters.length +
    uncovered.length;
  if (failures > 0) {
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    `Lint config: ${new Set(PLUGIN_PROBES.map((probe) => probe.plugin)).size} of ${plugins.length} plugin families ` +
      `proven live by a planted violation (the rest documented as unprobeable), ` +
      `${PLUGIN_PROBES.length} family probes and ${named} probes for rules the config turns on by name, ` +
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
