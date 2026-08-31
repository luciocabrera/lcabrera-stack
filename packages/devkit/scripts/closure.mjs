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

const travelsWith = ({ path, rootDirectory, shipped }) => {
  if (shipped.has(path) || holdsShippedFile(path, shipped)) return true;
  const root = rootDirectory.replace(/\/$/, '');
  return path === root || path.startsWith(`${root}/`);
};

const resolveFrom = (base, target) =>
  normalise([...base.split('/'), ...target.split('/')]).join('/');

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

const SOURCE_EXTENSIONS = ['.cjs', '.js', '.mjs', '.mts', '.ts'];

const isSourceFile = (path) =>
  SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));

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

  return {
    escapes: dedupe([
      ...linkEscapes,
      ...commandEscapes,
      ...importEscapes,
      ...requiresEscapes,
    ]),
  };
};
