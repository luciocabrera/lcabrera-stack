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
 *
 * A third shape — a workspace specifier resolved through the package's `exports`
 * map — was claimed here and unreachable; making it real is #864.
 */

/** Shapes that are never a path: globs, regexes, placeholders, commands. */
const isDisqualified = (token) =>
  token === '' ||
  /\s/.test(token) ||
  /[*?{}[\]<>\\|]/.test(token) ||
  token.startsWith('/') ||
  token.startsWith('#') ||
  /^[a-z]+:\/\//i.test(token);

export const isRootAnchored = (token, repoRoots) => {
  if (isDisqualified(token) || !token.includes('/')) {
    return false;
  }
  return repoRoots.includes(token.split('/')[0]);
};

const isExplicitlyRelative = (token) => /^\.\.?\//.test(token);

const TRAILING_PUNCTUATION = new Set(['.', ',', ':', ';', ')']);

const trimTrailingPunctuation = (value) =>
  TRAILING_PUNCTUATION.has(value.at(-1) ?? '')
    ? trimTrailingPunctuation(value.slice(0, -1))
    : value;

export const normaliseToken = (token) =>
  trimTrailingPunctuation(token.split('#')[0].trim());

export const inlineCodeTokens = (text) =>
  text.split('`').filter((_, index) => index % 2 === 1);

export const extractCandidates = (markdown, repoRoots) => {
  const prose = markdown
    .split('```')
    .filter((_, index) => index % 2 === 0)
    .join('\n');

  const backticked = inlineCodeTokens(prose)
    .map((token) => normaliseToken(token))
    .filter((token) => isRootAnchored(token, repoRoots));

  const linked = [...prose.matchAll(/\]\(([^)\s]{1,512})\)/g)]
    .map((match) => normaliseToken(match[1]))
    .filter(
      (token) =>
        !isDisqualified(token) &&
        (isRootAnchored(token, repoRoots) ||
          isExplicitlyRelative(token) ||
          token.endsWith('.md')),
    );

  return [...new Set([...backticked, ...linked])];
};

export const isDatedRecord = (docPath) => docPath.includes('/decisions/');

export const enforcedTokens = ({ docPath, repoRoots, tokens }) =>
  isDatedRecord(docPath)
    ? tokens.filter((token) => !isRootAnchored(token, repoRoots))
    : tokens;
