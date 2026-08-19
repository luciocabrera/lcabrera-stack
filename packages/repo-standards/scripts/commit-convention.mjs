/**
 * The single source of truth for a repository's commit-message and
 * PR-description format. Pure: constants plus validators that take their inputs
 * (a message string and the derived workspace list) and return
 * `{ errors, warnings }` — string arrays the caller buckets into blocking
 * problems vs non-blocking hints.
 *
 * Consumed by BOTH the commit gate (the commit-msg git hook and the per-commit
 * CI check) and the pull-request gate, so the hook, CI, and the pull-request
 * template all validate against ONE spec and cannot drift. Prose docs link here
 * instead of restating the type list, so they cannot drift either.
 *
 * The names a message needs — the default branch, where shared branches are
 * declared — are arguments with documented defaults rather than constants, so
 * this file says nothing about the repository it happens to be running in.
 *
 * Grammar (Conventional Commits): type, optional scope, optional breaking `!`,
 * a colon-space, then the subject —
 *   type     one of ALLOWED_TYPES (lowercase)
 *   scope    optional; a workspace name (ui, server, react-router, …) or a
 *            cross-cutting area (ci, docs, tooling, …). Free-form in shape; an
 *            unrecognised scope is a WARNING, never a hard failure.
 *   subject  non-empty, no trailing period, within HEADER_MAX.
 *
 * See `.claude/rules/scripts.md` for the standards this file follows.
 */

import { DEFAULT_CONVENTIONS } from './config.mjs';

/** Allowed commit/PR-title types. Includes `revert` (git history uses it) and
 *  `build`/`style` (Conventional-Commit standard; pre-empt bot false-positives).
 *  This array is the canonical type list — prose docs link here, not restate it. */
const ALLOWED_TYPES = [
  'feat',
  'fix',
  'chore',
  'docs',
  'test',
  'refactor',
  'perf',
  'ci',
  'build',
  'revert',
  'style',
];

/** Hard ceiling for the header (first) line; soft target above which we hint. */
const HEADER_MAX = 100;
const HEADER_SOFT = 72;

/** Cross-cutting scopes that are not a single workspace. Kept generous so real
 *  practice does not trip the (non-blocking) unknown-scope hint. */
const CROSSCUTTING_SCOPES = new Set([
  'ci',
  'build',
  'deps',
  'deps-dev',
  'release',
  'docs',
  'agents',
  'repo',
  'scripts',
  'tooling',
  'coordination',
  'biome',
  'sonar',
  'eslint',
  'oxlint',
  'cqms',
  'showcase',
  'admin',
  'db',
  'config',
  'workflow',
  'hooks',
]);

/** Required PR-description sections (heading match, any level, case-insensitive).
 *  The pull-request template mirrors these labels exactly.
 *
 *  Matched as HEADINGS, not substrings: `body.includes('What')` passes on any
 *  prose containing the word, so it would accept a description answering none
 *  of these. A heading is the cheapest proof the author saw the prompt. */
