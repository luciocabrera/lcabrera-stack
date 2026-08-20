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

/**
 * Everything the package would place in this repository, the tools the
 * consumer's config answers for, and the keys that config is able to carry. A
 * reference to any of them travels.
 *
 * Deliberately not guarded: `buildPlan` throws on a malformed config, and
 * catching that here would substitute an empty shipped set for an error, so
 * every contract and sibling-skill reference would start reporting as an escape.
 * A configuration fault must read as a configuration fault, not as findings.
 */
const shippedContext = ({ profile, root }) => {
  const { config, entries } = buildPlan({ profile, root });
  return {
    allowedCommands: [...BASELINE_COMMANDS, ...configuredCommandWords(config)],
    configKeys: allowedConfigKeys(config),
    entries,
    shipped: new Set(entries.map((entry) => entry.path)),
  };
};

/**
 * Every file the package places, checked as one body rather than per directory.
 *
 * This is the question that actually matters — a consumer receives the shipped
 * set, not a directory — and it is the only form that gives a clean answer where
 * a directory holds both shipped and unshipped files, as `.claude/rules` does.
 * `rootDirectory` is empty on purpose: nothing is internal by virtue of where it
 * sits, only by being shipped.
 *
 * The content analysed is the PLAN's, not the copy on disk. They are the same
 * file wherever this repository materialises a group, and only the plan exists
 * for a group it does not — the scaffolding seeds, which this repository holds
 * its own versions of and must not overwrite. Reading from disk there would
 * measure the repository's file and report the seed as checked.
 */
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

/**
 * Every profile, unless one is named.
 *
 * Checking only the profile this repository happens to use would leave the
 * others measured by nothing, and a group that ships nowhere here is exactly
 * where an escape survives — the seeds. It is also the only way to catch the
 * mistake a profile makes possible: a file in one profile pointing at a file
 * only a WIDER profile places. That reference resolves for a consumer who took
 * everything and dangles for the one who took the smaller set, so it can only be
 * seen by checking the smaller set on its own.
 */
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

  // Checked BEFORE dispatching on `--shipped`, because that dispatch reads the
  // rest as directories and never looks at them again — anything flag-shaped
  // left here would be filtered away unexamined and the run would report on a
  // set nobody asked for.
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
