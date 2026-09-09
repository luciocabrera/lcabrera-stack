#!/usr/bin/env node
/**
 * Verifies that COMMANDS.md still tells the truth about this repo.
 *
 * COMMANDS.md claims to be "the canonical list of every command in this
 * monorepo". Nothing enforced that claim, and doc rot is what produced most of
 * the defects this file now guards against: seven root scripts documented
 * nowhere, a README telling people to run `vp run seed` from the root (not a
 * root script — it exits non-zero), an "all 15 workspaces" count that was 16,
 * and a whole `claudelint` apparatus documented as working while the binary
 * did not exist. Every one of those was invisible to CI, because a wrong
 * sentence fails nothing.
 *
 * How a task is spelled, and where the list of them comes from, are both the
 * repository's own facts: `commands.run` in the shared config answers the first,
 * and the second follows from it. A toolchain that resolves a task from more
 * than the manifests — a config's own tasks, a shared factory it composes — has
 * to be ASKED for the list, which is what `vp run` with no task prints; a runner
 * that runs manifest scripts and nothing else is fully read from the manifests.
 * Assuming one runner reported every task in the file as undocumented, with a
 * remedy the reader had already carried out.
 *
 * Checks:
 *   1. Every root package.json script is documented in COMMANDS.md.
 *   2. Every `vp run <task>` COMMANDS.md documents as a root command resolves
 *      to a real root task.
 *   3. Every per-workspace task claimed in the §5 table exists for that package.
 *   4. Every relative link and in-file anchor in COMMANDS.md resolves.
 *   5. Every "<N> workspaces" claim matches the real workspace count.
 *
 * What it deliberately does NOT check: prose and rationale. Those cannot be
 * mechanically verified — they rot slower, and a wrong rationale misleads
 * rather than sending someone to run a command that does not exist.
 *
 * Usage (from the repo root):
 *   repo-verify-commands
 *
 * Exit codes: 0 = COMMANDS.md is accurate, 1 = it lies (every discrepancy is
 * listed, not just the first).
 */
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import {
  documentedTasks,
  requiresRunnerTaskList,
  undocumentedScripts,
  unresolvedDocumented,
} from './commands-doc.mjs';
import { readCommands, readGates, readPublishing } from './config.mjs';
import { resolveHostRoot } from './host-root.mjs';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolveHostRoot({
  moduleDirectory: dirname(fileURLToPath(import.meta.url)),
});
const COMMANDS_DOC = readGates(REPO_ROOT).commandsDoc.file;
const WORKSPACE_DIRS = readPublishing(REPO_ROOT).workspaceDirs;
const RUN_PREFIX = readCommands(REPO_ROOT).run;

const TASK_LINE = /^\s{2}([^\s:]+(?::[^\s:]+)*?):\s/;

const askedTaskInventory = async () => {
  const { stdout } = await execFileAsync('vp', ['run'], { cwd: REPO_ROOT });
  const rootTasks = new Set();
  const packageTasks = new Map();

  for (const line of stdout.split('\n')) {
    const key = TASK_LINE.exec(line)?.[1];
    if (key === undefined) {
      continue;
    }
    const separator = key.lastIndexOf('#');
    if (separator === -1) {
      rootTasks.add(key);
      continue;
    }
    const packageName = key.slice(0, separator);
    const task = key.slice(separator + 1);
    const existing = packageTasks.get(packageName) ?? new Set();
    existing.add(task);
    packageTasks.set(packageName, existing);
  }

  return { packageTasks, rootTasks };
};

const workspaceManifests = () =>
  WORKSPACE_DIRS.filter((group) => existsSync(join(REPO_ROOT, group))).flatMap(
    (group) =>
      readdirSync(join(REPO_ROOT, group))
        .map((name) => join(REPO_ROOT, group, name, 'package.json'))
        .filter((manifest) => existsSync(manifest))
        .map((manifest) => JSON.parse(readFileSync(manifest, 'utf8'))),
  );

const readManifestInventory = () => ({
  packageTasks: new Map(
    workspaceManifests()
      .filter((manifest) => typeof manifest.name === 'string')
      .map((manifest) => [
        manifest.name,
        new Set(Object.keys(manifest.scripts ?? {})),
      ]),
  ),
  rootTasks: new Set(readRootScripts()),
});

const readTaskInventory = async () =>
  requiresRunnerTaskList(RUN_PREFIX)
    ? await askedTaskInventory()
    : readManifestInventory();

const readWorkspaceNames = () =>
  workspaceManifests().map((manifest) => manifest.name);

const readRootScripts = () =>
  Object.keys(
    JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).scripts ??
      {},
  );

