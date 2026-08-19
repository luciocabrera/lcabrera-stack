/**
 * Which coordination task files a merged PR closes — the matching half of
 * close-on-merge. Rule 12 ends with "delete the task file when the work merges"
 * and that step is reliably forgotten, which leaves a soft lock nobody holds and
 * sends the next agent around work that already landed.
 *
 * Pure: no fs, no git, no process — the deletion lives in
 * `scripts/close-coordination-claim.mjs` and the commit in
 * `.github/workflows/coordination-close.yml`. See `.claude/rules/scripts.md`.
 */
import { NO_BRANCH } from '../../packages/repo-standards/scripts/coordination-parse.mjs';

const PULL_PATH = '/pull/';
// Anchored, single quantifier — nothing here can backtrack (S8786).
const DIGITS = /^\d+$/;
const QUOTES = /["']/g;

/**
 * A `pr:` field → its number, or undefined when it names no PR.
 *
 * The register spells the same thing five ways — `#521`, `'#521'`, a bare `521`,
 * a full `…/pull/58` URL, and the `(none)` placeholder — because several tools
 * and agents have written that line. Comparing the raw string against a merged
 * PR number matches none of them, and "matched nothing" is indistinguishable
 * from "this PR had no claim": the automation would fail in the direction nobody
 * can see. Normalising first is what makes the two outcomes distinguishable.
 */
export const prNumberOf = (value) => {
  if (value === undefined || value === null || Array.isArray(value)) {
    return undefined;
  }
  const text = String(value).replaceAll(QUOTES, '').trim();
  const marker = text.lastIndexOf(PULL_PATH);
  const tail = marker === -1 ? text : text.slice(marker + PULL_PATH.length);
  const digits = (tail.startsWith('#') ? tail.slice(1) : tail).split('/')[0];
  return DIGITS.test(digits) ? Number(digits) : undefined;
};

/** A head ref → itself, or undefined when it is blank or a register placeholder
 *  (`(none)`/`(worktree)`), which must never match a task's `branch:`. */
const headRefOf = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text !== '' && !NO_BRANCH.has(text) ? text : undefined;
};

/** `_TEMPLATE.md` (and any `_`-prefixed file) is register scaffolding, never a
 *  claim — it must survive every close, whatever its frontmatter says. */
const isTemplate = ({ name }) => name.startsWith('_');

const claims = (data, prNumber, headRef) =>
  (prNumber !== undefined && prNumberOf(data.pr) === prNumber) ||
  (headRef !== undefined && data.branch === headRef);

/**
 * The task entries a merged PR closes: those recording its number in `pr:` OR
 * naming its head ref in `branch:`. Either signal alone is enough — a claim
 * made before its PR existed still carries `pr: (none)`, so the branch is the
 * only thing tying it to the merge.
 *
 * Returns an empty list for a PR nothing claimed, and never returns a template.
 */
export const tasksClosedBy = ({ entries, headRef, prNumber }) => {
  const pr = prNumberOf(prNumber);
  const ref = headRefOf(headRef);
  if (pr === undefined && ref === undefined) {
    return [];
  }
  return entries.filter(
    (entry) =>
      !isTemplate(entry) &&
      entry.data !== undefined &&
      claims(entry.data, pr, ref),
  );
};
