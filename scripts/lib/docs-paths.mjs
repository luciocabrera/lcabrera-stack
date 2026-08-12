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
export const normaliseToken = (token) =>
  trimTrailingPunctuation(token.split('#')[0].trim());

/**
 * The contents of every inline code span in a run of text — odd-indexed
 * segments of a split on the delimiter are the code.
 *
 * Splitting rather than matching across the delimiters is what keeps this
 * linear: the obvious regex for an inline span scans with unbounded
 * backtracking, a real cost on the largest documents here and flagged as
 * super-linear. Exported so the rename gate splits identically instead of
 * growing a second, subtly different notion of "inside backticks".
 */
export const inlineCodeTokens = (text) =>
  text.split('`').filter((_, index) => index % 2 === 1);

/**
 * Backticked tokens that are root-anchored paths, plus the targets of relative
 * markdown links. Fenced code blocks are skipped — they are examples, and the
 * paths inside them are illustrative far more often than not.
 */
export const extractCandidates = (markdown) => {
  // Odd-indexed segments sit between a pair of fences; keep the even ones.
  const prose = markdown
    .split('```')
    .filter((_, index) => index % 2 === 0)
    .join('\n');

  const backticked = inlineCodeTokens(prose)
    .map((token) => normaliseToken(token))
    .filter((token) => isRootAnchored(token));

  const linked = [...prose.matchAll(/\]\(([^)\s]{1,512})\)/g)]
    .map((match) => normaliseToken(match[1]))
    .filter(
      (token) =>
        !isDisqualified(token) &&
        (isRootAnchored(token) || token.endsWith('.md')),
    );

  return [...new Set([...backticked, ...linked])];
};

/**
 * A document that records a decision as of a date — an ADR, in any of the three
 * homes (ADR-048).
 */
export const isDatedRecord = (docPath) => docPath.includes('/decisions/');

/**
 * The tokens a document is still accountable for.
 *
 * Everywhere except a dated record, that is all of them. An ADR is different,
 * and the difference is what this gate previously got wrong in BOTH directions:
 * the whole corpus was exempted by an `IGNORED_DOCS` substring, so genuinely
 * dead links in ADRs went unreported — while simply un-exempting it would have
 * reported ~22 paths that are correct precisely because they are historical.
 * ADR-008 IS the record of the `@repo/api` → `@repo/data-access` rename, so
 * naming `packages/data-access` is its content, not a broken reference.
 *
 * The split is structural rather than a heuristic, and it follows the two
 * shapes `extractCandidates` already recognises:
 *
 *   - A **root-anchored token** is descriptive prose. An ADR naming a path is
 *     saying "this is what existed when the decision was made", which stays
 *     true after the path is deleted. Not enforced here.
 *   - A **relative markdown link** is navigational — a pointer the reader is
 *     invited to follow. It either resolves or it is dead, and a dated record
 *     has no more licence to ship a dead link than any other document. Enforced.
 *
 * A file move breaks the second kind and leaves the first untouched, which is
 * exactly the failure that motivated this: 20 ADRs moved up one directory level
 * and took four now-unresolvable relative links with them.
 */
export const enforcedTokens = (tokens, docPath) =>
  isDatedRecord(docPath)
    ? tokens.filter((token) => !isRootAnchored(token))
    : tokens;

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
