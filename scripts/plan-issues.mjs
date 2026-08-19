/**
 * Checks a planning backlog against everything GitHub will enforce on it, and
 * emits ready-to-create issue bodies.
 *
 * Why this exists: a planning session's backlog is prose, and creating it by
 * hand loses on three counts nothing catches until after the fact — a body that
 * misses a required section is rejected by `issue-standards.yml` on open, a
 * hand-typed label silently creates one outside the taxonomy in
 * `lib/labels.mjs`, and a milestone whose title differs by one dash becomes a
 * second milestone. So the checkable part is checked here, offline, before any
 * issue exists, and `--create` runs only once nothing would be rejected.
 *
 * Usage:
 *   node scripts/plan-issues.mjs                     verify the default backlog
 *   node scripts/plan-issues.mjs --plan <file>       verify another document
 *   node scripts/plan-issues.mjs --emit <dir>        write bodies + manifest
 *   node scripts/plan-issues.mjs --create --dry-run  preview every gh call
 *   node scripts/plan-issues.mjs --create            create milestones + issues
 *
 * Exit codes: 0 = every issue would be accepted, 1 = at least one would not.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { flagValue } from '../packages/repo-standards/scripts/cli-input.mjs';
import { validateIssueBody } from '../packages/repo-standards/scripts/commit-convention.mjs';
import { buildLabelDefinitions } from './lib/labels.mjs';
import {
  createIssue,
  createMilestones,
  linkPlannedChildren,
} from './lib/plan-issues-github.mjs';
import { parseMilestoneNames, parsePlan } from './lib/plan-issues-parse.mjs';
import {
  knownLabels,
  renderIssueBody,
  unknownLabels,
} from './lib/plan-issues-render.mjs';
import { deriveWorkspaces } from '../packages/repo-standards/scripts/workspace-scopes.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
/**
 * There is no default planning document, and that is deliberate: ADR-036 makes
 * GitHub Issues the durable backlog, so a tracked file that always holds "the
 * backlog" would be a second one. A plan is authored for one session, consumed
 * by `--create`, and retired. Keep the working copy under `.tmp/planning/`.
 */
const PLAN_REQUIRED =
  'no planning document given. Pass --plan <file>; there is no tracked default, ' +
  'because GitHub Issues are the durable backlog (ADR-036) and a plan is a ' +
  'one-shot input. Keep the working copy under .tmp/planning/.';
const MILESTONE_SCHEME = 'docs/agents/milestone-naming-scheme.md';
/** Gitignored, per the repo's scratch convention. */
const STAGING_DIR = '.tmp/plan-issues';

/**
 * A path that stays inside the repository, or a refusal.
 *
 * `--emit` reaches this from the command line, so a traversal would otherwise
 * steer `mkdirSync`/`writeFileSync` anywhere the process can reach. Canonicalise
 * first, then check containment — comparing the raw string cannot see `..`.
 */
const withinRoot = (relativePath) => {
  const target = resolve(REPO_ROOT, relativePath);
  if (target !== REPO_ROOT && !target.startsWith(REPO_ROOT + sep)) {
    throw new Error(
      `refusing to use a path outside the repository: ${relativePath}`,
    );
  }
  return target;
};

const readRepoFile = (relativePath) =>
  readFileSync(withinRoot(relativePath), 'utf8');

/** Every label name the taxonomy defines for this repo, in one flat list. */
const allowedLabelNames = () =>
  buildLabelDefinitions(deriveWorkspaces(REPO_ROOT)).map(({ name }) => name);

/**
 * The checks a record must survive. Each returns a list of problems, so one
 * issue reports everything wrong with it rather than only the first thing.
 */
const auditRecord = (record, { allowed, milestones, source }) => {
  const body = renderIssueBody(record, source);
  const strays = unknownLabels(record.labels, allowed);
  return {
    record,
    body,
    errors: validateIssueBody(body).errors,
    warnings: [
      strays.length === 0
        ? ''
        : `labels outside the taxonomy, dropped: ${strays.join(', ')}`,
      record.milestone === ''
        ? 'no milestone — the naming scheme requires one'
        : '',
      record.milestone !== '' && !milestones.includes(record.milestone)
        ? `milestone "${record.milestone}" is not in the naming scheme`
        : '',
    ].filter((warning) => warning !== ''),
  };
};

/**
 * The creation plan: what `--create` walks, and what `--emit` writes for review.
 * Labels are narrowed to the taxonomy here, so a stray name in the document can
 * never reach `gh` and create a label outside `lib/labels.mjs`.
 */
