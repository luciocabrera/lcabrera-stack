/**
 * Pure parsing helpers for the coordination register, extracted from
 * `verify-coordination.mjs` so that script stays under the size ceiling and its
 * effects (fs, git) stay separated from this logic. Everything here is pure —
 * same input, same output, no I/O. See `.claude/rules/scripts.md`.
 */

/** `branch:` values that name no branch. Lives here, not in a caller, because
 *  three consumers now read the same vocabulary (the verifier, the merged-drift
 *  reconciliation, and the close-on-merge resolver) and a private copy in any
 *  one of them would drift silently. */
export const NO_BRANCH = new Set(['(uncommitted)', '(none)', '(worktree)']);

export const NO_PR = new Set(['(none)', '']);

const readListItem = (raw) => {
  const trimmed = raw.trimStart();
  return raw !== trimmed && trimmed.startsWith('- ')
    ? trimmed.slice(2).trim()
    : undefined;
};

const readPair = (raw) => {
  const colon = raw.indexOf(':');
  if (colon <= 0 || raw.startsWith(' ') || raw.startsWith('\t')) {
    return undefined;
  }
  const key = raw.slice(0, colon);
  return /^[A-Za-z]\w*$/.test(key)
    ? { key, value: raw.slice(colon + 1).trim() }
    : undefined;
};

export const parseFrontmatter = (source) => {
  if (!source.startsWith('---\n')) {
    return undefined;
  }
  const end = source.indexOf('\n---', 4);
  if (end === -1) {
    return undefined;
  }
  const data = {};
  let listKey;
  for (const raw of source.slice(4, end).split('\n')) {
    const item = readListItem(raw);
    if (item !== undefined && listKey !== undefined) {
      data[listKey].push(item);
      continue;
    }
    const pair = readPair(raw);
    if (pair === undefined) {
      continue;
    }
    data[pair.key] = pair.value === '' ? [] : pair.value;
    listKey = pair.value === '' ? pair.key : undefined;
  }
  return data;
};

const headsMatch = (x, y) => x === '*' || y === '*' || x === y;

const starStarIntersects = (star, other) =>
  segmentsIntersect(star.slice(1), other) ||
  (other.length > 0 && segmentsIntersect(star, other.slice(1)));

const segmentsIntersect = (a, b) => {
  if (a[0] === '**') {
    return starStarIntersects(a, b);
  }
  if (b[0] === '**') {
    return starStarIntersects(b, a);
  }
  if (a.length === 0 || b.length === 0) {
    return a.length === 0 && b.length === 0;
  }
  return headsMatch(a[0], b[0])
    ? segmentsIntersect(a.slice(1), b.slice(1))
    : false;
};

export const globsOverlap = (x, y) =>
  segmentsIntersect(
    x.replace(/^\.\//, '').split('/'),
    y.replace(/^\.\//, '').split('/'),
  );

export const branchSlug = (branch) => branch.replaceAll(/[^\w-]+/g, '-');
