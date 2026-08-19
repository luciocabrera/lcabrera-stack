/*
 * Answers one question about a directory that is about to be shipped: what does
 * it need that it does not contain?
 *
 * Why it exists: the survey this replaced counted repository NAMES, and a file
 * can name nothing while depending on plenty — `epic` mentions no repo path and
 * still cannot run without files outside its own directory. Counting names and
 * resolving references are different measurements, and only the second one
 * answers "will this work once installed somewhere else".
 *
 * Pure by design: callers pass file contents in and get findings back, so the
 * walking, printing and exit code live in the CLI. Escapes come in three kinds
 * because they fail differently for a consumer — a `link` is a file they will
 * not have, a `command` is a tool their shell may not resolve, an `import` is a
 * module their install will not provide.
 */

import {
  extractCommands,
  extractImportSpecifiers,
  extractLinkTargets,
  extractPathTokens,
} from './closure-extract.mjs';

const isExternalUrl = (target) =>
  /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');

/** `path#section` and `#section` both point at a heading; only the path travels. */
const withoutAnchor = (target) => {
  const index = target.indexOf('#');
  return index === -1 ? target : target.slice(0, index);
};

const normalise = (segments) =>
  segments.reduce((resolved, segment) => {
    if (segment === '' || segment === '.') return resolved;
    if (segment === '..') return resolved.slice(0, -1);
    return [...resolved, segment];
  }, []);

const isInside = (path, rootDirectory) => {
  const root = rootDirectory.replace(/\/$/, '');
  return path === root || path.startsWith(`${root}/`);
};

const resolveFrom = (base, target) =>
  normalise([...base.split('/'), ...target.split('/')]).join('/');

/**
 * `internal` — resolves inside the shipped directory, so it travels with it.
 * `escape`   — resolves outside it: the consumer will not have this file.
 * `url` / `anchor` — nothing on disk to resolve.
 *
 * A markdown link is ALWAYS resolved against the file that holds it, which is
 * what the format means by a relative target. Resolving a bare-looking one from
 * the repository root instead reports a skill's own `references/advanced.md` as
 * an escape — a false positive that reads exactly like a real finding.
 */
export const classifyLink = ({ fromDirectory, rootDirectory, target }) => {
  if (isExternalUrl(target)) return { kind: 'url' };
  const withoutFragment = withoutAnchor(target);
  if (withoutFragment === '') return { kind: 'anchor' };

  const path = resolveFrom(fromDirectory, withoutFragment);
  return {
    kind: isInside(path, rootDirectory) ? 'internal' : 'escape',
    resolved: path,
  };
};

/**
 * A path written in prose or handed to a command carries no convention saying
 * what it is relative to: `packages/x/y.md` means the repository root, while
 * `references/advanced.md` two lines later means the file's own directory. The
 * only thing that separates them is which one is actually there, so the caller
 * supplies the existence check and a token matching neither is left unreported
 * rather than guessed at.
 */
export const classifyPathToken = ({
  exists,
  fromDirectory,
  rootDirectory,
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
    kind: isInside(resolved, rootDirectory) ? 'internal' : 'escape',
    resolved,
  };
};

const SOURCE_EXTENSIONS = ['.cjs', '.js', '.mjs', '.mts', '.ts'];

const isSourceFile = (path) =>
  SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));

/** A builtin travels everywhere; a relative path is a link; anything else is a package. */
const classifyImport = ({ fromDirectory, rootDirectory, specifier }) => {
  if (specifier.startsWith('node:')) return { kind: 'builtin' };
  if (specifier.startsWith('.')) {
    return classifyLink({ fromDirectory, rootDirectory, target: specifier });
  }
  return { kind: 'package' };
};

const directoryOf = (path) => path.split('/').slice(0, -1).join('/');

const toEscapes = ({ classified, file }) =>
  classified
    .filter((reference) => reference.kind === 'escape')
    .map((reference) => ({
      file: file.path,
      kind: 'link',
      line: reference.line,
      reference: reference.target,
      resolved: reference.resolved,
    }));

/**
 * @param {{ files: { path: string, content: string }[], rootDirectory: string,
 *   allowedCommands?: Iterable<string>,
 *   exists?: (repoRelativePath: string) => boolean }} args
 */
export const analyseClosure = ({
  allowedCommands = [],
  exists,
  files,
  rootDirectory,
}) => {
  const allowed = new Set(allowedCommands);

  const linkEscapes = files.flatMap((file) => {
    const fromDirectory = directoryOf(file.path);
    const links = extractLinkTargets(file.content).map((link) => ({
      ...link,
      ...classifyLink({ fromDirectory, rootDirectory, target: link.target }),
    }));
    // Without an existence check there is no way to tell a root-relative path
    // from a file-relative one, so prose tokens are not analysed at all rather
    // than analysed by guess.
    const tokens =
      exists === undefined
        ? []
        : extractPathTokens(file.content).map((entry) => ({
            line: entry.line,
            target: entry.token,
            ...classifyPathToken({
              exists,
              fromDirectory,
              rootDirectory,
              token: entry.token,
            }),
          }));
    return toEscapes({ classified: [...links, ...tokens], file });
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
    .flatMap((file) =>
      extractImportSpecifiers(file.content)
        .map((entry) => ({
          ...entry,
          ...classifyImport({
            fromDirectory: directoryOf(file.path),
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
        })),
    );

  return { escapes: [...linkEscapes, ...commandEscapes, ...importEscapes] };
};
