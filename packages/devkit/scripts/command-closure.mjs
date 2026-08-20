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

/**
 * `--profile <name>` and its value, taken out of the positional arguments.
 *
 * It matters most for `--shipped`: a profile the repository does not itself use
 * places files it never materialises, and without naming that profile the gate
 * would report a clean pass over a set it never looked at — the same green run
 * as a set with no escapes in it.
 */
const PROFILE_FLAG = '--profile';

/**
 * A flag-shaped value is not consumed as the profile name. Swallowing it would
 * run the whole command against a profile called `--shipped`, which nothing
 * places; leaving it behind lets `runClosure` report the flag that has no value.
 */
const withoutProfile = (argv) => {
  const index = argv.indexOf(PROFILE_FLAG);
  const value = index === -1 ? undefined : argv[index + 1];
  if (value === undefined || value.startsWith('-')) return { rest: argv };
  return {
    profile: value,
    rest: [...argv.slice(0, index), ...argv.slice(index + 2)],
  };
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
  const { profile, rest } = withoutProfile(argv);
  const directories = rest.filter((entry) => entry !== '--shipped');

  // Checked BEFORE dispatching on `--shipped`, because that dispatch reads the
  // rest as directories and never looks at them again. `devkit closure --profile
  // --shipped` — the profile flag with its value dropped — would otherwise leave
  // `--profile` in this list, be filtered away unexamined, and check every
  // profile: a clean pass for a run that was asked to narrow to one and was told
  // which one by nobody.
  const unusable = directories.filter((entry) => entry.startsWith('-'));
  if (unusable.length > 0) {
    const hint = unusable.includes(PROFILE_FLAG)
      ? ` — ${PROFILE_FLAG} needs a profile name after it`
      : '';
    console.error(
      `not an argument this command takes: ${unusable.join(', ')}${hint}`,
    );
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
