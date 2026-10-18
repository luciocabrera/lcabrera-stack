/**
 * Decides which skills a pull request's eval report runs: none when the PR
 * leaves the agent-facing surface alone, every skill when a catalog entry
 * moved, and otherwise only the skills whose directory changed.
 * Usage: imported by `select-skills.mjs`.
 */
import { canonicalJson } from '@repo/eval-history/hashing/canonicalJson.util';
import { skillCatalogEntry } from '@repo/eval-history/hashing/skillCatalogEntry.util';

const EVAL_SURFACE = [
  '.github/skills/',
  '.claude/rules/',
  '.claude/agents/',
  'evals/',
];

const SKILL_DIRECTORY = /^(?:\.github\/skills|evals\/skills)\/([^/]+)\/./u;

export const SKILL_ENTRY = /^\.github\/skills\/[^/]+\/SKILL\.md$/u;

export const touchesEvalSurface = (changed) =>
  changed.some((path) =>
    EVAL_SURFACE.some((prefix) => path.startsWith(prefix)),
  );

export const changedSkills = (changed) =>
  [
    ...new Set(
      changed
        .map((path) => SKILL_DIRECTORY.exec(path)?.[1])
        .filter((name) => name !== undefined),
    ),
  ].toSorted((a, b) => a.localeCompare(b));

const catalogEntryOf = (source) =>
  source === undefined ? null : skillCatalogEntry(source);

export const catalogMoved = (entries) =>
  entries.some(
    ({ after, before }) =>
      canonicalJson(catalogEntryOf(before)) !==
      canonicalJson(catalogEntryOf(after)),
  );

export const skillSelection = ({ changed, moved, runnable }) => {
  if (!touchesEvalSurface(changed)) {
    return { scope: 'out', skills: [] };
  }
  if (moved) {
    return { scope: 'all', skills: [] };
  }
  const skills = changedSkills(changed).filter((name) =>
    runnable.includes(name),
  );
  return { scope: skills.length === 0 ? 'none' : 'some', skills };
};

export const selectionOutputs = ({ scope, skills }) => [
  `scope=${scope}`,
  `skills=${skills.join(' ')}`,
];
