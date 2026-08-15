/**
 * Admissibility and consistency —
 * `docs/agents/agent-review-contract.md` §2.4 steps 5 and 6.
 *
 * Step 5 asks whether each finding is anchored and evidenced well enough to be
 * one; step 6 asks whether the single field the gate reads agrees with what the
 * document actually shows. Both yield `error`, and neither repairs anything: the
 * contract is explicit that a validator which downgrades a finding, drops it, or
 * recomputes `verdict` from the findings has become a second reviewer with no
 * contract of its own.
 *
 * That is why there is no "recompute" branch below, and why a `pass` carrying an
 * admissible blocking finding produces `error` rather than the `fail` a
 * recomputation would produce.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { isAddedLine } from './agent-review-diff.mjs';

/** §3: these two block; `medium` and `low` never do. */
const BLOCKING_SEVERITIES = new Set(['critical', 'high']);

const isFilledString = (value) =>
  typeof value === 'string' && value.trim() !== '';

/** §2.4 step 5, for one finding. (pure) */
const admissibilityErrors = (finding, index, at) => {
  const errors = [];
  if (BLOCKING_SEVERITIES.has(finding.severity)) {
    if (!isFilledString(finding.refutation)) {
      errors.push(
        `${at} is \`${finding.severity}\` and carries no \`refutation\` (§2.4 step 5)`,
      );
    }
    if (!isFilledString(finding.failure_scenario)) {
      errors.push(
        `${at} is \`${finding.severity}\` and carries no \`failure_scenario\` (§2.4 step 5)`,
      );
    }
  }
  if (finding.kind === 'omission') {
    if (finding.line !== null) {
      errors.push(`${at} is an \`omission\` and its \`line\` is not null`);
    }
    if (!isFilledString(finding.rule)) {
      errors.push(`${at} is an \`omission\` and cites no \`rule\``);
    }
    return errors;
  }
  if (index.unreadable.has(finding.file)) {
    errors.push(
      `${at} cites \`${finding.file}\`, whose patch this pull request did not expose — the anchor cannot be checked`,
    );
    return errors;
  }
  if (!isAddedLine(index, finding.file, finding.line)) {
    errors.push(
      `${at} is \`in-diff\` but \`${finding.file}\` line ${finding.line} is not a line this diff added`,
    );
  }
  return errors;
};

/**
 * §2.4 step 5 across the document. Runs after the shape check, so every finding
 * already has the id these messages name. (pure)
 */
export const findingsAdmissibilityErrors = (findings, index) =>
  findings.flatMap((finding) =>
    admissibilityErrors(finding, index, `finding \`${finding.id}\``),
  );

/** The ids of the findings whose severity blocks. (pure) */
export const blockingFindingIds = (findings) =>
  findings
    .filter((finding) => BLOCKING_SEVERITIES.has(finding.severity))
    .map((finding) => finding.id);

/** Ids rendered for a message, so the messages need no nested template. (pure) */
const quotedIds = (ids) => ids.map((id) => `\`${id}\``).join(', ');

/**
 * §2.4 step 6 — `verdict` against what the document shows.
 *
 * Runs only once every finding is admissible, so "an admissible blocking
 * finding" and "a blocking finding" are the same set by this point. (pure)
 */
export const consistencyErrors = (document) => {
  const blocking = blockingFindingIds(document.findings);
  const errors = [];
  if (document.verdict === 'fail' && blocking.length === 0) {
    errors.push(
      '`verdict` is `fail` with no admissible blocking finding (§2.4 step 6)',
    );
  }
  if (document.verdict === 'pass' && blocking.length > 0) {
    errors.push(
      `\`verdict\` is \`pass\` while carrying blocking finding(s) ${quotedIds(blocking)} (§2.4 step 6)`,
    );
  }
  const unmet = (document.criteria ?? [])
    .filter((criterion) => criterion.outcome === 'not-met')
    .map((criterion) => criterion.id);
  if (document.verdict === 'pass' && unmet.length > 0) {
    errors.push(
      `\`verdict\` is \`pass\` while criterion/criteria ${quotedIds(unmet)} are \`not-met\` (§2.4 step 6)`,
    );
  }
  return errors;
};
