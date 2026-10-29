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
 *   2. **Relative link targets** — `[text](../foo/bar.md)`, `[data](facts.json)`,
 *      and the reference-style definition `[label]: ../foo/bar.md`: any link
 *      target with no URL scheme is an explicit pointer whose target either
 *      resolves or is a dead link, whatever its extension.
 *
 * Everything else is left to review. Widening this is safe to do later; the
 * baseline exists so a widening can land without a cleanup blocking it.
 *
 * A third shape — a workspace specifier resolved through the package's `exports`
 * map — was claimed here and unreachable; making it real is #864.
 */

const hasScheme = (token) => /^[a-z][\d+.a-z-]*:/i.test(token);

const isDisqualified = (token) =>
  token === '' ||
  /\s/.test(token) ||
  /[*?{}[\]<>\\|]/.test(token) ||
  token.startsWith('/') ||
  token.startsWith('#') ||
  hasScheme(token);

export const isRootAnchored = (token, repoRoots) => {
  return (
    !isDisqualified(token) &&
    token.includes('/') &&
    repoRoots.includes(token.split('/', 1)[0])
  );
};

const TRAILING_PUNCTUATION = new Set([')', ',', '.', ':', ';']);

const trimTrailingPunctuation = (value) =>
  TRAILING_PUNCTUATION.has(value.at(-1) ?? '')
    ? trimTrailingPunctuation(value.slice(0, -1))
    : value;

export const normaliseToken = (token) =>
  trimTrailingPunctuation(token.split('#', 1)[0].trim());

export const inlineCodeTokens = (text) =>
  text.split('`').filter((_, index) => index % 2 === 1);

const DEFINITION_LABEL = /^\[(?:[^\n[\\\]]|\\.)+\]:/;

const TITLE_CLOSERS = new Map([
  ["'", "'"],
  ['"', '"'],
  ['(', ')'],
]);

const definitionRest = (line) => {
  const unindented = line.replace(/^ {0,3}/, '');
  if (unindented.startsWith(' ') || unindented.startsWith('\t')) {
    return;
  }
  const body = unindented.replace(/^>[\t >]*/, '');
  const label = DEFINITION_LABEL.exec(body)?.[0];
  return label === undefined || body.startsWith('[^')
    ? undefined
    : body.slice(label.length).trim();
};

const isTitleOrEmpty = (text) =>
  text === '' ||
  (text.length > 1 && TITLE_CLOSERS.get(text[0]) === text.at(-1));

const splitDestination = (rest) => {
  if (rest.startsWith('<')) {
    const end = rest.indexOf('>');
    return end === -1
      ? undefined
      : { remainder: rest.slice(end + 1), target: rest.slice(1, end) };
  }
  const [target] = rest.split(/[\t ]/, 1);
  return { remainder: rest.slice(target.length), target };
};

const destinationOf = (rest) => {
  const split = splitDestination(rest);
  return split !== undefined &&
    split.target !== '' &&
    isTitleOrEmpty(split.remainder.trim())
    ? split.target
    : undefined;
};

const definitionTarget = (line, nextLine = '') => {
  const rest = definitionRest(line);
  if (rest === undefined) {
    return;
  }
  return destinationOf(rest === '' ? nextLine.trim() : rest);
};

const referenceDefinitionTargets = (prose) => {
  const lines = prose.split('\n');
  return lines
    .map((line, index) => definitionTarget(line, lines[index + 1]))
    .filter((target) => target !== undefined);
};

export const extractCandidates = (markdown, repoRoots) => {
  const prose = markdown
    .split('```')
    .filter((_, index) => index % 2 === 0)
    .join('\n');

  const backticked = inlineCodeTokens(prose)
    .map((token) => normaliseToken(token))
    .filter((token) => isRootAnchored(token, repoRoots));

  const linked = prose
    .matchAll(/\]\(([^)\s]{1,512})\)/g)
    .map((match) => normaliseToken(match[1]))
    .filter((token) => !isDisqualified(token))
    .toArray();

  const defined = referenceDefinitionTargets(prose)
    .map((target) => normaliseToken(target))
    .filter((token) => !isDisqualified(token));

  return [...new Set([...backticked, ...linked, ...defined])];
};

export const isDatedRecord = (docPath) => docPath.includes('/decisions/');

export const enforcedTokens = ({ docPath, repoRoots, tokens }) =>
  isDatedRecord(docPath)
    ? tokens.filter((token) => !isRootAnchored(token, repoRoots))
    : tokens;
