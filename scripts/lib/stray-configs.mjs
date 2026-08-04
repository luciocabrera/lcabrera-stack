/**
 * Pure core of the stray formatter/linter config gate
 * (`scripts/verify-stray-configs.mjs`).
 *
 * This repo configures formatting and linting in exactly one place — the root
 * `vite.config.ts`, via `createFmtConfig`/`lintSharedConfig` (ADR-042). A
 * `.oxfmtrc.json` or `.prettierrc` sitting next to it is read by nothing, and
 * that is worse than untidy: the deleted root `.oxfmtrc.json` declared
 * `sortPackageJson: false` while the live config declares `true`, so the file a
 * reader would naturally open to learn the formatting policy stated the
 * opposite of the truth, and an edit to it changed nothing.
 *
 * The invariant is "no config file exists that no engine reads", checked by
 * NAME rather than by content: a decoy is defined by nothing loading it, and
 * there is no observable difference between a decoy whose values happen to
 * agree with the live config and one whose values contradict it — until
 * someone edits it. Matching on names is what makes the gate fail closed.
 *
 * Deliberately does NOT list `eslint.config.mjs` or `biome.jsonc`: both are
 * read. `.eslintignore` is listed because ESLint's flat config does not read it.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** Config files no engine in this toolchain reads. */
export const UNREAD_CONFIG_NAMES = new Set([
  '.claudelintignore',
  '.eslintignore',
  '.oxfmtrc.json',
  '.oxlintrc.json',
  '.prettierignore',
]);

/**
 * Prettier accepts a family of names (`.prettierrc`, `.prettierrc.json`,
 * `.prettierrc.yaml`, …), so a prefix rule covers the variants a set cannot.
 * Prettier is not a dependency of any workspace; the formatter is Oxfmt.
 */
const PRETTIER_RC_PREFIX = '.prettierrc';

/** Whether a bare filename is a config this toolchain never loads. (pure) */
export const isStrayConfig = (filename) =>
  UNREAD_CONFIG_NAMES.has(filename) || filename.startsWith(PRETTIER_RC_PREFIX);

/**
 * The offending entries among `paths`, preserving input order.
 *
 * Takes already-collected paths rather than walking itself, so the traversal
 * (an effect) stays in the gate and this half is testable without a fixture
 * tree on disk.
 */
export const strayConfigsIn = (paths) =>
  paths.filter((path) => isStrayConfig(path.slice(path.lastIndexOf('/') + 1)));
