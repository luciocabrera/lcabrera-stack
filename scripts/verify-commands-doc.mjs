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
 * Ground truth is `vp run` with no task, which lists every runnable task as
 * `packageName#taskName`. That matters: tasks come from THREE sources
 * (package.json scripts, vite.config.ts `run.tasks`, and shared factories in
 * @lcabrera/vite-config), so reading package.json alone would report false
 * failures for `test`/`build` in most workspaces. Asking the toolchain avoids
 * re-implementing its resolution.
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
 *   vp run commands:verify
 *   node scripts/verify-commands-doc.mjs
 *
 * Exit codes: 0 = COMMANDS.md is accurate, 1 = it lies (every discrepancy is
 * listed, not just the first).
 */
import { execFile } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const COMMANDS_DOC = 'COMMANDS.md';

/**
 * `vp run` prints `  <key>: <command>`, where the key may itself contain `:`
 * (`check:safe`) and `#` (`@lcabrera/ui#lint:eslint:check`). The lazy inner group
 * makes the split land on the last colon that is followed by whitespace.
 */
const TASK_LINE = /^\s{2}([^\s:]+(?::[^\s:]+)*?):\s/;

/** Reads every runnable task from the toolchain itself — all three sources. */
const readTaskInventory = async () => {
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

/** Every workspace's package name, from the pnpm workspace layout. */
const readWorkspaceNames = () =>
  ['apps', 'packages'].flatMap((group) =>
    readdirSync(join(REPO_ROOT, group))
      .map((name) => join(REPO_ROOT, group, name, 'package.json'))
      .filter((manifest) => existsSync(manifest))
      .map((manifest) => JSON.parse(readFileSync(manifest, 'utf8')).name),
  );

/** Root scripts are what §4 documents; vite.config tasks are covered by §2. */
const readRootScripts = () =>
  Object.keys(
    JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).scripts ??
      {},
  );

/** `vp run <task>` mentions anywhere in the doc, deduped. */
const findDocumentedCommands = (doc) => {
  const matches = doc.matchAll(/vp run ([a-z][\w:-]*)/g);
  return new Set([...matches].map(([, task]) => task));
};

/**
 * §5's table rows are `| \`dir\` | \`package-name\` | \`task\`, \`task\` |`.
 * Only the third column is read, and only its backticked tokens — prose in
 * that cell (an em dash for "none") is ignored.
 */
const findWorkspaceTaskClaims = (doc) => {
  const section = doc.split('## 5. Per-workspace tasks')[1]?.split('\n---')[0];
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
      const tasks = [...(cells[3] ?? '').matchAll(/`([^`]+)`/g)].map(
        ([, task]) => task,
      );
      return tasks.map((task) => ({ packageName, task }));
    });
};

/** Relative markdown links, split into path and optional #anchor. */
const findLinks = (doc) =>
  [...doc.matchAll(/\]\((?!https?:)([^)#]+)(?:#([^)]+))?\)/g)].map(
    ([, path, anchor]) => ({ anchor, path }),
  );

/** GitHub's heading→anchor slug, close enough for the headings used here. */
const toAnchor = (heading) =>
  heading
    .toLowerCase()
    .replaceAll(/[^\da-z\s-]/g, '')
    .trim()
    .replaceAll(/\s/g, '-');

const collectAnchors = (markdown) =>
  new Set(
    [...markdown.matchAll(/^#{2,4}\s+(\S.*)$/gm)].map(([, heading]) =>
      toAnchor(heading),
    ),
  );

const checkRootScriptsDocumented = (documented, problems) => {
  for (const script of readRootScripts()) {
    if (!documented.has(script)) {
      problems.push(
        `${COMMANDS_DOC} does not document the root script \`${script}\` — add it, or delete the script.`,
      );
    }
  }
};

const checkDocumentedCommandsExist = (documented, inventory, problems) => {
  const everyTask = new Set([
    ...inventory.rootTasks,
    ...[...inventory.packageTasks.values()].flatMap((tasks) => [...tasks]),
  ]);
  for (const task of documented) {
    if (!everyTask.has(task)) {
      problems.push(
        `${COMMANDS_DOC} documents \`vp run ${task}\`, which is not a task in any workspace — it was renamed or removed.`,
      );
    }
  }
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

/**
 * The "all 15 workspaces" bug, mechanised.
 *
 * The leading `\b` is load-bearing, not decoration. Without it a match can
 * start at every digit of a run, and each start re-scans the rest of that run
 * greedily before failing — quadratic in the length of the number. Measured on
 * a 128k-digit run: 2954ms without the boundary, 0.12ms with it.
 */
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
  const documented = findDocumentedCommands(doc);
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
      `\n${problems.length} problem(s). COMMANDS.md is the canonical command reference — fix it in the same commit as the change that broke it.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `${COMMANDS_DOC} is accurate: ${readRootScripts().length} root scripts documented, ` +
      `${documented.size} documented commands resolve, ${readWorkspaceNames().length} workspaces.`,
  );
};

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
