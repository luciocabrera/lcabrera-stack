/**
 * Pure parsing helpers for the coordination register, extracted from
 * `verify-coordination.mjs` so that script stays under the size ceiling and its
 * effects (fs, git) stay separated from this logic. Everything here is pure —
 * same input, same output, no I/O. See `.claude/rules/scripts.md`.
 */

/**
 * A frontmatter parser small enough to own: scalars are `key: value`, and a
 * `key:` with an empty value opens a `- item` list. No deeper nesting is allowed
 * by the register schema, so nothing more is needed. Returns undefined when the
 * source has no `---` frontmatter block.
 */
export const parseFrontmatter = (source) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  if (match === null) {
    return undefined;
  }
  const data = {};
  let listKey;
  for (const raw of match[1].split('\n')) {
    const item = /^\s+-\s+(.*)$/.exec(raw);
    if (item !== null && listKey !== undefined) {
      data[listKey].push(item[1].trim());
      continue;
    }
    const pair = /^([A-Za-z]\w*):\s*(.*)$/.exec(raw);
    if (pair === null) {
      continue;
    }
    const [, key, value] = pair;
    if (value === '') {
      data[key] = [];
      listKey = key;
      continue;
    }
    data[key] = value.trim();
    listKey = undefined;
  }
  return data;
};

/**
 * Glob intersection over path segments: `*` matches one segment, `**` matches
 * zero or more. True when some concrete path could match both globs — exactly
 * the question "do these two areas overlap?".
 */
const segmentsIntersect = (a, b) => {
  if (a.length === 0 && b.length === 0) {
    return true;
  }
  if (a[0] === '**') {
    return (
      segmentsIntersect(a.slice(1), b) ||
      (b.length > 0 && segmentsIntersect(a, b.slice(1)))
    );
  }
  if (b[0] === '**') {
    return (
      segmentsIntersect(a, b.slice(1)) ||
      (a.length > 0 && segmentsIntersect(a.slice(1), b))
    );
  }
  if (a.length === 0 || b.length === 0) {
    return false;
  }
  if (a[0] === '*' || b[0] === '*' || a[0] === b[0]) {
    return segmentsIntersect(a.slice(1), b.slice(1));
  }
  return false;
};

export const globsOverlap = (x, y) =>
  segmentsIntersect(
    x.replace(/^\.\//, '').split('/'),
    y.replace(/^\.\//, '').split('/'),
  );

/** A git branch name → its descriptor filename slug (`feat/big` → `feat-big`). */
export const branchSlug = (branch) => branch.replace(/[^\w-]+/g, '-');
