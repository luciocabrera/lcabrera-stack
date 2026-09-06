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
import { runGh } from '../../packages/repo-standards/scripts/gh-exec.mjs';

export const startsWithDash = (value) => String(value ?? '').startsWith('-');

const assertIsData = (field, value) => {
  if (startsWithDash(value)) {
    throw new Error(
      `${field} starts with a dash, which makes an unusable issue — got ${JSON.stringify(value)}`,
    );
  }
  return value;
};

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

const issueNumberFromUrl = (url) => Number(url.trim().split('/').at(-1));

export const createIssue = (issue, bodyPath, { dryRun, log }) => {
  const args = [
    'issue',
    'create',
    '--title',
    assertIsData(`issue ${issue.id} title`, issue.title),
    '--body-file',
    assertIsData(`issue ${issue.id} body path`, bodyPath),
    ...issue.labels.flatMap((label) => [
      '--label',
      assertIsData(`issue ${issue.id} label`, label),
    ]),
    ...(issue.milestone === ''
      ? []
      : [
          '--milestone',
          assertIsData(`issue ${issue.id} milestone`, issue.milestone),
        ]),
  ];
  log(`issue: ${issue.id} — ${issue.title}`);
  if (dryRun) {
    return 0;
  }
  return issueNumberFromUrl(runGh(args));
};

const issueDatabaseId = (number) =>
  Number(runGh(['api', `repos/:owner/:repo/issues/${number}`, '--jq', '.id']));

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
