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
import { NO_BRANCH } from './coordination-parse.mjs';

const PULL_PATH = '/pull/';
const DIGITS = /^\d+$/;
const QUOTES = /["']/g;

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

const headRefOf = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text !== '' && !NO_BRANCH.has(text) ? text : undefined;
};

const isTemplate = ({ name }) => name.startsWith('_');

const claims = (data, prNumber, headRef) =>
  (prNumber !== undefined && prNumberOf(data.pr) === prNumber) ||
  (headRef !== undefined && data.branch === headRef);

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
