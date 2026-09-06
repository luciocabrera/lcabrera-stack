/**
 * The mechanical half of .claude/pr-queue-policy.md — every §2 gate and every §5
 * trigger that can be decided from the queue facts alone, with no judgement.
 *
 * Why this exists rather than leaving it all to the model: the stop list is the
 * operator's leash, and a leash a model can reason its way around is not one.
 * What this file returns is therefore a CEILING. The model may move a verdict
 * toward ESCALATE, never past it toward ENQUEUE — so a deleted test escalates
 * even if the model finds the deletion reasonable, and that property is testable
 * here without invoking anything.
 *
 * The verdict vocabulary is closed. A value outside policy §1 is not a weaker
 * verdict but no verdict at all, so the ceiling refuses it instead of ranking it
 * by a list position it does not have.
 *
 * The split inside §5 is deliberate. A `stop` is mechanically certain (the diff
 * removes a test file). A `flag` is "a §5 area is touched" — a migration, a
 * public manifest — which needs the diff read before it is either confirmed as a
 * stop or discharged with a probe. Flags exist so the bias toward action does not
 * turn every brush with a risky path into a permanent block.
 *
 * `OPERATOR_FILES` is enumerated rather than pattern-matched, and is not
 * maintained by hand: the `S9 covers every file the operator imports` case in
 * the sibling test walks the real import graph and fails when the two disagree.
 *
 * `forbiddenActions` bounds landing a pull request in two structurally opposite
 * ways. The FLAG vocabulary of `gh pr merge` is closed — A5 authorises
 * `gh pr merge <n> --squash` and nothing else — so that half is an ALLOW-LIST,
 * which rejects every other form including flags gh has not shipped yet. A
 * deny-list of flags did not hold there: it named `--merge` and `--rebase`
 * while gh also spells them `-m` and `-r`, and each missed spelling was
 * admitted in silence. Which TRANSPORT writes the protected branch is open —
 * gh, curl, git itself — so those shapes stay a DENY-LIST keyed on the endpoint
 * path, the mutation name and the push destination.
 *
 * That second half CANNOT BE COMPLETE, and this is the honest statement of what
 * it is. It refuses the operations that name themselves in plain text; it does
 * not see one whose text does not name it — a path or ref held in a variable, a
 * script file, an encoded string, or the next spelling nobody has written down.
 * Adding shapes narrows the gap and never closes it. So what this bounds is the
 * decision TEXT, which is the audited artifact, best-effort. It is not
 * containment: a decision-time audit cannot constrain what the apply pass runs.
 * That is the apply pass's own tool list, and #1040 records it.
 *
 * Governed by .claude/rules/scripts.md.
 */

const TEST_FILE = /(?:^|\/)[^/]*\.(?:test|spec)\.[cm]?[jt]sx?$/;
const SUPPRESSIONS_FILE = /(?:^|\/)eslint-suppressions\.json$/;
const MIGRATION_FILE = /(?:^|\/)migrations\//;
const CHANGESET_FILE = /^\.changeset\/(?!README)[^/]+\.md$/;
const PUBLISH_WORKFLOW = /^\.github\/workflows\/(?:release|publish|changelog)/;
const ENV_FILE = /(?:^|\/)\.env(?:\.|$)|^docker\/local\//;
export const OPERATOR_FILES = new Set([
  '.claude/pr-queue-policy.md',
  'packages/repo-standards/scripts/branch-exemption.mjs',
  'packages/repo-standards/scripts/cli-input.mjs',
  'packages/repo-standards/scripts/commit-convention.mjs',
  'packages/repo-standards/scripts/config-tree-gates.mjs',
  'packages/repo-standards/scripts/config-values.mjs',
  'packages/repo-standards/scripts/config.mjs',
  'packages/repo-standards/scripts/public-package-dirs.mjs',
  'packages/repo-standards/scripts/error-message.mjs',
  'packages/repo-standards/scripts/gh-exec.mjs',
  'packages/repo-standards/scripts/host-root.mjs',
  'packages/repo-standards/scripts/review-threads.mjs',
  'packages/repo-standards/scripts/safe-read.mjs',
  'packages/repo-standards/scripts/workspace-scopes.mjs',
  'scripts/lib/pr-queue-claude.mjs',
  'scripts/lib/pr-queue-execute.mjs',
  'scripts/lib/pr-queue-facts.mjs',
  'scripts/lib/pr-queue-gate.mjs',
  'scripts/lib/pr-queue-github.mjs',
  'scripts/lib/pr-queue-log.mjs',
  'scripts/lib/pr-queue-order.mjs',
  'scripts/pr-queue-operator.mjs',
]);

