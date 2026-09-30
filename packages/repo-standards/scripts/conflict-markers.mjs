/*
 * Deciding whether a line is a merge-conflict marker git left behind.
 *
 * Git writes each marker at the start of a line: seven `<`, `|` or `>` followed
 * by a space and a label or by the end of the line, and seven `=` alone. That
 * much is what `git diff --check` looks for, and it misses a marker a Markdown
 * formatter has already rewritten. A closing marker parses as seven nested
 * block quotes and is printed back as `> ` repeated, and a marker inside a
 * table is folded into the table as its first cell. Both reshaped forms are
 * matched here too, because the formatter runs before any gate does.
 *
 * Pure: callers hand in each file's text, so the reading and the git call stay
 * in the CLI.
 */

const MARKER_PATTERNS = [
  /^(?:<{7}|\|{7}|>{7})(?:[ \t]|$)/u,
  /^={7}[ \t]*$/u,
  /^(?:> ){6}>(?:[ \t]|$)/u,
  /^\|[ \t]*(?:<{7}|={7}|>{7})(?:[ \t|]|$)/u,
];

export const isConflictMarker = (line) =>
  MARKER_PATTERNS.some((pattern) => pattern.test(line));

const isBinaryText = (text) => text.includes('\0');

export const conflictMarkerLines = (text) =>
  text
    .split(/\r?\n/u)
    .map((line, index) => ({ line: index + 1, text: line }))
    .filter(({ text: line }) => isConflictMarker(line));

export const conflictMarkersIn = (files) =>
  files
    .filter(({ text }) => !isBinaryText(text))
    .flatMap(({ path, text }) =>
      conflictMarkerLines(text).map((marker) => ({ ...marker, path })),
    );

export const formatFinding = ({ line, path, text }) =>
  `${path}:${line}: ${text.trim()}`;
