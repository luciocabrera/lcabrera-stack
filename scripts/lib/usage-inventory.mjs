/**
 * Lists the harness parts a usage report has to account for: the skills, the
 * subagents, the workflows and the path rules this repository ships.
 *
 * The inventory is read from disk rather than configured, so a part added today
 * appears in tomorrow's report — including with a count of zero, which is the
 * whole point. A roster kept by hand would list only what someone remembered,
 * and an unused part is exactly the one nobody remembers.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const namesIn = ({ directory, keep, strip }) =>
  existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true })
        .filter((entry) => keep(entry))
        .map((entry) => (strip === undefined ? entry.name : strip(entry.name)))
        .toSorted((a, b) => a.localeCompare(b))
    : [];

export const listSkills = (repoRoot) =>
  namesIn({
    directory: join(repoRoot, '.github', 'skills'),
    keep: (entry) =>
      entry.isDirectory() &&
      existsSync(join(repoRoot, '.github', 'skills', entry.name, 'SKILL.md')),
  });

export const listSubagents = (repoRoot) =>
  namesIn({
    directory: join(repoRoot, '.claude', 'agents'),
    keep: (entry) => entry.isFile() && entry.name.endsWith('.md'),
    strip: (name) => name.replace(/\.md$/u, ''),
  });

export const listWorkflows = (repoRoot) =>
  namesIn({
    directory: join(repoRoot, '.github', 'workflows'),
    keep: (entry) =>
      entry.isFile() &&
      /\.ya?ml$/u.test(entry.name) &&
      !entry.name.startsWith('.'),
  });

export const listPathRules = (repoRoot) =>
  namesIn({
    directory: join(repoRoot, '.claude', 'rules'),
    keep: (entry) => entry.isFile() && entry.name.endsWith('.md'),
  });

export const readHarnessInventory = (repoRoot) => ({
  pathRules: listPathRules(repoRoot),
  skills: listSkills(repoRoot),
  subagents: listSubagents(repoRoot),
  workflows: listWorkflows(repoRoot),
});
