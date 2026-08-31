/*
 * Pulling the references out of a file: links, paths, commands and imports.
 *
 * Split from the classification so that "what did the author write" and "does it
 * travel" stay separately testable, and because the extractors are where the
 * false negatives live. Two of them exist only because the first version of this
 * probe reported a skill as self-contained while it named a file outside itself:
 * a path is as often written in backticks or handed to `node` as an argument as
 * it is written as a markdown link, and only the link form was being read.
 *
 * `IMPORT_PATTERNS` use `[ \t]` rather than `\s` deliberately. Beside `^` under
 * `/m`, `\s` matches newlines too, and the pattern goes super-linear on a long
 * file. They also anchor on `from` rather than `import`, so an import whose
 * specifier sits lines below its keyword is not silently missed.
 */

const FENCE_PATTERN = /^```([\w-]*)\s*$/;
const INLINE_CODE_PATTERN = /`([^`\n]+)`/g;

const IMPORT_PATTERNS = [
  /\bfrom[ \t]+['"]([^'"\n]+)['"]/g,
  /^[ \t]*import[ \t]+['"]([^'"\n]+)['"]/gm,
  /\brequire\([ \t]*['"]([^'"\n]+)['"][ \t]*\)/g,
  /\bimport\([ \t]*['"]([^'"\n]+)['"][ \t]*\)/g,
];

const SHELL_LANGUAGES = new Set(['bash', 'console', 'sh', 'shell', 'zsh']);

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

const linkTargetOf = (raw) => raw.trim().split(/\s+/)[0] ?? '';

const parseLinkTargets = (line) => {
  const targets = [];
  let cursor = 0;
  for (;;) {
    const marker = line.indexOf('](', cursor);
    if (marker === -1) return targets;
    const end = line.indexOf(')', marker + 2);
    if (end === -1) return targets;
    targets.push(line.slice(marker + 2, end));
    cursor = end + 1;
  }
};

export const extractLinkTargets = (content) =>
  content.split('\n').flatMap((line, index) =>
    parseLinkTargets(line)
      .map((raw) => ({ line: index + 1, target: linkTargetOf(raw) }))
      .filter((entry) => entry.target !== ''),
  );

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

const withoutTrailingPunctuation = (token) => {
  const characters = [...token];
  const lastKept = characters.findLastIndex(
    (character) => !TRAILING_PUNCTUATION.has(character),
  );
  return characters.slice(0, lastKept + 1).join('');
};

export const isPathToken = (token) => {
  if (token.includes('://') || /\s/.test(token)) return false;
  if (token.startsWith('./') || token.startsWith('../')) return true;
  return token.includes('/') && HAS_EXTENSION.test(token);
};

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
