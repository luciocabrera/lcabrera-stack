/**
 * Pure half of the documented-path gate: decide which tokens in a markdown file
 * are meant to be real repository paths.
 *
 * Precision is the whole problem, not detection. A naive "resolve every
 * backticked token" pass produces ~830 hits on this repo, of which the large
 * majority are conventions rather than paths — suffix patterns (`.types.ts`),
 * teaching placeholders (`ComponentName.tsx`), shell commands, npm specifiers,
 * URL fragments, prose like `try/catch`, and relative component references that
 * only resolve with extension probing. A gate that cries wolf gets bypassed,
 * which is worse than no gate.
 *
 * So this deliberately trades recall for precision and recognises exactly two
 * shapes that cannot be anything but a repository path:
 *
 *   1. **Root-anchored paths** — the token starts with a real top-level
 *      directory (`apps/`, `packages/`, `scripts/`, …). This is the shape that
 *      actually caused the damage: AGENTS.md listed ten `apps/*` directories of
 *      which six did not exist.
 *   2. **Relative markdown links** — `[text](../foo/bar.md)`, an explicit
 *      pointer whose target either resolves or is a dead link.
 *
 * Everything else is left to review. Widening this is safe to do later; the
 * baseline exists so a widening can land without a cleanup blocking it.
 */

/** Real top-level directories — the anchor that makes a token unambiguous. */
const REPO_ROOTS = new Set([
  '.claude',
  '.github',
  '.vite-hooks',
  'apps',
  'docker',
  'docs',
  'packages',
  'reports',
  'scripts',
]);

/** Shapes that are never a path: globs, regexes, placeholders, commands. */
const isDisqualified = (token) =>
  token === '' ||
  /\s/.test(token) ||
  /[*?{}[\]<>\\|]/.test(token) ||
  token.startsWith('/') ||
  token.startsWith('#') ||
  /^[a-z]+:\/\//i.test(token);

/** A token anchored at a real top-level directory. */
export const isRootAnchored = (token) => {
  if (isDisqualified(token) || !token.includes('/')) {
    return false;
  }
  return REPO_ROOTS.has(token.split('/')[0]);
};

/** Punctuation a sentence leaves attached to a path it just named. */
const TRAILING_PUNCTUATION = new Set(['.', ',', ':', ';', ')']);

/** Peel that punctuation one character at a time — linear, and no backtracking. */
const trimTrailingPunctuation = (value) =>
  TRAILING_PUNCTUATION.has(value.at(-1) ?? '')
    ? trimTrailingPunctuation(value.slice(0, -1))
    : value;

/** Strip a heading anchor and trailing sentence punctuation. */
const normalise = (token) =>
  trimTrailingPunctuation(token.split('#')[0].trim());

/**
 * Backticked tokens that are root-anchored paths, plus the targets of relative
 * markdown links. Fenced code blocks are skipped — they are examples, and the
 * paths inside them are illustrative far more often than not.
 *
 * Splitting on the delimiters rather than matching across them keeps this
 * linear. The obvious regexes for a fenced block and an inline span both scan
 * with unbounded backtracking, which is a real cost on the largest documents
 * here and is flagged as super-linear.
 */
export const extractCandidates = (markdown) => {
  // Odd-indexed segments sit between a pair of fences; keep the even ones.
  const prose = markdown
    .split('```')
    .filter((_, index) => index % 2 === 0)
    .join('\n');

  // Likewise for inline spans: odd-indexed segments are the code.
  const backticked = prose
    .split('`')
    .filter((_, index) => index % 2 === 1)
    .map((token) => normalise(token))
    .filter((token) => isRootAnchored(token));

  const linked = [...prose.matchAll(/\]\(([^)\s]{1,512})\)/g)]
    .map((match) => normalise(match[1]))
    .filter(
      (token) =>
        !isDisqualified(token) &&
        (isRootAnchored(token) || token.endsWith('.md')),
    );

  return [...new Set([...backticked, ...linked])];
};

/**
 * `@lcabrera/pkg/sub` or `@repo/pkg/sub` → its parts, so the caller can check
 * the exports map.
 *
 * Two scopes on purpose: `@lcabrera/*` is the published product (ui, api,
 * server, utils) and `@repo/*` is internal tooling that never ships. Both live
 * at `packages/<name>`, so one pattern covers them. Matching only one scope
 * would silently stop validating half the specifiers the docs name — which
 * reports exactly the same clean pass as having nothing to validate.
 */
export const parseWorkspaceSpecifier = (token) => {
  const match = /^@(?:lcabrera|repo)\/([^/]+)(?:\/(.+))?$/.exec(token);
  return match === null
    ? undefined
    : { packageName: match[1], subpath: match[2] };
};
