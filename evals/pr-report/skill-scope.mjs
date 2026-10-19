/**
 * Decides which skills a pull request's eval report selects: none when the PR
 * leaves the agent-facing surface alone, every skill when a catalog entry
 * moved, and otherwise only the skills whose directory changed. A selection
 * runs only on a pull request that carries the opt-in label.
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

export const OPT_IN_LABEL = 'evals';

const RUNNABLE_SCOPES = new Set(['all', 'some']);

export const parseLabels = (text) => {
  try {
    const labels = JSON.parse(text);
    return Array.isArray(labels)
      ? labels.filter((label) => typeof label === 'string')
      : [];
  } catch {
    return [];
  }
};

export const runDecision = ({ labels, scope }) => {
  const labelled = labels.includes(OPT_IN_LABEL);
  return { labelled, run: labelled && RUNNABLE_SCOPES.has(scope) };
};

export const selectionOutputs = ({ labelled, run, scope, skills }) => [
  `scope=${scope}`,
  `skills=${skills.join(' ')}`,
  `labelled=${String(labelled)}`,
  `run=${String(run)}`,
];
