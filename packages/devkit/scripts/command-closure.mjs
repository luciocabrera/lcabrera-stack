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
  renderClosureReport,
} from './closure-report.mjs';
import { analyseClosure } from './closure.mjs';
import { buildPlan } from './command-materialise.mjs';
import {
  allowedConfigKeys,
  configuredCommandWords,
  PROFILES,
} from './config.mjs';
import { readProfileFlag } from './profile-flag.mjs';

const shippedContext = ({ profile, root }) => {
  const { config, entries } = buildPlan({ profile, root });
  return {
    allowedCommands: [...BASELINE_COMMANDS, ...configuredCommandWords(config)],
    configKeys: allowedConfigKeys(config),
    entries,
    shipped: new Set(entries.map((entry) => entry.path)),
  };
};

const shippedEscapes = ({ profile, root }) => {
  const { allowedCommands, configKeys, entries, shipped } = shippedContext({
    profile,
    root,
  });
  const files = entries.map((entry) => ({
    content: entry.content,
    path: entry.path,
  }));

  const { escapes } = analyseClosure({
    allowedCommands,
    allowedConfigKeys: configKeys,
    exists: (path) => existsSync(resolve(root, path)),
    files,
    rootDirectory: '',
    shipped,
  });

  return { escapes, fileCount: files.length };
};

const shippedResults = ({ profile, root }) =>
  (profile === undefined ? Object.keys(PROFILES) : [profile]).map((name) => ({
    name,
    ...shippedEscapes({ profile: name, root }),
  }));

const reportClean = (results) => {
  for (const result of results) {
    console.log(
      `✓ ${result.name} — ${result.fileCount} shipped file(s), self-contained`,
    );
  }
};

const reportEscapes = (results) => {
  for (const result of results) {
    console.error(`✗ ${result.name} — ${result.fileCount} shipped file(s)`);
    for (const finding of result.escapes) {
      console.error(`    ${describeEscape(finding)}`);
    }
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

  const { allowedCommands, configKeys, shipped } = shippedContext({
    profile,
    root,
  });
  const results = directories.map((directory) =>
    analyseDirectory({
      allowedCommands,
      allowedConfigKeys: configKeys,
      directory: resolve(root, directory),
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
