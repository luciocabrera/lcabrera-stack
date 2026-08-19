/*
 * Pulling the references out of a file: links, paths, commands and imports.
 *
 * Split from the classification so that "what did the author write" and "does it
 * travel" stay separately testable, and because the extractors are where the
 * false negatives live. Two of them exist only because the first version of this
 * probe reported a skill as self-contained while it named a file outside itself:
 * a path is as often written in backticks or handed to `node` as an argument as
 * it is written as a markdown link, and only the link form was being read.
 */

// Every quantified class here excludes the delimiter that ends it, so the match
// is decided in one pass. Spelling the optional title as `(?:\s+"[^"]*")?` after
// a `[^)\s]+` target reintroduces a choice at each position and is polynomial on
// a line holding an unclosed link; the title is split off afterwards instead.
const LINK_PATTERN = /\[[^\]]*\]\(([^)]*)\)/g;
const FENCE_PATTERN = /^```([\w-]*)\s*$/;
const INLINE_CODE_PATTERN = /`([^`\n]+)`/g;

const IMPORT_PATTERNS = [
  /^\s*import\s[^'"]*from\s*['"]([^'"]+)['"]/gm,
  /^\s*import\s*['"]([^'"]+)['"]/gm,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const SHELL_LANGUAGES = new Set(['bash', 'console', 'sh', 'shell', 'zsh']);

/** Words that begin a command line without being the tool being invoked. */
const SHELL_NOISE = new Set([
  '',
  '#',
  'cd',
  'do',
  'done',
  'echo',
  'elif',
  'else',
  'fi',
  'for',
  'if',
  'then',
  'while',
]);

/**
 * Only these begin a command. Without an allowlist every backticked path reads
 * as an invocation, which is how a reference table fills up with noise nobody
 * reads.
 */
const INVOKERS = new Set([
  'bash',
  'biome',
  'devkit',
  'docker',
  'eslint',
  'fallow',
  'gh',
  'git',
  'node',
  'npm',
  'npx',
  'pnpm',
  'sh',
  'tsc',
  'vp',
  'yarn',
]);

const lineOf = (content, index) => content.slice(0, index).split('\n').length;

/** `(path "title")` is one link; only the path travels. */
const linkTargetOf = (raw) => raw.trim().split(/\s+/)[0] ?? '';

export const extractLinkTargets = (content) =>
  content
    .split('\n')
    .flatMap((line, index) =>
      [...line.matchAll(LINK_PATTERN)]
        .map((match) => ({ line: index + 1, target: linkTargetOf(match[1]) }))
        .filter((entry) => entry.target !== ''),
    );

/** The fenced blocks whose language marks them as something a reader will run. */
const shellBlockLines = (content) => {
  const lines = content.split('\n');
  const collected = [];
  let language;

  for (const [index, line] of lines.entries()) {
    const fence = FENCE_PATTERN.exec(line);
    if (fence) {
      language = language === undefined ? fence[1].toLowerCase() : undefined;
      continue;
    }
    if (language !== undefined && SHELL_LANGUAGES.has(language)) {
      collected.push({ line: index + 1, text: line });
    }
  }

  return collected;
};

const shellSegments = (text) =>
  text
    .split(/&&|\|\||[|;]/)
    .map((segment) => segment.trim().replace(/^\$\s*/, ''));

/**
 * The tool a shell segment invokes. Leading `VAR=value` assignments are skipped
 * rather than treated as the command, which is how `OUT=x vp run test` would
 * otherwise read as invoking nothing at all.
 */
const commandWordIn = (segment) => {
  const words = segment.split(/\s+/).filter((word) => word !== '');
  return words.find((word) => !word.includes('=')) ?? '';
};

const inlineCodeSpans = (content) =>
  content.split('\n').flatMap((line, index) =>
    [...line.matchAll(INLINE_CODE_PATTERN)].map((match) => ({
      line: index + 1,
      text: match[1].trim(),
    })),
  );

export const extractCommands = (content) => {
  const fenced = shellBlockLines(content).flatMap(({ line, text }) =>
    shellSegments(text)
      .map(commandWordIn)
      .filter((word) => !SHELL_NOISE.has(word) && INVOKERS.has(word))
      .map((word) => ({ line, word })),
  );
  const inline = inlineCodeSpans(content)
    .map((span) => ({ line: span.line, word: span.text.split(/\s+/)[0] ?? '' }))
    .filter((entry) => INVOKERS.has(entry.word));
  return [...fenced, ...inline];
};

const HAS_EXTENSION = /\.[a-z0-9]+$/i;

const TRAILING_PUNCTUATION = new Set([')', ',', '.', ':', ';']);

/**
 * Prose punctuation clinging to the end of a path. Scanned rather than matched:
 * a quantified class anchored to the end retries from every position, which is
 * polynomial on a long run of punctuation.
 */
const withoutTrailingPunctuation = (token) => {
  const characters = [...token];
  const lastKept = characters.findLastIndex(
    (character) => !TRAILING_PUNCTUATION.has(character),
  );
  return characters.slice(0, lastKept + 1).join('');
};

/**
 * A token is treated as a path when it is explicitly relative, or when it has
 * both a directory separator and a file extension. Requiring the extension is
 * what keeps `type(scope)` and `feat/branch-name` out of the findings.
 */
export const isPathToken = (token) => {
  if (token.includes('://') || /\s/.test(token)) return false;
  if (token.startsWith('./') || token.startsWith('../')) return true;
  return token.includes('/') && HAS_EXTENSION.test(token);
};

/** Paths written in prose as inline code, and paths handed to a command. */
export const extractPathTokens = (content) => {
  const inline = inlineCodeSpans(content)
    .flatMap((span) =>
      span.text.split(/\s+/).map((token) => ({ ...span, token })),
    )
    .map(({ line, token }) => ({
      line,
      token: withoutTrailingPunctuation(token),
    }));

  const arguments_ = shellBlockLines(content).flatMap(({ line, text }) =>
    shellSegments(text)
      .flatMap((segment) => segment.split(/\s+/).slice(1))
      .map((token) => ({ line, token: token.replace(/^["']|["']$/g, '') })),
  );

  return [...inline, ...arguments_].filter((entry) => isPathToken(entry.token));
};

export const extractImportSpecifiers = (content) =>
  IMPORT_PATTERNS.flatMap((pattern) =>
    [...content.matchAll(pattern)].map((match) => ({
      line: lineOf(content, match.index ?? 0),
      specifier: match[1],
    })),
  );
