/*
 * The `closure` command: walk the named directories, analyse each one, and turn
 * the findings into an exit code.
 *
 * Separate from the CLI entry point so the dispatcher stays a dispatcher, and
 * from the analysis so the wording of a finding can change without touching
 * what counts as one.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  analyseDirectory,
  BASELINE_COMMANDS,
  renderClosureReport,
} from './closure-report.mjs';
import { analyseClosure } from './closure.mjs';
import { buildPlan } from './command-materialise.mjs';
import { configuredCommandWords } from './config.mjs';

/**
 * Everything the package would place in this repository, and the tools the
 * consumer's config answers for. A reference to either travels.
 *
 * Deliberately not guarded: `buildPlan` throws on a malformed config, and
 * catching that here would substitute an empty shipped set for an error, so
 * every contract and sibling-skill reference would start reporting as an escape.
 * A configuration fault must read as a configuration fault, not as findings.
 */
const shippedContext = (root) => {
  const { config, entries } = buildPlan({ root });
  return {
    allowedCommands: [...BASELINE_COMMANDS, ...configuredCommandWords(config)],
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
 */
const runShippedClosure = (root) => {
  const { allowedCommands, shipped } = shippedContext(root);
  const plan = buildPlan({ root }).entries;
  const files = plan
    .filter((entry) => existsSync(resolve(root, entry.path)))
    .map((entry) => ({
      content: readFileSync(resolve(root, entry.path), 'utf8'),
      path: entry.path,
    }));

  const { escapes } = analyseClosure({
    allowedCommands,
    exists: (path) => existsSync(resolve(root, path)),
    files,
    rootDirectory: '',
    shipped,
  });

  if (escapes.length === 0) {
    console.log(`Closure gate passed: ${files.length} shipped file(s).`);
    return 0;
  }

  for (const finding of escapes) {
    console.error(
      `  ${finding.file}:${finding.line}  ${finding.resolved ?? finding.reference}`,
    );
  }
  console.error(`\n${escapes.length} escape(s) in the shipped set.`);
  return 1;
};

export const runClosure = (directories, root) => {
  if (directories.includes('--shipped')) return runShippedClosure(root);

  if (directories.length === 0) {
    console.error('closure needs at least one directory to analyse');
    return 1;
  }

  const missing = directories.filter((directory) => {
    const path = resolve(root, directory);
    return !existsSync(path) || !statSync(path).isDirectory();
  });

  if (missing.length > 0) {
    console.error(`not a directory: ${missing.join(', ')}`);
    return 1;
  }

  const { allowedCommands, shipped } = shippedContext(root);
  const results = directories.map((directory) =>
    analyseDirectory({
      allowedCommands,
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
