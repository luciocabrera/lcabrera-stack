/*
 * Deciding whether a file still carries the merge-conflict markers git left.
 *
 * Git writes each marker at the start of a line: seven `<`, `|` or `>` followed
 * by a space and a label or by the end of the line, and seven `=` alone. That
 * much is what `git diff --check` looks for, and it misses a marker a Markdown
 * formatter has already rewritten: a closing marker parses as seven nested
 * block quotes and is printed back as `> ` repeated, a marker inside a table
 * becomes its first cell, one inside a list item is indented, and a separator
 * that would read as a heading underline is escaped with a backslash. Every
 * one of those forms is matched, because the formatter runs before any gate.
 *
 * Seven `=` alone is also a Markdown heading underline, so a separator only
 * counts in a file that also holds an opening, base or closing marker. A real
 * conflict always keeps one of those, and then every marker line is named.
 *
 * Pure: the CLI reads each file and hands in its bytes or its text.
 */

const ANCHOR_PATTERNS = [
  /^[ \t]*(?:<{7}|\|{7}|>{7})(?:[ \t]|$)/u,
  /^[ \t]*(?:> ){6}>(?:[ \t]|$)/u,
  /^[ \t]*\|[ \t]*(?:<{7}|>{7})(?:[ \t|]|$)/u,
];

const SEPARATOR_PATTERNS = [
  /^[ \t]*\\?={7}[ \t]*$/u,
  /^[ \t]*\|[ \t]*={7}(?:[ \t|]|$)/u,
];

const matchesAny = (patterns, line) =>
  patterns.some((pattern) => pattern.test(line));

const KINDS = [
  { kind: 'anchor', patterns: ANCHOR_PATTERNS },
  { kind: 'separator', patterns: SEPARATOR_PATTERNS },
];

export const markerKind = (line) =>
  KINDS.find(({ patterns }) => matchesAny(patterns, line))?.kind;

export const isBinaryContent = (bytes) => bytes.includes(0);

export const conflictMarkerLines = (text) => {
  const markers = text
    .split(/\r?\n/u)
    .map((line, index) => ({
      kind: markerKind(line),
      line: index + 1,
      text: line,
    }))
    .filter(({ kind }) => kind !== undefined);
  return markers.some(({ kind }) => kind === 'anchor')
    ? markers.map(({ line, text: marker }) => ({ line, text: marker }))
    : [];
};

export const formatFinding = ({ line, path, text }) =>
  `${path}:${line}: ${text.trim()}`;