const buildManifest = (audits, milestones, allowed) => ({
  milestones,
  issues: audits.map(({ record }) => ({
    id: record.id,
    kind: record.kind,
    title: record.title,
    labels: knownLabels(record.labels, allowed),
    milestone: record.milestone,
    parent: record.dependencies.parent ?? null,
    children: record.dependencies.children,
    bodyFile: `${record.id}.md`,
  })),
});

/** Epics before the issues that name them as parent, so linking has a target. */
const creationOrder = (audits) =>
  [...audits].sort(
    (left, right) =>
      Number(left.record.kind !== 'epic') -
      Number(right.record.kind !== 'epic'),
  );

const emit = (directory, manifest, audits) => {
  const target = withinRoot(directory);
  mkdirSync(target, { recursive: true });
  for (const { record, body } of audits) {
    writeFileSync(join(target, `${record.id}.md`), `${body}\n`);
  }
  writeFileSync(
    join(target, 'manifest.json'),
    `${JSON.stringify(manifest, undefined, 2)}\n`,
  );
  return target;
};

/**
 * Creates the milestones, then the issues in epic-first order, then the
 * sub-issue links. Ordering matters: a link needs both ends to exist, and an
 * epic is always an end.
 */
const create = (manifest, directory, dryRun) => {
  const log = (message) => console.log(`  ${dryRun ? '+ ' : ''}${message}`);
  const milestones = createMilestones(manifest.milestones, { dryRun, log });
  console.log(
    `Milestones: ${milestones.created.length} created, ${milestones.skipped} already present.`,
  );

  const numbers = new Map(
    manifest.issues.map((issue) => [
      issue.id,
      createIssue(issue, join(directory, issue.bodyFile), { dryRun, log }),
    ]),
  );
  console.log(`Issues: ${numbers.size} created.`);

  const linked = linkPlannedChildren(manifest.issues, numbers, { dryRun, log });
  console.log(`Sub-issue links: ${linked} attached.`);
};

const report = (audits) => {
  for (const { record, errors, warnings } of audits) {
    for (const error of errors) {
      console.error(`  ✗ ${record.id}: ${error}`);
    }
    for (const warning of warnings) {
      console.warn(`  ⚠ ${record.id}: ${warning}`);
    }
  }
};

const main = () => {
  const planPath = flagValue('--plan');
  if (planPath === undefined) {
    throw new Error(PLAN_REQUIRED);
  }
  const milestones = parseMilestoneNames(readRepoFile(MILESTONE_SCHEME));
  const records = parsePlan(readRepoFile(planPath), {
    milestoneNames: milestones,
  });

  if (records.length === 0) {
    console.error(`No issues found in ${planPath}.`);
    process.exitCode = 1;
    return;
  }

  const context = {
    allowed: allowedLabelNames(),
    milestones,
    source: planPath,
  };
  const audits = creationOrder(
    records.map((record) => auditRecord(record, context)),
  );
  const broken = audits.filter(({ errors }) => errors.length > 0);

  console.log(
    `Planning backlog ${planPath}: ${records.length} issue(s), ` +
      `${records.filter(({ kind }) => kind === 'epic').length} epic(s), ` +
      `${milestones.length} milestone(s).`,
  );
  report(audits);

  if (broken.length > 0) {
    console.error(
      `\n${broken.length} issue(s) would be rejected by issue-standards.yml. ` +
        'Fix the planning document, not the gate.',
    );
    process.exitCode = 1;
    return;
  }
  console.log('Every issue would be accepted by the issue gate.');

  const wantsCreate = process.argv.includes('--create');
  const emitDirectory = flagValue('--emit') ?? (wantsCreate ? STAGING_DIR : '');
  if (emitDirectory === '') {
    return;
  }

  const manifest = buildManifest(audits, milestones, context.allowed);
  const target = emit(emitDirectory, manifest, audits);
  console.log(
    `\nWrote ${audits.length} body file(s) + manifest.json → ${emitDirectory}`,
  );

  if (wantsCreate) {
    const dryRun = process.argv.includes('--dry-run');
    console.log(
      dryRun ? '\nDry run — no GitHub calls:' : '\nCreating on GitHub:',
    );
    create(manifest, target, dryRun);
  }
};

try {
  main();
} catch (error) {
  console.error(`plan-issues: ${error.message}`);
  process.exitCode = 1;
}
