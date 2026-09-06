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
 * Which files count is `isToolingScript`, and it follows the file rather than
 * the extension: `.mjs` and `.cjs` anywhere, plus `.js`, `.ts`, `.mts` and
 * `.cts` under a `scripts/` directory — the set `.claude/rules/scripts.md`
 * binds. Extension alone would let a script leave the ceiling by being renamed,
 * and a gate measuring fewer files reports the same clean pass as a clean tree.
 *
 * Pure: callers hand in contents and a baseline and get findings back, so the
 * walking, printing and exit code live in the CLI.
 *
 * `ALWAYS_SKIPPED` is deliberately the SMALLEST defensible set: version
 * control, installed dependencies, build output. Everything else a gate wants
 * to skip is that gate's judgement, because the two gates reading this do not
 * agree about the rest. Configuration EXTENDS it rather than replacing it,
 * since a consumer who wrote their own list and forgot `node_modules` would
 * get a hang rather than a narrower gate. Adding an entry narrows every gate
 * at once, silently — a gate reading fewer files reports the same clean pass
 * as a clean tree, so widening this set is the one change here that running it
 * cannot catch.
 */

export const ALWAYS_SKIPPED = [
  '.git',
  'node_modules',
  'build',
  'dist',
  'coverage',
  '.tmp',
];

const ANYWHERE_EXTENSIONS = ['.mjs', '.cjs'];
const SCRIPTS_DIRECTORY_EXTENSIONS = ['.js', '.ts', '.mts', '.cts'];
const SCRIPTS_DIRECTORY = 'scripts';

const endsWithOneOf = ({ extensions, path }) =>
  extensions.some((extension) => path.endsWith(extension));

export const isToolingScript = (posixPath) =>
  endsWithOneOf({ extensions: ANYWHERE_EXTENSIONS, path: posixPath }) ||
  (posixPath.split('/').slice(0, -1).includes(SCRIPTS_DIRECTORY) &&
    endsWithOneOf({
      extensions: SCRIPTS_DIRECTORY_EXTENSIONS,
      path: posixPath,
    }));

const isProse = (line) => /^\s*(\/\/|\/\*|\*|$)/.test(line);

export const countCodeLines = (content) =>
  content.split('\n').filter((line) => !isProse(line)).length;

export const sizeProblem = ({ ceiling, file, grandfathered, lines }) => {
  if (lines <= (grandfathered ?? ceiling)) return undefined;
  return grandfathered === undefined
    ? `${file}: ${lines} code lines exceeds the ${ceiling} ceiling — split cohesive helpers into a sibling module.`
    : `${file}: ${lines} code lines exceeds its grandfathered ${grandfathered} — it grew. Shrink it, don't raise the baseline.`;
};

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

export const baselineFor = ({ ceiling, measured }) =>
  Object.fromEntries(
    measured
      .filter(({ lines }) => lines > ceiling)
      .toSorted((a, b) => a.file.localeCompare(b.file))
      .map(({ file, lines }) => [file, lines]),
  );

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
