/**
 * Lists the tracked paths a root test suite can read, so a test can assert that
 * `gates.affectedTests.rootSuites` selects the suite for every one of them
 * instead of trusting a hand-kept roster. It scans the suite's sources for
 * relative specifiers, repo-relative path literals, `join(REPO_ROOT, …)` calls
 * and imports of a workspace package, then follows relative imports into
 * modules outside the suite and scans those by the same rules. A path computed
 * at runtime is invisible to it, so it over-reads literals and can still miss a
 * computed read.
 *
 * Usage: `suiteInputs({ graph, readSource, suiteDir, tracked })`, from a test.
 */
import { posix } from 'node:path';

const SOURCE = /\.(?:mjs|cjs|js)$/u;
const QUOTES = new Set(["'", '"', '`']);
const WORD_CHAR = /^[\w$]$/u;
const SPECIFIER_CALLS = new Set(['import', 'require']);
const PATH_CALLS = new Set(['join', 'resolve']);
const REGEX_KEYWORDS = new Set(['return', 'typeof', 'case', 'of', 'in']);

const closingQuote = (source, from, quote) => {
  let index = from;
  let clean = true;
  while (index < source.length && source[index] !== quote) {
    const char = source[index];
    if (char === '\n') return { clean: false, end: index };
    if (char === '\\') index += 1;
    if (char === '\\' || char === '$' || char === '\n') clean = false;
    index += 1;
  }
  return { clean, end: index };
};

const skipComment = (source, index) => {
  if (source[index + 1] === '/') {
    const end = source.indexOf('\n', index);
    return end === -1 ? source.length : end;
  }
  const end = source.indexOf('*/', index + 2);
  return end === -1 ? source.length : end + 2;
};

const regexEnd = (source, from) => {
  let index = from;
  let inClass = false;
  while (index < source.length && source[index] !== '\n') {
    const char = source[index];
    if (char === '\\') index += 1;
    else if (char === '[') inClass = true;
    else if (char === ']') inClass = false;
    else if (char === '/' && !inClass) return index + 1;
    index += 1;
  }
  return index;
};

const opensRegex = (previous) =>
  previous === undefined ||
  (previous.kind === 'punct' &&
    previous.value !== ')' &&
    previous.value !== ']') ||
  (previous.kind === 'word' && REGEX_KEYWORDS.has(previous.value));

const wordEnd = (source, from) => {
  let index = from;
  while (index < source.length && WORD_CHAR.test(source[index])) index += 1;
  return index;
};

const nextToken = (source, index) => {
  const char = source[index];
  if (QUOTES.has(char)) {
    const { clean, end } = closingQuote(source, index + 1, char);
    const value = source.slice(index + 1, end);
    const usable = clean && end < source.length && value !== '';
    return {
      next: end + 1,
      token: usable ? { kind: 'string', value } : { kind: 'other', value: '' },
    };
  }
  if (WORD_CHAR.test(char)) {
    const end = wordEnd(source, index);
    return {
      next: end,
      token: { kind: 'word', value: source.slice(index, end) },
    };
  }
  return { next: index + 1, token: { kind: 'punct', value: char } };
};

const tokenize = (source) => {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const opensComment =
      char === '/' && (source[index + 1] === '/' || source[index + 1] === '*');
    if (opensComment) {
      index = skipComment(source, index);
    } else if (char === '/' && opensRegex(tokens.at(-1))) {
      index = regexEnd(source, index + 1);
      tokens.push({ kind: 'other', value: '' });
    } else if (char.trim() === '') {
      index += 1;
    } else {
      const { next, token } = nextToken(source, index);
      tokens.push(token);
      index = next;
    }
  }
  return tokens;
};

const isToken = (token, kind, value) =>
  token?.kind === kind && (value === undefined || token.value === value);

const isSpecifierAt = (tokens, index) =>
  isToken(tokens[index - 1], 'word', 'from') ||
  (isToken(tokens[index - 1], 'punct', '(') &&
    SPECIFIER_CALLS.has(tokens[index - 2]?.value));

