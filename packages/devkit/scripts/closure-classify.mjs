/*
 * Whether one reference travels with the directory being shipped.
 *
 * Split out of `closure.mjs` so every resolver — markdown, workflow, subagent —
 * shares one containment rule instead of restating it.
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

const travelsWith = ({ path, rootDirectory, shipped }) => {
  if (shipped.has(path) || holdsShippedFile(path, shipped)) return true;
  const root = rootDirectory.replace(/\/$/, '');
  return path === root || path.startsWith(`${root}/`);
};

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

export const classifyImport = ({
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

export const toCommandEscapes = ({ allowed, commands, file }) =>
  commands
    .filter((command) => !allowed.has(command.word))
    .map((command) => ({
      file: file.path,
      kind: 'command',
      line: command.line,
      reference: command.word,
    }));
