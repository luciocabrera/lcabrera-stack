/*
 * Deciding whether a tooling script is too big, and what to say about it.
 *
 * Nothing else governs these files. Path rules scoped to TS/TSX do not see them,
 * an eslint fan-out that runs per workspace never reaches a root `scripts/`, and
 * a per-FUNCTION complexity limit passes a 650-line file of small functions.
 * That gap is what let report generators grow unchecked.
 *
 * The measurement is CODE lines — non-blank, non-comment — so the "why" header
 * every script here should carry is free and only logic counts.
 *
 * Pure: callers hand in contents and a baseline and get findings back, so the
 * walking, printing and exit code live in the CLI.
 */

/**
 * Directories no scan of a repository's own files should ever descend into.
 *
 * Deliberately the SMALLEST defensible set: version control, installed
 * dependencies, and build output. Everything else a particular gate wants to
 * skip is that gate's judgement and belongs in its own configuration, because
 * the two gates reading this list do not agree about the rest — the size gate
 * skips a generated reports directory and an agent-config directory, and the
 * stray-config gate must walk both, since a config file nothing reads is exactly
 * the sort of thing that turns up in a repo-authored agent directory.
 *
 * Configuration EXTENDS this rather than replacing it. A consumer who wrote
 * their own list and forgot `node_modules` would not get a narrower gate, they
 * would get one that walks their whole dependency tree — a hang rather than a
 * verdict, and one that reads as the gate being slow rather than misconfigured.
 *
 * Adding an entry here narrows every gate at once, silently. A gate reading
 * fewer files reports exactly the same clean pass as a clean tree, so widening
 * this set is the one change in this module that cannot be caught by running it.
 */
export const ALWAYS_SKIPPED = [
  '.git',
  'node_modules',
  'build',
  'dist',
  'coverage',
  '.tmp',
];

/** A line carrying no logic: blank, or opening/continuing a comment. */
const isProse = (line) => /^\s*(\/\/|\/\*|\*|$)/.test(line);

export const countCodeLines = (content) =>
  content.split('\n').filter((line) => !isProse(line)).length;

/**
 * The blocking finding for one file, or undefined when it is within its limit.
 *
 * A grandfathered file is held to its RECORDED size, not to the ceiling: the
 * point of the baseline is that inherited debt may stay and may not grow.
 */
export const sizeProblem = ({ ceiling, file, grandfathered, lines }) => {
  if (lines <= (grandfathered ?? ceiling)) return undefined;
  return grandfathered === undefined
    ? `${file}: ${lines} code lines exceeds the ${ceiling} ceiling — split cohesive helpers into a sibling module.`
    : `${file}: ${lines} code lines exceeds its grandfathered ${grandfathered} — it grew. Shrink it, don't raise the baseline.`;
};

/**
 * A "rebaseline me" hint for a grandfathered file that shrank.
 *
 * Non-blocking on purpose. Making it fail would mean a change that improved a
 * file failed the gate, which teaches people not to improve the file.
 */
export const baselineWarning = ({ ceiling, file, grandfathered, lines }) => {
  if (grandfathered === undefined) return undefined;
  if (lines <= ceiling) {
    return `${file}: now ${lines} (≤ ${ceiling}) — remove its baseline entry with \`--write\`.`;
  }
  if (lines < grandfathered) {
    return `${file}: shrank to ${lines} (baseline ${grandfathered}) — ratchet down with \`--write\`.`;
  }
  return undefined;
};

/**
 * The baseline for a set of measurements: every file over the ceiling, at the
 * size it is now, keyed in a stable order so the JSON diff is reviewable.
 */
export const baselineFor = ({ ceiling, measured }) =>
  Object.fromEntries(
    measured
      .filter(({ lines }) => lines > ceiling)
      .toSorted((a, b) => a.file.localeCompare(b.file))
      .map(({ file, lines }) => [file, lines]),
  );

/** Every finding for a measured set, blocking and advisory kept apart. */
export const findingsFor = ({ baseline, ceiling, measured }) => ({
  problems: measured
    .map(({ file, lines }) =>
      sizeProblem({ ceiling, file, grandfathered: baseline[file], lines }),
    )
    .filter(Boolean),
  warnings: measured
    .map(({ file, lines }) =>
      baselineWarning({ ceiling, file, grandfathered: baseline[file], lines }),
    )
    .filter(Boolean),
});