const findWorkspaceTaskClaims = (doc) => {
  const section = doc
    .split('## 5. Per-workspace tasks', 2)[1]
    ?.split('\n---', 1)[0];
  if (section === undefined) {
    return [];
  }
  return section
    .split('\n')
    .filter((line) => line.startsWith('|') && line.includes('`'))
    .flatMap((line) => {
      const cells = line.split('|').map((cell) => cell.trim());
      const packageName = /`([^`]+)`/.exec(cells[2] ?? '')?.[1];
      if (packageName === undefined) {
        return [];
      }
      const tasks = (cells[3] ?? '')
        .matchAll(/`([^`]+)`/g)
        .map(([, task]) => task)
        .toArray();
      return tasks.map((task) => ({ packageName, task }));
    });
};

const findLinks = (doc) =>
  doc
    .matchAll(/\]\((?!https?:)([^)#]+)(?:#([^)]+))?\)/g)
    .map(([, path, anchor]) => ({ anchor, path }))
    .toArray();

const toAnchor = (heading) =>
  heading
    .toLowerCase()
    .replaceAll(/[^\da-z\s-]/g, '')
    .trim()
    .replaceAll(/\s/g, '-');

const collectAnchors = (markdown) =>
  new Set(
    markdown
      .matchAll(/^#{2,4}\s+(\S.*)$/gm)
      .map(([, heading]) => toAnchor(heading)),
  );

const checkRootScriptsDocumented = (documented, problems) => {
  problems.push(
    ...undocumentedScripts({
      docName: COMMANDS_DOC,
      documented,
      rootScripts: readRootScripts(),
      runPrefix: RUN_PREFIX,
    }),
  );
};

const checkDocumentedCommandsExist = (documented, inventory, problems) => {
  problems.push(
    ...unresolvedDocumented({
      docName: COMMANDS_DOC,
      documented,
      runPrefix: RUN_PREFIX,
      tasks: new Set([
        ...inventory.rootTasks,
        ...inventory.packageTasks.values().flatMap((tasks) => [...tasks]),
      ]),
    }),
  );
};

const checkWorkspaceClaims = (doc, inventory, problems) => {
  for (const { packageName, task } of findWorkspaceTaskClaims(doc)) {
    const tasks = inventory.packageTasks.get(packageName);
    if (tasks === undefined) {
      problems.push(
        `${COMMANDS_DOC} §5 lists package \`${packageName}\`, which no workspace declares.`,
      );
      continue;
    }
    if (!tasks.has(task)) {
      problems.push(
        `${COMMANDS_DOC} §5 claims \`${packageName}\` has a \`${task}\` task; it does not.`,
      );
    }
  }
};

const checkLinks = (doc, problems) => {
  for (const { anchor, path } of findLinks(doc)) {
    const target = normalize(join(REPO_ROOT, path));
    if (!existsSync(target)) {
      problems.push(
        `${COMMANDS_DOC} links to \`${path}\`, which does not exist.`,
      );
      continue;
    }
    if (
      anchor !== undefined &&
      !collectAnchors(readFileSync(target, 'utf8')).has(anchor)
    ) {
      problems.push(
        `${COMMANDS_DOC} links to \`${path}#${anchor}\`, but that heading is gone.`,
      );
    }
  }
};

const checkWorkspaceCount = (doc, expected, problems) => {
  for (const [, claimed] of doc.matchAll(/\b(\d+)\s+workspaces/g)) {
    if (Number(claimed) !== expected) {
      problems.push(
        `${COMMANDS_DOC} claims ${claimed} workspaces; there are ${expected}.`,
      );
    }
  }
};

const main = async () => {
  const doc = readFileSync(join(REPO_ROOT, COMMANDS_DOC), 'utf8');
  const inventory = await readTaskInventory();
  const documented = documentedTasks({ doc, runPrefix: RUN_PREFIX });
  const problems = [];

  checkRootScriptsDocumented(documented, problems);
  checkDocumentedCommandsExist(documented, inventory, problems);
  checkWorkspaceClaims(doc, inventory, problems);
  checkLinks(doc, problems);
  checkWorkspaceCount(doc, readWorkspaceNames().length, problems);

  if (problems.length > 0) {
    console.error(`${COMMANDS_DOC} is out of date:\n`);
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    console.error(
      `\n${problems.length} problem(s). ${COMMANDS_DOC} is the canonical command reference — fix it in the same commit as the change that broke it.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `${COMMANDS_DOC} is accurate: ${readRootScripts().length} root scripts documented as \`${RUN_PREFIX} <task>\`, ` +
      `${documented.size} documented commands resolve, ${readWorkspaceNames().length} workspaces.`,
  );
};

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
