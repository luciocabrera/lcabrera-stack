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
 * Seven `=` alone is also a Markdown setext or reStructuredText heading
 * underline, and this bin has no allowance register. In a file that holds an
 * opening, base or closing marker every marker line is named. Without one, a
 * bare separator is named unless it is heading-shaped: an underline below a
 * text line and above a blank line or the end, or an overline whose title is
 * followed by its matching underline. A separator left between the two sides of
 * a resolved conflict sits between text lines, so it is named. The escaped form
 * is only ever printed for a separator that is not a heading, so it is named on
 * its own; a separator folded into a table cell still needs a marker beside it.
 *
 * Pure: the CLI reads each file and hands in its bytes or its text.
 */

const ANCHOR_PATTERNS = [
  /^[ \t]*(?:<{7}|\|{7}|>{7})(?:[ \t]|$)/u,
  /^[ \t]*(?:> ){6}>(?:[ \t]|$)/u,
  /^[ \t]*\|[ \t]*(?:<{7}|>{7})(?:[ \t|]|$)/u,
];

const BARE_SEPARATOR = /^[ \t]*={7}[ \t]*$/u;
const ESCAPED_SEPARATOR = /^[ \t]*\\={7}[ \t]*$/u;
const TABLE_SEPARATOR = /^[ \t]*\|[ \t]*={7}(?:[ \t|]|$)/u;

const SEPARATOR_PATTERNS = [BARE_SEPARATOR, ESCAPED_SEPARATOR, TABLE_SEPARATOR];

const matchesAny = (patterns, line) =>
  patterns.some((pattern) => pattern.test(line));

const KINDS = [
  { kind: 'anchor', patterns: ANCHOR_PATTERNS },
  { kind: 'separator', patterns: SEPARATOR_PATTERNS },
];

export const markerKind = (line) =>
  KINDS.find(({ patterns }) => matchesAny(patterns, line))?.kind;

export const isBinaryContent = (bytes) => bytes.includes(0);

const isBlank = (line) => line === undefined || line.trim() === '';

const isBareSeparator = (line) =>
  line !== undefined && BARE_SEPARATOR.test(line);

const isUnderline = (lines, index) =>
  !isBlank(lines[index - 1]) && isBlank(lines[index + 1]);

const isOverline = (lines, index) =>
  index >= 0 &&
  isBlank(lines[index - 1]) &&
  !isBlank(lines[index + 1]) &&
  isBareSeparator(lines[index + 2]);

const isHeadingShaped = (lines, index) =>
  isUnderline(lines, index) ||
  isOverline(lines, index) ||
  isOverline(lines, index - 2);

const isReportedAlone = (lines, index) =>
  ESCAPED_SEPARATOR.test(lines[index]) ||
  (isBareSeparator(lines[index]) && !isHeadingShaped(lines, index));

export const conflictMarkerLines = (text) => {
  const lines = text.split(/\r?\n/u);
  const markers = lines
    .map((line, index) => ({ index, kind: markerKind(line), line }))
    .filter(({ kind }) => kind !== undefined);
  const hasAnchor = markers.some(({ kind }) => kind === 'anchor');
  return markers
    .filter(({ index }) => hasAnchor || isReportedAlone(lines, index))
    .map(({ index, line }) => ({ line: index + 1, text: line }));
};

export const formatFinding = ({ line, path, text }) =>
  `${path}:${line}: ${text.trim()}`;
