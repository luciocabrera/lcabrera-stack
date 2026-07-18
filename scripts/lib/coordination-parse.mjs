/**
 * Pure parsing helpers for the coordination register, extracted from
 * `verify-coordination.mjs` so that script stays under the size ceiling and its
 * effects (fs, git) stay separated from this logic. Everything here is pure —
 * same input, same output, no I/O. See `.claude/rules/scripts.md`.
 */

/** An indented `- item` line → its text, or undefined. */
const readListItem = (raw) => {
  const trimmed = raw.trimStart();
  return raw !== trimmed && trimmed.startsWith('- ')
    ? trimmed.slice(2).trim()
    : undefined;
};

/** A column-0 `key: value` line → {key, value}, or undefined. Uses indexOf, not
 *  a `\s*(.*)` regex, which backtracks super-linearly on runs of spaces. */
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

/**
 * A frontmatter parser small enough to own: scalars are `key: value`, and a
 * `key:` with an empty value opens a `- item` list. No deeper nesting is allowed
 * by the register schema, so nothing more is needed. Returns undefined when the
 * source has no `---` frontmatter block. Parses with `indexOf`/`startsWith`
 * rather than backtracking-prone regexes.
 */
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

/** Two glob heads match when either is `*` or they are the same literal. */
const headsMatch = (x, y) => x === '*' || y === '*' || x === y;

/** `**` (head of `star`) matches zero or more segments of `other`. */
const starStarIntersects = (star, other) =>
  segmentsIntersect(star.slice(1), other) ||
  (other.length > 0 && segmentsIntersect(star, other.slice(1)));

/**
 * Glob intersection over path segments: `*` matches one segment, `**` matches
 * zero or more. True when some concrete path could match both globs — exactly
 * the question "do these two areas overlap?". `**` is checked before the empty
 * cases so `['**']` still intersects `[]`.
 */
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

/** A git branch name → its descriptor filename slug (`feat/big` → `feat-big`). */
export const branchSlug = (branch) => branch.replaceAll(/[^\w-]+/g, '-');