const has = (pr, pattern) => pr.files.some((file) => pattern.test(file.path));

const inPublicPackage = (path, packages) =>
  packages === undefined || packages.length === 0
    ? /^packages\/[^/]+\//u.test(path)
    : packages.some((dir) => path.startsWith(`${dir}/`));

const touchesPublicPackage = (pr, packages) =>
  pr.files.some((file) => inPublicPackage(file.path, packages));

const touchesPublicManifest = (pr, packages) =>
  pr.files.some(
    (file) =>
      file.path.endsWith('/package.json') &&
      inPublicPackage(file.path, packages),
  );

const ejectedSinceHeadMoved = (pr) =>
  pr.queue.ejectedAt !== '' && pr.queue.ejectedAt > pr.headCommittedAt;

const parenthesised = (text) => (text === '' ? '' : ` (${text})`);

const ejectionDetail = (queue) =>
  `the merge queue removed this pull request${parenthesised(queue.ejectedReason)} and the head has not moved since — read the merge group's checks before queueing it again`;

const queuedDetail = (queue) =>
  `already in the merge queue${parenthesised(queue.state)} — any action here removes it and starts the wait again`;

const removedFile = (pr, pattern) =>
  pr.files.some(
    (file) =>
      pattern.test(file.path) && file.additions === 0 && file.deletions > 0,
  );

export const detectStops = (pr) =>
  [
    pr.files.length === 0 && {
      detail: 'the PR changes no files — nothing to merge',
      id: 'S7',
    },
    removedFile(pr, TEST_FILE) && {
      detail: `test file removed: ${pr.files
        .filter((file) => TEST_FILE.test(file.path) && file.additions === 0)
        .map((file) => file.path)
        .join(', ')}`,
      id: 'S2',
    },
    pr.mergeable === 'CONFLICTING' && {
      detail: 'the PR conflicts with its base',
      id: 'S3',
    },
    has(pr, ENV_FILE) && {
      detail: 'the diff touches env or credential material',
      id: 'S4',
    },
    has(pr, SUPPRESSIONS_FILE) && {
      detail: 'the diff touches a lint suppressions register',
      id: 'S5',
    },
    has(pr, PUBLISH_WORKFLOW) && {
      detail: 'the diff touches the release or publish workflow path',
      id: 'S8',
    },
    pr.files.some((file) => OPERATOR_FILES.has(file.path)) && {
      detail: 'the PR modifies the queue operator or its own policy',
      id: 'S9',
    },
  ].filter(Boolean);

export const detectFlags = (pr, packages) =>
  [
    has(pr, MIGRATION_FILE) && {
      detail:
        'a migration is in the diff — confirm no existing column, table or constraint is altered or dropped',
      id: 'S1',
    },
    touchesPublicManifest(pr, packages) && {
      detail:
        'a public package manifest changed — confirm the exports map, version and peer ranges are untouched',
      id: 'S1',
    },
    has(pr, CHANGESET_FILE) && {
      detail: 'a changeset is in the diff — confirm it is not major',
      id: 'S8',
    },
    touchesPublicPackage(pr, packages) && {
      detail:
        'a never-baseline package changed — confirm no export was removed or narrowed and no suppression was added',
      id: 'S1',
    },
    has(pr, TEST_FILE) && {
      detail:
        'tests changed — confirm no case was removed, skipped or narrowed',
      id: 'S2',
    },
    ejectedSinceHeadMoved(pr) && {
      detail: ejectionDetail(pr.queue),
      id: 'S11',
    },
  ].filter(Boolean);

