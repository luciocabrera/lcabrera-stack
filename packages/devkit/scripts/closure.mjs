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
 * walking, printing and exit code live in the CLI. Escapes come in four kinds
 * because they fail differently for a consumer — a `link` is a file they will
 * not have, a `command` is a tool their shell may not resolve, an `import` is a
 * module their install will not provide, and a `requires` is a config key no
 * consumer could set because it is not part of what the config is for.
 */

import {
  extractCommands,
  extractImportSpecifiers,
  extractLinkTargets,
  extractPathTokens,
} from './closure-extract.mjs';
import { requiredConfigKeys, requiresDeclarationLine } from './frontmatter.mjs';

/**
 * A scheme is at least two characters, which is what separates `mailto:` from a
 * Windows drive letter. Treating `C:\\dir\\file.md` as a URL would silently drop
 * the most non-portable path a shipped file can contain.
 */
const isExternalUrl = (target) =>
  /^[a-z][a-z0-9+.-]+:/i.test(target) || target.startsWith('//');

/**
 * A path anchored to a filesystem root — POSIX `/…`, a Windows drive, or a UNC
 * share. It cannot resolve anywhere but the machine that wrote it, so it is
 * reported rather than resolved: treating it as relative would quietly place it
 * inside the shipped directory and call it internal, which is the most
 * non-portable reference a shipped file can hold going unnoticed.
 */
const isAbsolutePath = (target) =>
  target.startsWith('/') ||
  target.startsWith('\\\\') ||
  /^[a-z]:[/\\]/i.test(target);

/** `path#section` and `#section` both point at a heading; only the path travels. */
const withoutAnchor = (target) => {
  const index = target.indexOf('#');
  return index === -1 ? target : target.slice(0, index);
};

const normalise = (segments) => {
  // A local accumulator that never escapes this function; rebuilding the array
  // per segment is quadratic on a deep path.
  const resolved = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') resolved.pop();
    else resolved.push(segment);
  }
  return resolved;
};

/**
 * A directory the package puts at least one file into. The consumer will have
 * it, so a link to it travels — `[in this directory](./)` is the ordinary
 * markdown way to point at the folder a file sits in, and reading it as an
 * escape reports a page for naming its own home.
 *
 * Judged from the shipped files rather than from a separate list of directories,
 * so it cannot say a directory exists that nothing lands in.
 */
const holdsShippedFile = (path, shipped) => {
  const prefix = `${path}/`;
  for (const entry of shipped) {
    if (entry.startsWith(prefix)) return true;
  }
  return false;
};

/**
 * Whether a resolved path travels with the file that named it.
 *
 * The unit is the PACKAGE, not the directory. A skill legitimately points at a
 * contract document or a sibling skill that ships alongside it, and calling that
 * an escape would push every such reference toward being duplicated into each
 * directory that needs it — the exact failure the shipping model exists to
 * avoid. So a path the package ships is internal wherever it sits.
 */
const travelsWith = ({ path, rootDirectory, shipped }) => {
  if (shipped.has(path) || holdsShippedFile(path, shipped)) return true;
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

const SOURCE_EXTENSIONS = ['.cjs', '.js', '.mjs', '.mts', '.ts'];

const isSourceFile = (path) =>
  SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));

/** A builtin travels everywhere; a relative path is a link; anything else is a package. */
const classifyImport = ({
  fromDirectory,
  rootDirectory,
  shipped,
  specifier,
}) => {
  if (specifier.startsWith('node:')) return { kind: 'builtin' };
  if (specifier.startsWith('.')) {
    return classifyLink({
      fromDirectory,
      rootDirectory,
      shipped,
      target: specifier,
    });
  }
  return { kind: 'package' };
};

const directoryOf = (path) => path.split('/').slice(0, -1).join('/');

const dedupe = (escapes) => {
  const seen = new Set();
  return escapes.filter((finding) => {
    const key = [
      finding.file,
      finding.kind,
      finding.resolved ?? finding.reference,
    ].join('\u0000');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

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
 * A declared requirement escapes when the key it names is outside the config's
 * key space, because then no consumer can satisfy it — unlike a key that is
 * merely unset here, which is `sync`'s question and not this one.
 */
const toRequiresEscapes = ({ allowedKeys, file }) =>
  requiredConfigKeys(file.content)
    .filter((key) => !allowedKeys.has(key))
    .map((key) => ({
      file: file.path,
      kind: 'requires',
      line: requiresDeclarationLine(file.content),
      reference: `config.${key}`,
    }));

/**
 * @param {{ files: { path: string, content: string }[], rootDirectory: string,
 *   allowedCommands?: Iterable<string>,
 *   allowedConfigKeys?: Iterable<string>,
 *   exists?: (repoRelativePath: string) => boolean,
 *   shipped?: Set<string> }} args
 */
export const analyseClosure = ({
  allowedCommands = [],
  allowedConfigKeys = [],
  exists,
  files,
  rootDirectory,
  shipped = new Set(),
}) => {
  const allowed = new Set(allowedCommands);
  const allowedKeys = new Set(allowedConfigKeys);

  const linkEscapes = files.flatMap((file) => {
    const fromDirectory = directoryOf(file.path);
    const links = extractLinkTargets(file.content).map((link) => ({
      ...link,
      ...classifyLink({
        fromDirectory,
        rootDirectory,
        shipped,
        target: link.target,
      }),
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
              shipped,
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
            shipped,
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

  const requiresEscapes = files.flatMap((file) =>
    toRequiresEscapes({ allowedKeys, file }),
  );

  // A link whose text repeats its own target — the spelling these skills use —
  // is found twice, once as a link and once as a prose path. It is one
  // dependency, and reporting it twice makes a short list look like a long one.
  return {
    escapes: dedupe([
      ...linkEscapes,
      ...commandEscapes,
      ...importEscapes,
      ...requiresEscapes,
    ]),
  };
};
