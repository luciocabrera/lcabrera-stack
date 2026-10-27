/*
 * The `closure` command: walk the named directories, analyse each one, and turn
 * the findings into an exit code.
 *
 * Separate from the CLI entry point so the dispatcher stays a dispatcher, and
 * from the analysis so the wording of a finding can change without touching
 * what counts as one.
 */

import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  analyseDirectory,
  BASELINE_COMMANDS,
  describeEscape,
  describeUnchecked,
  renderClosureReport,
} from './closure-report.mjs';
import {
  extractTaskInvocations,
  RUNNER_PREFIXES,
  taskInvocations,
} from './closure-tasks.mjs';
import { analyseClosure } from './closure.mjs';
import { buildPlan } from './command-materialise.mjs';
import {
  allowedConfigKeys,
  configuredCommandWords,
  includesRung,
  PROFILES,
  targetPathFor,
} from './config.mjs';
import { gateBinNames, tasksFor } from './init.mjs';
import { isRetirement } from './manifest.mjs';
import { readProfileFlag } from './profile-flag.mjs';
import { WORKSPACE_DEPENDENCIES, workspaceScriptsFor } from './workspace.mjs';

const MANIFEST_NAME = 'package.json';

const isManifest = (path) =>
  path === MANIFEST_NAME || path.endsWith(`/${MANIFEST_NAME}`);

const dependencyNamesIn = (content) => {
  try {
    const manifest = JSON.parse(content);
    return [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ];
  } catch {
    return [];
  }
};

/**
 * The packages a shipped file may import without escaping its tree.
 *
 * A bare import is an escape when nothing the consumer receives provides it.
 * From the `monorepo` rung up something does: the rung emits the manifests that
 * declare its own dependencies, so those names are read back off the very files
 * being analysed rather than listed a second time here. The root manifest is
 * the one create writes rather than materialises, so its block is added from the
 * module that defines it.
 *
 * @param {{ entries: { path: string, content: string }[], profile: string }} args
 * @returns {string[]}
 */
const providedPackages = ({ entries, profile }) => {
  if (!includesRung({ profile, rung: 'monorepo' })) return [];
  return [
    ...new Set([
      ...Object.keys(WORKSPACE_DEPENDENCIES),
      ...entries
        .filter((entry) => isManifest(entry.path))
        .flatMap((entry) => dependencyNamesIn(entry.content)),
    ]),
  ];
};

const COMMAND_REFERENCE_ASSETS = ['full/COMMANDS.md', 'root/COMMANDS.md'];

const commandReferencePaths = (config) =>
  new Set(
    COMMAND_REFERENCE_ASSETS.map((assetPath) =>
      targetPathFor({ assetPath, config }),
    ).filter((path) => path !== undefined),
  );

const runPrefixesFor = (config) => {
  const configured = config.commands?.run;
  return typeof configured === 'string' && configured.trim() !== ''
    ? [...RUNNER_PREFIXES, configured.trim()]
    : RUNNER_PREFIXES;
};

/**
 * @param {{ config: object, entries: { path: string, content: string }[],
 *   runPrefixes: readonly string[] }} args
 * @returns {string[]}
 */
const configuredTasks = ({ config, runPrefixes }) =>
  taskInvocations({
    lines: Object.values(config.commands ?? {})
      .filter((command) => typeof command === 'string')
      .map((text) => ({ line: 0, text })),
    prefixes: runPrefixes,
  }).map((invocation) => invocation.task);

const definedTasks = ({ config, entries, runPrefixes }) => {
  const references = commandReferencePaths(config);
  return [
    ...Object.keys(tasksFor({ profile: config.profile })),
    ...Object.keys(workspaceScriptsFor({ profile: config.profile })),
    ...configuredTasks({ config, runPrefixes }),
    ...entries
      .filter((entry) => references.has(entry.path))
      .flatMap((entry) =>
        extractTaskInvocations({
          content: entry.content,
          prefixes: runPrefixes,
        }).map((invocation) => invocation.task),
      ),
  ];
};

const shippedContext = ({ profile, root }) => {
  const { config, entries: planned } = buildPlan({ profile, root });
  const entries = planned.filter((entry) => !isRetirement(entry.state));
  const runPrefixes = runPrefixesFor(config);
  return {
    agentDirectory: config.paths.agents,
    allowedBins: gateBinNames(),
    allowedCommands: [...BASELINE_COMMANDS, ...configuredCommandWords(config)],
    allowedPackages: providedPackages({ entries, profile }),
    allowedTasks: definedTasks({ config, entries, runPrefixes }),
    configKeys: allowedConfigKeys(config),
    entries,
    hookDirectory: config.paths.hooks,
    runPrefixes,
    shipped: new Set(entries.map((entry) => entry.path)),
  };
};

