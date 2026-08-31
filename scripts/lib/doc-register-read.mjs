/**
 * Reads both doc registers off a working tree — the one effectful half the
 * gate and the two reports share, so they cannot disagree about which files are
 * entries.
 *
 * The root is the process's working directory rather than this file's, which is
 * what lets the gate be run against a planted tree in a test: a check nobody
 * can watch fail is a check nobody has evidence for (AGENTS.md Rule 14). Run it
 * from the repo root.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

import { readTextWithin } from '../../packages/repo-standards/scripts/safe-read.mjs';
import { deriveWorkspaces } from '../../packages/repo-standards/scripts/workspace-scopes.mjs';
import { commandsRunByCi } from './ci-commands.mjs';
import {
  isTemplate,
  PLANNING_DIR,
  REQUIREMENTS_DIR,
  toEntry,
} from './doc-registers.mjs';

const WORKFLOW_DIR = '.github/workflows';

const toPosix = (path) => path.split(sep).join('/');

const markdownFilesIn = (root, dir) => {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) {
    return [];
  }
  return readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => toPosix(relative(root, join(entry.parentPath, entry.name))))
    .filter((file) => !isTemplate(file))
    .sort((a, b) => a.localeCompare(b));
};

const readEntries = (root, dir, register) =>
  markdownFilesIn(root, dir).map((file) =>
    toEntry({
      file,
      register,
      source: readTextWithin(join(root, file), root),
    }),
  );

const readJson = (root, file) => {
  const path = join(root, file);
  return existsSync(path) ? JSON.parse(readTextWithin(path, root)) : {};
};

const readWorkflows = (root) => {
  const absolute = join(root, WORKFLOW_DIR);
  if (!existsSync(absolute)) {
    return [];
  }
  return readdirSync(absolute)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => ({
      file: `${WORKFLOW_DIR}/${name}`,
      source: readTextWithin(join(absolute, name), root),
    }));
};

const pointerResolver = (root) => (ref) => {
  const target = resolve(root, ref);
  return (
    (target === root || target.startsWith(root + sep)) && existsSync(target)
  );
};

export const readRegisters = (root) => {
  const manifest = readJson(root, 'package.json');
  const rootScripts = manifest.scripts ?? {};
  return {
    ciCommands: commandsRunByCi({
      rootScripts,
      workflows: readWorkflows(root),
    }),
    planning: readEntries(root, PLANNING_DIR, 'planning'),
    requirements: readEntries(root, REQUIREMENTS_DIR, 'requirement'),
    resolves: pointerResolver(root),
    rootTasks: new Set(Object.keys(rootScripts)),
    roster: new Set(deriveWorkspaces(root).map((workspace) => workspace.name)),
  };
};
