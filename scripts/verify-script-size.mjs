/**
 * Caps the size of build/tooling scripts (`.mjs` / `.cjs`), which nothing else
 * governs. The `.claude/rules/` conventions are scoped to TS/TSX files only; the
 * eslint fan-out is per-workspace and never reaches root `scripts/`; and fallow's
 * `maxUnitSize` is per-FUNCTION, so a 650-line file of small functions passes it.
 * That blind spot is how the report generators grew to 400–650 lines.
 *
 * The metric is CODE lines — non-blank, non-comment — so a thorough JSDoc header
 * (which every script here should have) is free, and only real logic counts. A
 * script over the ceiling wants splitting: extract cohesive helpers into a
 * sibling module and import them, the `.mjs` analogue of the one-util-per-file
 * rule. See `.claude/rules/scripts.md`.
 *
 * Inherited debt is grandfathered in `scripts/script-size-baseline.json`
 * (eslint-suppressions semantics): a baselined file may not GROW past its
 * recorded size, a non-baselined file may not exceed the ceiling, and shrinking
 * one below the ceiling should drop its entry. Regenerate with `--write` — the
 * JSON diff is reviewed, so accepting new debt is a visible, deliberate act.
 *
 * Usage (from the repo root):
 *   node scripts/verify-script-size.mjs            # verify (default)
 *   node scripts/verify-script-size.mjs --write    # regenerate the baseline
 *
 * Exit codes: 0 = every script is within its limit, 1 = at least one breaches.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const BASELINE = 'scripts/script-size-baseline.json';
const MAX_CODE_LINES = 350;
const SKIP_DIRS = new Set([
  'node_modules',
  'build',
  'dist',
  '.react-router',
  '.tmp',
  'coverage',
  'reports',
  '.git',
]);

/** Every `.mjs`/`.cjs` under the repo, repo-relative, excluding SKIP_DIRS. */
const findScripts = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return SKIP_DIRS.has(entry.name) ? [] : findScripts(full);
    }
    return /\.[mc]js$/.test(entry.name) ? [relative(REPO_ROOT, full)] : [];
  });

/** Non-blank, non-comment-only lines — logic, not prose or whitespace. */
const countCodeLines = (file) =>
  readFileSync(join(REPO_ROOT, file), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*|$)/.test(line)).length;

const readBaseline = () => {
  try {
    return JSON.parse(readFileSync(join(REPO_ROOT, BASELINE), 'utf8'));
  } catch {
    return {};
  }
};

const measure = () =>
  findScripts(REPO_ROOT)
    .map((file) => ({ file, lines: countCodeLines(file) }))
    .sort((a, b) => b.lines - a.lines);

const writeBaseline = (measured) => {
  const over = measured.filter(({ lines }) => lines > MAX_CODE_LINES);
  const baseline = Object.fromEntries(
    [...over]
      .sort((a, b) => a.file.localeCompare(b.file))
      .map(({ file, lines }) => [file, lines]),
  );
  writeFileSync(
    join(REPO_ROOT, BASELINE),
    `${JSON.stringify(baseline, null, 2)}\n`,
  );
  console.log(
    `Wrote ${BASELINE}: ${over.length} script(s) over ${MAX_CODE_LINES} code lines grandfathered.`,
  );
};

const verify = (measured) => {
  const baseline = readBaseline();
  const problems = [];
  const warnings = [];

  for (const { file, lines } of measured) {
    const allowed = baseline[file] ?? MAX_CODE_LINES;
    if (lines > allowed) {
      problems.push(
        baseline[file] === undefined
          ? `${file}: ${lines} code lines exceeds the ${MAX_CODE_LINES} ceiling — split cohesive helpers into a sibling module (see .claude/rules/scripts.md).`
          : `${file}: ${lines} code lines exceeds its grandfathered ${allowed} — it grew. Shrink it, don't raise the baseline.`,
      );
    } else if (baseline[file] !== undefined && lines <= MAX_CODE_LINES) {
      warnings.push(
        `${file}: now ${lines} (≤ ${MAX_CODE_LINES}) — remove its baseline entry with \`--write\`.`,
      );
    } else if (baseline[file] !== undefined && lines < baseline[file]) {
      warnings.push(
        `${file}: shrank to ${lines} (baseline ${baseline[file]}) — ratchet down with \`--write\`.`,
      );
    }
  }

  for (const warning of warnings) {
    console.error(
      process.env.GITHUB_ACTIONS === 'true'
        ? `::warning::${warning}`
        : `  ⚠ ${warning}`,
    );
  }

  if (problems.length > 0) {
    console.error(
      `\nScript-size gate — ${problems.length} file(s) too large:\n`,
    );
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    console.error(
      '\nKeep tooling scripts focused. See `.claude/rules/scripts.md`.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Script-size gate passed: ${measured.length} script(s), ` +
      `${Object.keys(readBaseline()).length} grandfathered, ceiling ${MAX_CODE_LINES}.`,
  );
};

try {
  const measured = measure();
  if (process.argv.includes('--write')) {
    writeBaseline(measured);
  } else {
    verify(measured);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
