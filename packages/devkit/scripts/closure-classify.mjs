/*
 * Whether one reference travels with the directory being shipped.
 *
 * Split out of `closure.mjs` so every resolver — markdown, workflow, subagent —
 * shares one containment rule instead of restating it.
 *
 * A module specifier is not a link and cannot be read as one: a bundler adds
 * the extension, resolves a directory to its index file and drops the query a
 * loader was selected with, so the literal path an import names is usually not
 * the name of any file. Read literally, every extensionless import in a shipped
 * source tree reports as an escape from the tree it is in.
 */

const isExternalUrl = (target) =>
  /^[a-z][a-z0-9+.-]+:/i.test(target) || target.startsWith('//');

const isAbsolutePath = (target) =>
  target.startsWith('/') ||
  target.startsWith('\\\\') ||
  /^[a-z]:[/\\]/i.test(target);

const withoutAnchor = (target) => {
  const index = target.indexOf('#');
  return index === -1 ? target : target.slice(0, index);
};

const normalise = (segments) => {
  const resolved = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') resolved.pop();
    else resolved.push(segment);
  }
  return resolved;
};

const holdsShippedFile = (path, shipped) => {
  const prefix = `${path}/`;
  for (const entry of shipped) {
    if (entry.startsWith(prefix)) return true;
  }
  return false;
};

const isUnderRoot = ({ path, rootDirectory }) => {
  const root = rootDirectory.replace(/\/$/, '');
  return path === root || path.startsWith(`${root}/`);
};

const travelsWith = ({ path, rootDirectory, shipped }) =>
  shipped.has(path) ||
  holdsShippedFile(path, shipped) ||
  isUnderRoot({ path, rootDirectory });

/**
 * The same containment question for a module specifier, which answers it with
 * one fewer way to say yes.
 *
 * A directory holding a shipped file is a target a link may point at, and is
 * not a module: an import naming it resolves only through the index file
 * inside it. Accepting the prefix match certified a tree whose first build
 * fails on the import — the bare path is tried first, so the index candidates
 * below it were never reached.
 *
 * @param {{ path: string, rootDirectory: string, shipped: Set<string> }} args
 * @returns {boolean}
 */
const resolvesAsModule = ({ path, rootDirectory, shipped }) =>
  shipped.has(path) || isUnderRoot({ path, rootDirectory });

const resolveFrom = (base, target) =>
  normalise([...base.split('/'), ...target.split('/')]).join('/');

export const directoryOf = (path) => path.split('/').slice(0, -1).join('/');

export const classifyLink = ({
  fromDirectory,
  rootDirectory,
  shipped = new Set(),
  target,
}) => {
  if (isExternalUrl(target)) return { kind: 'url' };
  if (isAbsolutePath(target)) return { kind: 'escape', resolved: target };
  const withoutFragment = withoutAnchor(target);
  if (withoutFragment === '') return { kind: 'anchor' };

  const path = resolveFrom(fromDirectory, withoutFragment);
  return {
    kind: travelsWith({ path, rootDirectory, shipped }) ? 'internal' : 'escape',
    resolved: path,
  };
};

export const classifyPathToken = ({
  exists,
  fromDirectory,
  rootDirectory,
  shipped = new Set(),
  token,
}) => {
  if (isExternalUrl(token)) return { kind: 'url' };
  const withoutFragment = withoutAnchor(token);
  if (withoutFragment === '') return { kind: 'anchor' };

  const candidates = [
    resolveFrom(fromDirectory, withoutFragment),
    resolveFrom('', withoutFragment),
  ];
  const resolved = candidates.find((candidate) => exists(candidate));
  if (resolved === undefined) return { kind: 'unresolved' };
  return {
    kind: travelsWith({ path: resolved, rootDirectory, shipped })
      ? 'internal'
      : 'escape',
    resolved,
  };
};

/**
 * The package a bare specifier names, with any subpath taken off.
 *
 * `@scope/name/deep` keeps two segments and everything else keeps one, so a
 * subpath import is answered by the same name as the bare one — which is what a
 * dependency list declares.
 *
 * @param {string} specifier
 * @returns {string}
 */
const packageNameOf = (specifier) => {
  const segments = specifier.split('/');
  return specifier.startsWith('@')
    ? segments.slice(0, 2).join('/')
    : (segments[0] ?? specifier);
};

const MODULE_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
];

const SOURCE_ALIAS = '@/';

const SOURCE_DIRECTORY = 'src';

const withoutQuery = (specifier) => specifier.split('?', 1)[0] ?? specifier;

const moduleCandidates = (path) => [
  path,
  ...MODULE_EXTENSIONS.map((extension) => `${path}${extension}`),
  ...MODULE_EXTENSIONS.map((extension) => `${path}/index${extension}`),
];

const classifyModulePath = ({ path, rootDirectory, shipped }) => {
  const resolved = moduleCandidates(path).find((candidate) =>
    resolvesAsModule({ path: candidate, rootDirectory, shipped }),
  );
  return resolved === undefined
    ? { kind: 'escape', resolved: path }
    : { kind: 'internal', resolved };
};

/**
 * The directory `@/` names for a file, which is the source root above it.
 *
 * Every app configuration this toolchain generates maps the alias to the
 * workspace's own `src`, so the answer is read off the importing file's path
 * rather than out of a tsconfig the analysis does not have.
 *
 * @param {string} fromDirectory
 * @returns {string | undefined}
 */
const sourceRootOf = (fromDirectory) => {
  const segments = fromDirectory.split('/');
  const index = segments.lastIndexOf(SOURCE_DIRECTORY);
  return index === -1 ? undefined : segments.slice(0, index + 1).join('/');
};

export const classifyImport = ({
  fromDirectory,
  rootDirectory,
  shipped = new Set(),
  specifier,
}) => {
  if (specifier.startsWith('node:')) return { kind: 'builtin' };
  const target = withoutQuery(withoutAnchor(specifier));

  if (specifier.startsWith('.')) {
    return classifyModulePath({
      path: resolveFrom(fromDirectory, target),
      rootDirectory,
      shipped,
    });
  }

  if (target.startsWith(SOURCE_ALIAS)) {
    const sourceRoot = sourceRootOf(fromDirectory);
    return sourceRoot === undefined
      ? { kind: 'escape', resolved: target }
      : classifyModulePath({
          path: resolveFrom(sourceRoot, target.slice(SOURCE_ALIAS.length)),
          rootDirectory,
          shipped,
        });
  }

  return { kind: 'package', packageName: packageNameOf(specifier) };
};

export const toCommandEscapes = ({ allowed, commands, file }) =>
  commands
    .filter((command) => !allowed.has(command.word))
    .map((command) => ({
      file: file.path,
      kind: 'command',
      line: command.line,
      reference: command.word,
    }));