export const detectBlockers = (pr, conformance) =>
  [
    pr.isDraft && {
      detail: 'draft — A9 forbids the operator marking it ready',
      id: 'E1',
      verdict: 'WAIT',
    },
    pr.mergeable === 'UNKNOWN' && {
      detail: 'GitHub has not finished computing mergeability',
      id: 'E2',
      verdict: 'WAIT',
    },
    pr.checks.failed.length > 0 && {
      detail: `failing: ${pr.checks.failed.map((check) => check.name).join(', ')} — classify per A2/A3 before acting; an assertion failure is neither`,
      id: 'E3',
      verdict: 'ACT',
    },
    pr.checks.pending.length > 0 && {
      detail: `still running: ${pr.checks.pending.map((check) => check.name).join(', ')}`,
      id: 'E3',
      verdict: 'WAIT',
    },
    pr.checks.all.length === 0 && {
      detail:
        'no checks reported at all — a green rollup cannot be inferred from an empty one',
      id: 'E3',
      verdict: 'ESCALATE',
    },
    pr.threads.unresolved.length > 0 && {
      detail: `${pr.threads.unresolved.length} unresolved review thread(s) — address per A4`,
      id: 'E4',
      verdict: 'ACT',
    },
    pr.reviewDecision === 'CHANGES_REQUESTED' && {
      detail: 'a reviewer requested changes',
      id: 'E5',
      verdict: 'ACT',
    },
    conformance?.body?.length > 0 && {
      detail: `PR body fails the enforced template: ${conformance.body.join('; ')}`,
      id: 'E6',
      verdict: 'ACT',
    },
    conformance?.title?.length > 0 && {
      detail: `PR title is not a Conventional Commit: ${conformance.title.join('; ')}`,
      id: 'E7',
      verdict: 'ACT',
    },
    !pr.queue.enabled &&
      pr.mergeStateStatus === 'BEHIND' && {
        detail: 'the branch is behind its base — update per A1',
        id: 'E10',
        verdict: 'ACT',
      },
    pr.queue.queued && {
      detail: queuedDetail(pr.queue),
      id: 'E11',
      verdict: 'WAIT',
    },
  ].filter(Boolean);

export const PRECEDENCE = Object.freeze(['ESCALATE', 'ACT', 'WAIT', 'ENQUEUE']);

const VERDICTS = new Set(PRECEDENCE);

export const isVerdict = (value) => VERDICTS.has(value);

const strictest = (verdicts) =>
  PRECEDENCE.find((verdict) => verdicts.includes(verdict)) ?? 'ENQUEUE';

export const evaluateGate = (pr, conformance, packages) => {
  const stops = detectStops(pr);
  const blockers = detectBlockers(pr, conformance);
  const flags = detectFlags(pr, packages);
  const verdict =
    stops.length > 0
      ? 'ESCALATE'
      : strictest(blockers.map((blocker) => blocker.verdict));
  return { blockers, flags, stops, verdict };
};

const MERGE_SUBCOMMAND = /\bgh\s+pr\s+merge\b/u;

const AUTHORISED_LANDING = /^gh\s+pr\s+merge\s+\d+\s+--squash$/u;

const UNAUTHORISED_LANDING =
  '`gh pr merge` in any form but `gh pr merge <n> --squash`, which A5 authorises and this matches as an allow-list — so `--admin` (past the queue and past every required check, and the operator account can), `--auto` (`enablePullRequestAutoMerge` under another name), `-d`/`--delete-branch` (a deletion for a merge that has not happened yet), `-m`/`--merge`, `-r`/`--rebase` (not the permitted method: `--squash` keeps the PR title as the commit subject the changelog reads), `--repo`, a `#42` or URL spelling of the pull request, and any flag gh adds later are all rejected without being enumerated';

const PROTECTED_BRANCH = 'main';

const PROTECTED_REFS = new Set([
  PROTECTED_BRANCH,
  `refs/heads/${PROTECTED_BRANCH}`,
]);

const PUSH_COMMAND = /\bgit\s+push\b([^\n;&|]*)/gu;