const REQUIRED_PR_SECTIONS = [
  { label: 'What', re: /^#{1,6}\s+what\b/im },
  { label: 'Why', re: /^#{1,6}\s+why\b/im },
  {
    label: 'Verification / Testing',
    re: /^#{1,6}\s+(verification|testing|test plan|how to test|qa|tests)\b/im,
  },
  { label: 'Impact Analysis', re: /^#{1,6}\s+impact\b/im },
  { label: 'Test Coverage', re: /^#{1,6}\s+test coverage\b/im },
  { label: 'Documentation Updates', re: /^#{1,6}\s+documentation\b/im },
];

/** Required issue-description sections. Nothing enforced these before, and the
 *  cost showed up as issues carrying no reproduction, no scope and no
 *  acceptance criteria — which then had to be re-investigated from scratch
 *  before anyone could act on them. Numbering is optional, so both
 *  `## 1. Problem Statement` and `## Problem Statement` pass. */
const REQUIRED_ISSUE_SECTIONS = [
  {
    label: 'Problem Statement',
    re: /^#{1,6}\s+(?:\d+\.\s*)?problem statement\b/im,
  },
  { label: 'Objective', re: /^#{1,6}\s+(?:\d+\.\s*)?objective\b/im },
  { label: 'Context & Background', re: /^#{1,6}\s+(?:\d+\.\s*)?context\b/im },
  { label: 'Scope Definition', re: /^#{1,6}\s+(?:\d+\.\s*)?scope\b/im },
  {
    label: 'Acceptance Criteria',
    re: /^#{1,6}\s+(?:\d+\.\s*)?acceptance criteria\b/im,
  },
  {
    label: 'Planning Metadata',
    re: /^#{1,6}\s+(?:\d+\.\s*)?planning metadata\b/im,
  },
];

/** The relationship keys `docs/agents/dependency-conventions.md` requires of
 *  every issue. Checked in ADDITION to the `Planning Metadata` heading above,
 *  because a heading on its own accepts a section with nothing under it — and
 *  the block, not the heading, is what a reader and the planning layer act on.
 *
 *  This is the one place an issue's CONTENT is checked rather than its shape.
 *  It earns that: the convention said "every issue must include" this block
 *  while no template offered it and nothing read it, so it was unfilled in
 *  practice (#409). An empty answer still passes — `blocking: []` and
 *  `parent: null` are valid — so the cost of compliance is copying the block. */
const DEPENDENCY_KEYS = ['blocking', 'blockedBy', 'parent', 'children'];

/** `[ \t]`, never `\s`: under `m`, `\s` matches the newline the anchor just
 *  matched, so `^\s*` rescans the following lines and backtracks (S8786). Indent
 *  is spaces or tabs anyway. */
const DEPENDENCIES_BLOCK = /^[ \t]*dependencies:/im;

const dependencyErrors = (body) => {
  if (!DEPENDENCIES_BLOCK.test(body)) {
    return [
      'Issue description is missing the `dependencies:` block required under `## Planning Metadata` — see docs/agents/dependency-conventions.md.',
    ];
  }
  return DEPENDENCY_KEYS.filter(
    (key) => !new RegExp(String.raw`^[ \t]*${key}:`, 'im').test(body),
  ).map(
    (key) =>
      `Issue description's \`dependencies:\` block is missing \`${key}:\` — all four keys are required, empty is a valid value.`,
  );
};

/** Branch names: `<type>/<issue>-<kebab-slug>`, `<type>` being the SAME
 *  vocabulary as commits. A second set of words (feature/bugfix/hotfix) would
 *  mean two names for one idea, which is the inconsistency this removes —
 *  `feat` is `feat` whether it labels a branch or a commit.
 *
 *  The issue number is required: it is what ties a branch to the context that
 *  justified it, which is exactly what was missing. */
const BRANCH_RE = new RegExp(
  String.raw`^(?:${ALLOWED_TYPES.join('|')})/\d+-[a-z0-9]+(?:-[a-z0-9]+)*$`,
);

/** Not topic branches, so not subject to the rule: the trunk, and the release
 *  branches a version bump is cut on. */
const EXEMPT_BRANCHES = [/^main$/, /^release-/, /^HEAD$/];

/** Subject words that describe nothing. A vague subject is cheap to write and
 *  expensive to read later, when it is the only surviving record of intent. */
const VAGUE_SUBJECT_WORDS = [
  'stuff',
  'things',
  'misc',
  'various',
  'update code',
  'wip',
];

/** Auto-generated message shapes that are NOT authored subjects — skip them. */
const SKIP_PATTERNS = [
  /^Merge (branch|pull request|remote-tracking branch|tag|commit) /,
  /^Revert "/,
  /^(fixup|squash|amend)! /,
];

const HEADER_RE =
  /^(?<type>[A-Za-z]+)(?:\((?<scope>[^)]*)\))?(?<breaking>!)?: (?<subject>.+)$/;
const SCOPE_TOKEN = /^[a-z0-9]+(?:[/_.-][a-z0-9]+)*$/;
const ADR_SCOPE = /^adr-\d+$/;
const SCISSORS = /^#\s*-+\s*>8\s*-+/;

/** Splits a raw commit-message file into its subject line and body, replicating
 *  git `cleanup=strip`: drop `#` comment lines, cut everything after a scissors
 *  line, then trim surrounding blank lines. `header` is undefined when empty. */
const parseCommitMessage = (raw) => {
  const kept = [];
  for (const line of raw.split(/\r?\n/)) {
    if (SCISSORS.test(line)) {
      break;
    }
    if (!line.startsWith('#')) {
      kept.push(line);
    }
  }
  while (kept.length > 0 && kept[0].trim() === '') {
    kept.shift();
  }
  while (kept.length > 0 && kept.at(-1).trim() === '') {
    kept.pop();
  }
  return { header: kept[0], body: kept.slice(1).join('\n') };
};

/** True for auto-generated merge/revert/autosquash headers we must not validate. */
const shouldSkip = (header) =>
  header !== undefined && SKIP_PATTERNS.some((re) => re.test(header));

/** First path segment of a scope part — `ui/table` → `ui`. */
const scopeRoot = (part) => part.split('/')[0];

const isRecognizedScope = (part, workspaces) => {
  const root = scopeRoot(part);
  return (
    workspaces.has(root) ||
    CROSSCUTTING_SCOPES.has(root) ||
    ADR_SCOPE.test(root)
  );
};

const sampleWorkspaces = (workspaces) => {
  const names = [...workspaces].sort((a, b) => a.localeCompare(b));
  return names.length > 4
    ? `${names.slice(0, 4).join(', ')}, …`
    : names.join(', ');
};

const validateScope = (scope, workspaces) => {
  const errors = [];
  const warnings = [];
  const parts = scope.split(',');
  const malformed = parts.filter((part) => !SCOPE_TOKEN.test(part));
  for (const part of malformed) {
    errors.push(
      `scope \`${part}\` must be a lowercase token (letters, digits, and \` / _ . - \`).`,
    );
  }
  const unknown = parts.filter(
    (part) => SCOPE_TOKEN.test(part) && !isRecognizedScope(part, workspaces),
  );
  if (unknown.length > 0) {
    const quoted = unknown.map((part) => `\`${part}\``).join(', ');
    warnings.push(
      `scope ${quoted} is not a known workspace or area — ` +
        `prefer a workspace (${sampleWorkspaces(workspaces)}) or a cross-cutting area (ci, docs, tooling, deps, …).`,
    );
  }
  return { errors, warnings };
};

const validateSubject = (subject) => {
  const errors = [];
  if (subject.trim() === '') {
    errors.push('subject must not be empty.');
  }
  if (subject.trimEnd().endsWith('.')) {
    errors.push('subject must not end with a period.');
  }
  // Whole words, and only in the subject — a body may legitimately discuss
  // "miscellaneous" or quote a "WIP" label, but a subject built from these
  // words records nothing about what changed.
  const vague = VAGUE_SUBJECT_WORDS.filter((word) =>
    new RegExp(String.raw`\b${word}\b`, 'i').test(subject),
  );
  if (vague.length > 0) {
    errors.push(
      `subject is vague — it says \`${vague.join('`, `')}\`. Say what changed instead.`,
    );
  }
  return errors;
};

const validateLength = (header) => {
  if (header.length > HEADER_MAX) {
    return {
      errors: [
        `header is ${header.length} chars — keep it under ${HEADER_MAX}.`,
      ],
      warnings: [],
    };
  }
  if (header.length > HEADER_SOFT) {
    return {
      errors: [],
      warnings: [
        `header is ${header.length} chars — aim for ${HEADER_SOFT} or fewer.`,
      ],
    };
  }
  return { errors: [], warnings: [] };
};

/**
 * Validates one Conventional-Commit header line (a commit subject or a PR title).
 * `kind` labels messages ("commit message" | "PR title"). Returns
 * `{ errors, warnings }` — never throws.
 */
const validateHeader = (header, { workspaces, kind }) => {
  const match = HEADER_RE.exec(header ?? '');
  if (match === null) {
    return {
      errors: [
        `${kind} is not in Conventional Commit format \`type(scope): subject\` — got \`${header ?? ''}\`. ` +
          `Allowed types: ${ALLOWED_TYPES.join(', ')}.`,
      ],
      warnings: [],
    };
  }
  const { type, scope, subject } = match.groups;
  const errors = [];
  const warnings = [];
  if (type !== type.toLowerCase() || !ALLOWED_TYPES.includes(type)) {
    errors.push(`type \`${type}\` is not one of ${ALLOWED_TYPES.join(', ')}.`);
  }
  if (scope !== undefined) {
    const scoped = validateScope(scope, workspaces);
    errors.push(...scoped.errors);
    warnings.push(...scoped.warnings);
  }
  errors.push(...validateSubject(subject));
  const length = validateLength(header);
  errors.push(...length.errors);
  warnings.push(...length.warnings);
  return { errors, warnings };
};

/**
 * Parses a Conventional-Commit header into `{ type, scope, breaking, subject }`,
 * or null when it doesn't match. Lenient about the type value (does not check it
 * against ALLOWED_TYPES) — callers that only need the shape (the changelog
 * generator, the PR labeler) decide what to do with an unknown type.
 */
export const parseCommitHeader = (header) => {
  const match = HEADER_RE.exec(header ?? '');
  if (match === null) {
    return null;
  }
  const { type, scope, breaking, subject } = match.groups;
  return {
    type: type.toLowerCase(),
    scope,
    breaking: breaking === '!',
    subject,
  };
};

/** Validates a full raw commit-message file. Returns `{ skipped, errors, warnings }`. */
export const validateCommitMessage = (raw, { workspaces }) => {
  const { header } = parseCommitMessage(raw);
  if (header === undefined) {
    return {
      skipped: false,
      errors: ['commit message is empty.'],
      warnings: [],
    };
  }
  if (shouldSkip(header)) {
    return { skipped: true, errors: [], warnings: [] };
  }
  return {
    skipped: false,
    ...validateHeader(header, { workspaces, kind: 'commit message' }),
  };
};

/** Validates a PR title (a Conventional-Commit header). */
export const validatePrTitle = (title, { workspaces }) =>
  validateHeader(title, { workspaces, kind: 'PR title' });

/** Validates a PR description body — required sections must be present. */
export const validatePrBody = (body) => {
  const errors = [];
  if ((body ?? '').trim() === '') {
    errors.push(
      'PR description is empty — fill in the template (.github/pull_request_template.md).',
    );
    return { errors, warnings: [] };
  }
  for (const { label, re } of REQUIRED_PR_SECTIONS) {
    if (!re.test(body)) {
      errors.push(
        `PR description is missing a \`## ${label}\` section — see .github/pull_request_template.md.`,
      );
    }
  }
  return { errors, warnings: [] };
};

/** Validates an issue description body — required sections must be present.
 *  An issue is the context a future reader has; without these it has to be
 *  investigated again before it can be worked. */
export const validateIssueBody = (body) => {
  const errors = [];
  if ((body ?? '').trim() === '') {
    errors.push(
      'Issue description is empty — fill in the template (.github/ISSUE_TEMPLATE/standard_issue.md).',
    );
    return { errors, warnings: [] };
  }
  for (const { label, re } of REQUIRED_ISSUE_SECTIONS) {
    if (!re.test(body)) {
      errors.push(
        `Issue description is missing a \`## ${label}\` section — see .github/ISSUE_TEMPLATE/standard_issue.md.`,
      );
    }
  }
  errors.push(...dependencyErrors(body));
  return { errors, warnings: [] };
};

/** Validates a PR's BASE branch. A PR must target `main` (or a release branch,
 *  or a declared shared branch) — never another feature branch. Merging a
 *  stacked PR into its base instead of `main` orphans the work: PR #367 was
 *  squash-merged into an already-merged base branch and its changes never
 *  reached `main`, until they were recovered by hand. `allowedBases` are the
 *  shared branches declared under docs/coordination/branches/; an empty base
 *  (a local simulation with no PR context) is not checked. */
export const validatePrBase = (
  base,
  {
    allowedBases = [],
    defaultBranch = DEFAULT_CONVENTIONS.defaultBranch,
    sharedBranchesDir = DEFAULT_CONVENTIONS.sharedBranchesDir,
  } = {},
) => {
  const name = (base ?? '').trim();
  if (name === '' || EXEMPT_BRANCHES.some((re) => re.test(name))) {
    return { errors: [], warnings: [] };
  }
  if (allowedBases.includes(name)) {
    return {
      errors: [],
      warnings: [
        `PR base is the shared branch \`${name}\` — allowed while it is a declared, ` +
          'active shared branch (docs/coordination/branches/), which must itself merge to `main`.',
      ],
    };
  }
  return {
    errors: [
      `PR base is \`${name}\`, a feature branch — retarget to \`${defaultBranch}\`. Merging a ` +
        `stacked PR into its base rather than \`${defaultBranch}\` orphans the work (issue #367): ` +
        `the base merges first and the stacked changes never reach \`${defaultBranch}\`. Fix: ` +
        `rebase onto \`${defaultBranch}\`, then \`gh pr edit <n> --base ${defaultBranch}\` — or ` +
        `declare \`${name}\` a shared branch (${sharedBranchesDir}/).`,
    ],
    warnings: [],
  };
};

/** Validates a git branch name against `<type>/<issue>-<kebab-slug>`.
 *  `main` and `release-*` are exempt; they are not topic branches. */
export const validateBranchName = (branch) => {
  const name = (branch ?? '').trim();
  if (name === '') {
    return { errors: ['Branch name is empty.'], exempt: false, warnings: [] };
  }
  if (EXEMPT_BRANCHES.some((re) => re.test(name))) {
    return { errors: [], exempt: true, warnings: [] };
  }
  if (BRANCH_RE.test(name)) {
    return { errors: [], exempt: false, warnings: [] };
  }
  return {
    errors: [
      `Invalid branch name "${name}". Expected \`<type>/<issue-number>-<kebab-description>\`, ` +
        `e.g. \`feat/123-add-column-resize\`. Types: ${ALLOWED_TYPES.join('|')}. ` +
        `\`vp run coordination:claim\` produces a conforming name for you.`,
    ],
    exempt: false,
    warnings: [],
  };
};