const joinedSegments = (tokens, from) => {
  const segments = [];
  let index = from;
  while (isToken(tokens[index], 'string')) {
    segments.push(tokens[index].value);
    index += isToken(tokens[index + 1], 'punct', ',') ? 2 : 1;
  }
  return isToken(tokens[index], 'punct', ')') && segments.length > 0
    ? segments.join('/')
    : undefined;
};

const isRepoRootJoinAt = (tokens, index) =>
  PATH_CALLS.has(tokens[index].value) &&
  isToken(tokens[index], 'word') &&
  isToken(tokens[index + 1], 'punct', '(') &&
  isToken(tokens[index + 2], 'word', 'REPO_ROOT') &&
  isToken(tokens[index + 3], 'punct', ',');

const trimTrailingSlashes = (path) => {
  let end = path.length;
  while (end > 0 && path[end - 1] === '/') end -= 1;
  return path.slice(0, end);
};

const isRelative = (value) => value.startsWith('./') || value.startsWith('../');

const isInside = (path, dir) => path === dir || path.startsWith(`${dir}/`);

const literals = (source) =>
  tokenize(source)
    .filter((token) => token.kind === 'string')
    .map((token) => token.value);

const specifiers = (source) => {
  const tokens = tokenize(source);
  return tokens
    .filter(
      (token, index) => token.kind === 'string' && isSpecifierAt(tokens, index),
    )
    .map((token) => token.value);
};

const fromFile = (file, value) => posix.join(posix.dirname(file), value);

const relativeTargets = (source, file) =>
  literals(source)
    .filter(isRelative)
    .map((value) => fromFile(file, value));

const literalPaths = (source) =>
  literals(source)
    .filter((value) => !isRelative(value) && value.includes('/'))
    .map((value) => posix.normalize(value));

const repoRootJoins = (source) => {
  const tokens = tokenize(source);
  return tokens
    .map((_, index) =>
      isRepoRootJoinAt(tokens, index)
        ? joinedSegments(tokens, index + 4)
        : undefined,
    )
    .filter((path) => path !== undefined);
};

const workspaceImports = (source, graph) =>
  specifiers(source).flatMap((specifier) =>
    graph
      .filter(
        (workspace) =>
          specifier === workspace.pkgName ||
          specifier.startsWith(`${workspace.pkgName}/`),
      )
      .map((workspace) => `${workspace.dir}/package.json`),
  );

const relativeImports = (source, file) =>
  specifiers(source)
    .filter(isRelative)
    .map((value) => fromFile(file, value));

const referencedPaths = ({ file, graph, source }) => [
  ...relativeTargets(source, file),
  ...literalPaths(source),
  ...repoRootJoins(source),
  ...workspaceImports(source, graph),
];

const outsideModules = ({ files, readSource, suiteDir, trackedFiles }) => {
  const seen = new Set();
  const queue = files.flatMap((file) =>
    relativeImports(readSource(file), file),
  );
  while (queue.length > 0) {
    const file = queue.pop();
    if (
      !isInside(file, suiteDir) &&
      !seen.has(file) &&
      trackedFiles.has(file)
    ) {
      seen.add(file);
      queue.push(...relativeImports(readSource(file), file));
    }
  }
  return [...seen];
};

const directoriesOf = (tracked) =>
  new Set(
    tracked.flatMap((file) =>
      file
        .split('/')
        .slice(0, -1)
        .map((_, index, parts) => parts.slice(0, index + 1).join('/')),
    ),
  );

export const suiteInputs = ({ graph, readSource, suiteDir, tracked }) => {
  const trackedFiles = new Set(tracked);
  const directories = directoriesOf(tracked);
  const files = tracked.filter(
    (file) => isInside(file, suiteDir) && SOURCE.test(file),
  );
  const reached = outsideModules({ files, readSource, suiteDir, trackedFiles });
  const candidates = [
    ...[...files, ...reached].flatMap((file) =>
      referencedPaths({ file, graph, source: readSource(file) }),
    ),
    ...reached,
  ]
    .map(trimTrailingSlashes)
    .filter((path) => !isInside(path, suiteDir));
  const probes = candidates
    .filter((path) => trackedFiles.has(path) || directories.has(path))
    .map((path) => (directories.has(path) ? `${path}/` : path));
  return [...new Set(probes)].sort((left, right) => left.localeCompare(right));
};