const shippedEscapes = ({ profile, root }) => {
  const {
    agentDirectory,
    allowedBins,
    allowedCommands,
    allowedPackages,
    allowedTasks,
    configKeys,
    entries,
    hookDirectory,
    runPrefixes,
    shipped,
  } = shippedContext({ profile, root });
  const files = entries.map((entry) => ({
    content: entry.content,
    path: entry.path,
  }));

  const { escapes, unchecked } = analyseClosure({
    agentDirectory,
    allowedBins,
    allowedCommands,
    allowedConfigKeys: configKeys,
    allowedPackages,
    allowedTasks,
    exists: (path) => existsSync(resolve(root, path)),
    files,
    hookDirectory,
    rootDirectory: '',
    runPrefixes,
    shipped,
  });

  return { escapes, fileCount: files.length, unchecked };
};

const shippedResults = ({ profile, root }) =>
  (profile === undefined ? Object.keys(PROFILES) : [profile]).map((name) => ({
    name,
    ...shippedEscapes({ profile: name, root }),
  }));

const coverageOf = (result) =>
  `${result.fileCount} shipped file(s), ${result.fileCount - result.unchecked.length} read, ${result.unchecked.length} unchecked`;

const reportClean = (results) => {
  for (const result of results) {
    console.log(`✓ ${result.name} — ${coverageOf(result)}, no escapes`);
    for (const line of describeUnchecked(result)) console.log(line);
  }
};

const reportEscapes = (results) => {
  for (const result of results) {
    console.error(`✗ ${result.name} — ${coverageOf(result)}`);
    for (const finding of result.escapes) {
      console.error(`    ${describeEscape(finding)}`);
    }
    for (const line of describeUnchecked(result)) console.error(line);
  }
  const total = results.reduce((sum, result) => sum + result.escapes.length, 0);
  console.error(`\n${total} escape(s) across ${results.length} profile(s).`);
};

const runShippedClosure = ({ profile, root }) => {
  const results = shippedResults({ profile, root });
  const dirty = results.filter((result) => result.escapes.length > 0);

  reportClean(results.filter((result) => result.escapes.length === 0));
  if (dirty.length === 0) return 0;

  reportEscapes(dirty);
  return 1;
};

const notADirectory = (root) => (directory) => {
  const path = resolve(root, directory);
  return !existsSync(path) || !statSync(path).isDirectory();
};

const runDirectoryClosure = ({ directories, profile, root }) => {
  const missing = directories.filter(notADirectory(root));
  if (missing.length > 0) {
    console.error(`not a directory: ${missing.join(', ')}`);
    return 1;
  }

  const {
    agentDirectory,
    allowedBins,
    allowedCommands,
    configKeys,
    hookDirectory,
    shipped,
  } = shippedContext({ profile, root });
  const results = directories.map((directory) =>
    analyseDirectory({
      agentDirectory,
      allowedBins,
      allowedCommands,
      allowedConfigKeys: configKeys,
      directory: resolve(root, directory),
      hookDirectory,
      root,
      shipped,
    }),
  );

  console.log(renderClosureReport(results));

  const escapes = results.flatMap((result) => result.escapes);
  if (escapes.length === 0) {
    console.log(`\nClosure gate passed: ${results.length} directory(ies).`);
    return 0;
  }

  const dirty = results.filter((result) => result.escapes.length > 0).length;
  console.error(
    `\n${escapes.length} finding(s) across ${dirty} directory(ies).`,
  );
  return 1;
};

export const runClosure = (argv, root) => {
  const { error, profile, rest } = readProfileFlag(argv);
  if (error !== undefined) {
    console.error(error);
    return 1;
  }

  const directories = rest.filter((entry) => entry !== '--shipped');

  const unusable = directories.filter((entry) => entry.startsWith('-'));
  if (unusable.length > 0) {
    console.error(`not an argument this command takes: ${unusable.join(', ')}`);
    return 1;
  }

  if (rest.length !== directories.length) {
    return runShippedClosure({ profile, root });
  }

  if (directories.length === 0) {
    console.error('closure needs at least one directory to analyse');
    return 1;
  }

  return runDirectoryClosure({ directories, profile, root });
};
