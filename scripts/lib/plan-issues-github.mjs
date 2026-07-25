/**
 * The `gh` half of `plan-issues.mjs`: milestones, issues, and the parent/child
 * links that make an epic an epic.
 *
 * Why the linking step exists at all: `docs/tooling/github-planning.md` defines
 * an epic as an issue with real **sub-issues**, not a prose list of children,
 * but nothing in the repo created them — so every backlog written so far had to
 * be wired by hand in the UI. Sub-issues attach by database id rather than
 * issue number, which is the detail that makes this worth having in code.
 */
import { runGh } from './gh-exec.mjs';

/** Titles of the milestones that already exist, so a re-run is idempotent. */
export const existingMilestones = () =>
  JSON.parse(
    runGh([
      'api',
      'repos/:owner/:repo/milestones',
      '--paginate',
      '--jq',
      '[.[].title]',
    ]),
  );

/** Creates the milestones the scheme defines and GitHub does not have yet. */
export const createMilestones = (wanted, { dryRun, log }) => {
  const present = dryRun ? [] : existingMilestones();
  const missing = wanted.filter((title) => !present.includes(title));
  for (const title of missing) {
    log(`milestone: ${title}`);
    if (!dryRun) {
      runGh(['api', 'repos/:owner/:repo/milestones', '-f', `title=${title}`]);
    }
  }
  return { created: missing, skipped: wanted.length - missing.length };
};

/** `gh issue create` prints the new issue's URL; the number is its last segment. */
const issueNumberFromUrl = (url) => Number(url.trim().split('/').at(-1));

/**
 * Creates one issue and returns its number. Labels are passed individually
 * rather than comma-joined: a label name here can legitimately contain a comma,
 * and `--label a,b` would split it into two labels that do not exist.
 */
export const createIssue = (issue, bodyPath, { dryRun, log }) => {
  const args = [
    'issue',
    'create',
    '--title',
    issue.title,
    '--body-file',
    bodyPath,
    ...issue.labels.flatMap((label) => ['--label', label]),
    ...(issue.milestone === '' ? [] : ['--milestone', issue.milestone]),
  ];
  log(`issue: ${issue.id} — ${issue.title}`);
  if (dryRun) {
    return 0;
  }
  return issueNumberFromUrl(runGh(args));
};

/** The REST database id for an issue number — what the sub-issue API wants. */
const issueDatabaseId = (number) =>
  Number(runGh(['api', `repos/:owner/:repo/issues/${number}`, '--jq', '.id']));

/**
 * Attaches `childNumber` under `parentNumber` as a real sub-issue. Already-
 * attached children make the API 422; that is a re-run, not a failure, so it is
 * reported and skipped rather than aborting the remaining links.
 */
export const linkSubIssue = (
  { parentId, childId, parentNumber, childNumber },
  { dryRun, log },
) => {
  const reference = (id, number) => (dryRun ? id : `${id} (#${number})`);
  log(
    `link: ${reference(childId, childNumber)} → parent ${reference(parentId, parentNumber)}`,
  );
  if (dryRun) {
    return true;
  }
  try {
    runGh([
      'api',
      `repos/:owner/:repo/issues/${parentNumber}/sub_issues`,
      '-F',
      `sub_issue_id=${issueDatabaseId(childNumber)}`,
    ]);
    return true;
  } catch (error) {
    log(`  skipped: ${error.message}`);
    return false;
  }
};

/**
 * Wires every parent/child pair the plan declares. `numbers` maps a planning id
 * (`P-01`) to the real issue number; a pair naming an id that was not created
 * in this run is skipped, so a partial run still links what it can.
 */
export const linkPlannedChildren = (issues, numbers, options) => {
  const pairs = issues.flatMap((issue) =>
    issue.children
      .filter((child) => numbers.has(child) && numbers.has(issue.id))
      .map((child) => ({
        parentId: issue.id,
        childId: child,
        parentNumber: numbers.get(issue.id),
        childNumber: numbers.get(child),
      })),
  );
  return pairs.filter((pair) => linkSubIssue(pair, options)).length;
};
