/**
 * The mechanical half of .claude/pr-queue-policy.md — every §2 gate and every §5
 * trigger that can be decided from the queue facts alone, with no judgement.
 *
 * Why this exists rather than leaving it all to the model: the stop list is the
 * operator's leash, and a leash a model can reason its way around is not one.
 * What this file returns is therefore a CEILING. The model may move a verdict
 * toward ESCALATE, never past it toward MERGE — so a deleted test escalates even
 * if the model finds the deletion reasonable, and that property is testable here
 * without invoking anything.
 *
 * The split inside §5 is deliberate. A `stop` is mechanically certain (the diff
 * removes a test file). A `flag` is "a §5 area is touched" — a migration, a
 * public manifest — which needs the diff read before it is either confirmed as a
 * stop or discharged with a probe. Flags exist so the bias toward action does not
 * turn every brush with a risky path into a permanent block.
 *
 * Governed by .claude/rules/scripts.md.
 */

const TEST_FILE = /(?:^|\/)[^/]*\.(?:test|spec)\.[cm]?[jt]sx?$/;
const SUPPRESSIONS_FILE = /(?:^|\/)eslint-suppressions\.json$/;
const MIGRATION_FILE = /(?:^|\/)migrations\//;
const CHANGESET_FILE = /^\.changeset\/(?!README)[^/]+\.md$/;
const PUBLISH_WORKFLOW = /^\.github\/workflows\/(?:release|publish|changelog)/;
const ENV_FILE = /(?:^|\/)\.env(?:\.|$)|^docker\/local\//;
const OPERATOR_FILE =
  /^(?:\.claude\/pr-queue-policy\.md|scripts\/pr-queue-operator\.mjs|scripts\/lib\/pr-queue-[a-z-]+\.mjs)$/;

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

/** A path present in the diff with no additions left — the file is gone. */
const removed = (pr, pattern) =>
  pr.files.some(
    (file) =>
      pattern.test(file.path) && file.additions === 0 && file.deletions > 0,
  );

/** §5 triggers provable from the file list alone. The model cannot clear these. */
export const detectStops = (pr) =>
  [
    pr.files.length === 0 && {
      detail: 'the PR changes no files — nothing to merge',
      id: 'S7',
    },
    removed(pr, TEST_FILE) && {
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
    has(pr, OPERATOR_FILE) && {
      detail: 'the PR modifies the queue operator or its own policy',
      id: 'S9',
    },
  ].filter(Boolean);

/** §5 areas the diff touches that need reading before a verdict (see header). */
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
  ].filter(Boolean);

/**
 * §2 eligibility. Each blocker carries the verdict it forces, because "unresolved
 * threads" and "a check is still queued" are both "not eligible" and want
 * opposite responses — one is work to do now, the other is work to not do.
 */
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
    pr.mergeStateStatus === 'BEHIND' && {
      detail: 'the branch is behind its base — update per A1',
      id: 'E10',
      verdict: 'ACT',
    },
  ].filter(Boolean);

const PRECEDENCE = ['ESCALATE', 'ACT', 'WAIT', 'MERGE'];

/** The strictest verdict present — escalate outranks act outranks wait. */
const strictest = (verdicts) =>
  PRECEDENCE.find((verdict) => verdicts.includes(verdict)) ?? 'MERGE';

/**
 * The mechanical ceiling for one PR.
 *
 * `flags` never lower the verdict on their own — they are questions the model
 * must answer, and it answers them by escalating or by recording the probe that
 * discharges them. An unanswered flag is S10 at the model layer, not here.
 */
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

/** True when the model's verdict is at or below the mechanical ceiling. */
export const isWithinCeiling = (ceiling, proposed) =>
  PRECEDENCE.indexOf(proposed) <= PRECEDENCE.indexOf(ceiling);