const destinationOf = (token) =>
  token.replaceAll(/["']/gu, '').replace(/^\+/u, '').split(':').at(-1);

const pushDestinations = (args) =>
  args
    .split(/\s+/u)
    .filter((token) => token !== '' && !token.startsWith('-'))
    .slice(1)
    .map((token) => destinationOf(token));

const pushesToProtectedBranch = (command) =>
  [...command.matchAll(PUSH_COMMAND)].some(([, args]) =>
    pushDestinations(args).some((ref) => PROTECTED_REFS.has(ref)),
  );

const PUSH_TO_PROTECTED =
  'a `git push` whose destination refspec is `main` writes the protected branch with no pull request in the operation at all — past the queue, past every required check and past the squash — and the operator account is a ruleset bypass actor, so it succeeds. A1 pushes the head branch and A7 deletes it (`git push origin --delete <branch>`); neither names this destination. A push that reaches `main` under a name this cannot read — a refspec in a variable, a configured `push.default` — is the residual this deny-list cannot close';

const FORBIDDEN_SHAPES = [
  {
    pattern: /\brepos\/[^\s/]+\/[^\s/]+\/pulls\/[^\s/]+\/merge\b/u,
    reason:
      'the REST merge endpoint lands a pull request directly, past the merge queue and past every required check exactly as `--admin` does, and the operator account is a ruleset bypass actor. Its path segments are matched unread, so a shell variable in place of the number is the same endpoint. A5 authorises `gh pr merge <n> --squash` and nothing else',
  },
  {
    pattern: /\brepos\/[^\s/]+\/[^\s/]+\/merges\b/u,
    reason:
      'the REST branch-merge endpoint puts a head branch into a base branch with no pull request in the operation at all, so it lands the work past the queue, past every required check and past the squash. A5 authorises `gh pr merge <n> --squash` and nothing else',
  },
  {
    pattern: /\brepos\/[^\s/]+\/[^\s/]+\/git\/refs\b/u,
    reason:
      'the REST git-refs endpoint repoints a branch directly — `--method PATCH …/git/refs/heads/main -f sha=…` puts any commit on the protected branch with no pull request, no queue and no required check in the operation. The whole path family is refused rather than the protected ref alone, because these segments are matched unread too and a ref held in a shell variable is the same endpoint; A7 deletes a head branch with `git push origin --delete <branch>`, which is admitted',
  },
  {
    pattern: /\b(?:mergePullRequest|enablePullRequestAutoMerge|mergeBranch)\b/u,
    reason:
      'the GraphQL merge mutations land a pull request, or a branch, outside the one audited command, and auto-merge lands it with no pass observing the result. A5 authorises `gh pr merge <n> --squash` and nothing else',
  },
  {
    pattern: /\benqueuePullRequest\b/u,
    reason:
      'the GraphQL enqueue mutation puts a pull request into the merge queue outside the one audited command, and its `jump` argument puts that entry at the head of the queue ahead of everything already waiting. A5 authorises `gh pr merge <n> --squash` and nothing else',
  },
  {
    pattern: /\b(?:createRef|updateRef|deleteRef|createCommitOnBranch)\b/u,
    reason:
      'the GraphQL ref mutations are the git-refs endpoint reached through the other transport: `updateRef` repoints a branch and `createCommitOnBranch` puts a commit on one, both with no pull request in the operation. A5 authorises `gh pr merge <n> --squash` and nothing else',
  },
];

const forbiddenReasons = (command) => [
  ...(MERGE_SUBCOMMAND.test(command) && !AUTHORISED_LANDING.test(command)
    ? [UNAUTHORISED_LANDING]
    : []),
  ...(pushesToProtectedBranch(command) ? [PUSH_TO_PROTECTED] : []),
  ...FORBIDDEN_SHAPES.filter(({ pattern }) => pattern.test(command)).map(
    ({ reason }) => reason,
  ),
];

export const forbiddenActions = (actions) =>
  (actions ?? []).flatMap((action) => {
    const command = action.command ?? '';
    return forbiddenReasons(command.trim()).map((reason) => ({
      command,
      reason,
    }));
  });

export const isWithinCeiling = (ceiling, proposed) =>
  isVerdict(ceiling) &&
  isVerdict(proposed) &&
  PRECEDENCE.indexOf(proposed) <= PRECEDENCE.indexOf(ceiling);
