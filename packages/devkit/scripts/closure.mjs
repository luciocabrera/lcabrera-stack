/*
 * Answers one question about a directory that is about to be shipped: what does
 * it need that it does not contain?
 *
 * Why it exists: the survey this replaced counted repository NAMES, and a file
 * can name nothing while depending on plenty — `epic` mentions no repo path and
 * still cannot run without four files outside its own directory. Counting names
 * and resolving references are different measurements, and only the second one
 * answers "will this work once installed somewhere else".
 *
 * Pure by design: callers pass file contents in and get findings back, so the
 * walking, printing and exit code live in the CLI. Reported escapes come in
 * three kinds because they fail differently: a `link` is a file the consumer
 * will not have, a `command` is a tool their shell may not resolve, and an
 * `import` is a module their install will not provide. A directory holding a
 * runnable script is not self-contained just because its prose is — which is
 * how a skill whose only file imports a private workspace package can read as
 * clean under a markdown-only probe.
 */

const LINK_PATTERN = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const FENCE_PATTERN = /^```([\w-]*)\s*$/;
const INLINE_CODE_PATTERN = /`([^`\n]+)`/g;

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

const isExternalUrl = (target) =>
  /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');

/** `path#section` and `#section` both point at a heading; only the path travels. */
const withoutAnchor = (target) => {
  const index = target.indexOf('#');
  return index === -1 ? target : target.slice(0, index);
};

export const extractLinkTargets = (content) => {
  const lines = content.split('\n');
  return lines.flatMap((line, index) =>
    [...line.matchAll(LINK_PATTERN)].map((match) => ({
      line: index + 1,
      target: match[1],
    })),
  );
};

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

/**
 * The tool a shell segment invokes. Leading `VAR=value` assignments are skipped
 * rather than treated as the command, which is how `OUT=x vp run test` would
 * otherwise read as invoking nothing at all.
 */
const commandWordIn = (segment) => {
  const words = segment.split(/\s+/).filter((word) => word !== '');
  return words.find((word) => !word.includes('=')) ?? '';
};

/** A shell line can hold several commands; each segment starts a new one. */
const commandWordsIn = (text) =>
  text
    .split(/&&|\|\||[|;]/)
    .map((segment) => segment.trim().replace(/^\$\s*/, ''))
    .map(commandWordIn)
    .filter((word) => !SHELL_NOISE.has(word));

const inlineCommandWords = (content) => {
  const lines = content.split('\n');
  return lines.flatMap((line, index) =>
    [...line.matchAll(INLINE_CODE_PATTERN)]
      .map((match) => ({
        line: index + 1,
        word: match[1].trim().split(/\s+/)[0] ?? '',
      }))
      .filter((entry) => INVOKERS.has(entry.word)),
  );
};

export const extractCommands = (content) => {
  const fenced = shellBlockLines(content).flatMap(({ line, text }) =>
    commandWordsIn(text)
      .filter((word) => INVOKERS.has(word))
      .map((word) => ({ line, word })),
  );
  return [...fenced, ...inlineCommandWords(content)];
};

/**
 * `internal` — resolves inside the shipped directory, so it travels with it.
 * `escape`   — resolves outside it: the consumer will not have this file.
 * `url` / `anchor` — nothing on disk to resolve.
 */
export const classifyLink = ({ fromDirectory, rootDirectory, target }) => {
  if (isExternalUrl(target)) return { kind: 'url' };
  const withoutFragment = withoutAnchor(target);
  if (withoutFragment === '') return { kind: 'anchor' };

  const segments = [...fromDirectory.split('/'), ...withoutFragment.split('/')];
  const resolved = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') resolved.pop();
    else resolved.push(segment);
  }

  const path = resolved.join('/');
  const root = rootDirectory.replace(/\/$/, '');
  const inside = path === root || path.startsWith(`${root}/`);
  return { kind: inside ? 'internal' : 'escape', resolved: path };
};

const SOURCE_EXTENSIONS = ['.cjs', '.js', '.mjs', '.mts', '.ts'];

const IMPORT_PATTERNS = [
  /^\s*import\s[^'"]*from\s*['"]([^'"]+)['"]/gm,
  /^\s*import\s*['"]([^'"]+)['"]/gm,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const isSourceFile = (path) =>
  SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));

const lineOf = (content, index) => content.slice(0, index).split('\n').length;

export const extractImportSpecifiers = (content) =>
  IMPORT_PATTERNS.flatMap((pattern) =>
    [...content.matchAll(pattern)].map((match) => ({
      line: lineOf(content, match.index ?? 0),
      specifier: match[1],
    })),
  );

/** A builtin travels everywhere; a relative path is a link; anything else is a package. */
const classifyImport = ({ fromDirectory, rootDirectory, specifier }) => {
  if (specifier.startsWith('node:')) return { kind: 'builtin' };
  if (specifier.startsWith('.')) {
    return classifyLink({ fromDirectory, rootDirectory, target: specifier });
  }
  return { kind: 'package' };
};

/**
 * @param {{ files: { path: string, content: string }[], rootDirectory: string,
 *   allowedCommands?: Iterable<string> }} args
 */
export const analyseClosure = ({
  allowedCommands = [],
  files,
  rootDirectory,
}) => {
  const allowed = new Set(allowedCommands);

  const linkEscapes = files.flatMap((file) => {
    const fromDirectory = file.path.split('/').slice(0, -1).join('/');
    return extractLinkTargets(file.content)
      .map((link) => ({
        ...link,
        ...classifyLink({ fromDirectory, rootDirectory, target: link.target }),
      }))
      .filter((link) => link.kind === 'escape')
      .map((link) => ({
        file: file.path,
        kind: 'link',
        line: link.line,
        reference: link.target,
        resolved: link.resolved,
      }));
  });

  const commandEscapes = files.flatMap((file) =>
    extractCommands(file.content)
      .filter((command) => !allowed.has(command.word))
      .map((command) => ({
        file: file.path,
        kind: 'command',
        line: command.line,
        reference: command.word,
      })),
  );

  const importEscapes = files
    .filter((file) => isSourceFile(file.path))
    .flatMap((file) => {
      const fromDirectory = file.path.split('/').slice(0, -1).join('/');
      return extractImportSpecifiers(file.content)
        .map((entry) => ({
          ...entry,
          ...classifyImport({
            fromDirectory,
            rootDirectory,
            specifier: entry.specifier,
          }),
        }))
        .filter((entry) => entry.kind === 'escape' || entry.kind === 'package')
        .filter((entry) => !allowed.has(entry.specifier))
        .map((entry) => ({
          file: file.path,
          kind: 'import',
          line: entry.line,
          reference: entry.specifier,
          resolved: entry.resolved,
        }));
    });

  return { escapes: [...linkEscapes, ...commandEscapes, ...importEscapes] };
};
