/**
 * Fails when a file `packages/devkit` ships names something only this repository
 * has: one of its package names, one of its secrets, or its task runner.
 *
 * Why in addition to `devkit closure`: that probe reads markdown structure —
 * links, fenced commands, inline paths. The workflow and hook seeds have none of
 * it, so closure sees nothing in them at all, and a repository name written in
 * prose is invisible to it everywhere.
 *
 * The deciding half is `./lib/devkit-seeds.mjs` (pure); this file is the reading,
 * the printing and the exit code. See `.claude/rules/scripts.md`.
 *
 * Usage: node scripts/verify-devkit-seeds.mjs
 * Exit codes: 0 = clean, 1 = a seed names this repository, or an exemption
 * matched nothing.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import process from 'node:process';

import {
  brokenPlaceholdersIn,
  EXEMPTIONS,
  findingsIn,
  forbiddenWords,
  reportFor,
} from './lib/devkit-seeds.mjs';

const REPO_ROOT = process.cwd();
const ASSETS_DIR = join(REPO_ROOT, 'packages', 'devkit', 'assets');
const WORKFLOWS_DIR = join(REPO_ROOT, '.github', 'workflows');
const WORKSPACE_DIRS = ['apps', 'packages'];

const SECRET_REFERENCE = /secrets\.([A-Z][A-Z0-9_]*)/g;

const filesUnder = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const isDirectory = (path) =>
  statSync(path, { throwIfNoEntry: false })?.isDirectory() === true;

/** Every workspace's package name, from the manifests rather than from a list. */
const workspacePackageNames = () =>
  WORKSPACE_DIRS.filter((group) => isDirectory(join(REPO_ROOT, group))).flatMap(
    (group) =>
      readdirSync(join(REPO_ROOT, group), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(REPO_ROOT, group, entry.name, 'package.json'))
        .filter(
          (path) => statSync(path, { throwIfNoEntry: false }) !== undefined,
        )
        .map((path) => readJson(path).name)
        .filter((name) => typeof name === 'string'),
  );

/** The secrets this repository's own workflows read. */
const configuredSecretNames = () =>
  filesUnder(WORKFLOWS_DIR)
    .flatMap((path) => [
      ...readFileSync(path, 'utf8').matchAll(SECRET_REFERENCE),
    ])
    .map((match) => match[1]);

const toPosix = (path) => path.split(sep).join('/');

const readSeeds = () =>
  filesUnder(ASSETS_DIR).map((path) => ({
    content: readFileSync(path, 'utf8'),
    path: toPosix(relative(ASSETS_DIR, path)),
  }));

const main = () => {
  const words = forbiddenWords({
    repositoryName: readJson(join(REPO_ROOT, 'package.json')).name,
    secretNames: configuredSecretNames(),
    workspaceNames: workspacePackageNames(),
  });

  const seeds = readSeeds();
  const { reported, unused } = reportFor({
    exemptions: EXEMPTIONS,
    findings: seeds.flatMap((seed) =>
      findingsIn({ content: seed.content, path: seed.path, words }),
    ),
  });

  const broken = seeds.flatMap((seed) =>
    brokenPlaceholdersIn({ content: seed.content, path: seed.path }),
  );

  for (const finding of reported) {
    console.error(
      `  ${finding.path}:${finding.line}  names \`${finding.word.trim()}\``,
    );
  }
  for (const entry of unused) {
    console.error(
      `  ${entry.path} is exempted and clean — delete its entry from scripts/lib/devkit-seeds.mjs`,
    );
  }
  for (const finding of broken) {
    console.error(
      `  ${finding.path}:${finding.line}  names a command key the substituter cannot read — quote the scalar so the formatter leaves it alone`,
    );
  }

  if (reported.length > 0 || unused.length > 0 || broken.length > 0) {
    console.error(
      '\nA shipped file may not name this repository, and every placeholder in one has to survive to the consumer.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Seed gate passed: ${seeds.length} shipped file(s), ${EXEMPTIONS.length} exempted.`,
  );
  for (const entry of EXEMPTIONS) {
    console.log(`  exempt: ${entry.path} — ${entry.reason}`);
  }
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
