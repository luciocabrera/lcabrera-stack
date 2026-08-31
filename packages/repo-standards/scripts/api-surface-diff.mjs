/**
 * Pure diff + semver classification for the public-API surface gate
 * (verify-api-surface.mjs).
 *
 * Separated from the CLI so the "what changed, and is it breaking?" decision is
 * unit-testable without a filesystem or a TypeScript program — `test:scripts`
 * covers this file. A surface is the shape the extractor produces: a package
 * name plus a map of subpath to a map of export name to its normalized
 * signature string.
 */

/** @typedef {{ readonly [exportName: string]: string }} SubpathExports */
/** @typedef {{ readonly [subpath: string]: SubpathExports }} Surface */

const subpathsOf = (surface) => Object.keys(surface ?? {});

const exportsOf = (surface, subpath) => surface?.[subpath] ?? {};

const diffSubpath = ({ base, next, subpath }) => {
  const before = exportsOf(base, subpath);
  const after = exportsOf(next, subpath);
  const names = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].sort((left, right) => left.localeCompare(right));

  return names.flatMap((name) => {
    const had = Object.hasOwn(before, name);
    const has = Object.hasOwn(after, name);
    if (had && !has) {
      return [{ kind: 'removed', name, subpath }];
    }
    if (!had && has) {
      return [{ kind: 'added', name, signature: after[name], subpath }];
    }
    if (before[name] !== after[name]) {
      return [
        {
          from: before[name],
          kind: 'changed',
          name,
          signature: after[name],
          subpath,
        },
      ];
    }
    return [];
  });
};

export const diffSurfaces = ({ base, next }) => {
  const subpaths = [
    ...new Set([...subpathsOf(base), ...subpathsOf(next)]),
  ].sort((left, right) => left.localeCompare(right));
  return subpaths.flatMap((subpath) => diffSubpath({ base, next, subpath }));
};

export const isBreakingChange = (change) =>
  change.kind === 'removed' || change.kind === 'changed';

export const hasBreakingChange = (changes) => changes.some(isBreakingChange);

export const formatChange = (change) => {
  const at = `${change.subpath} › ${change.name}`;
  if (change.kind === 'removed') {
    return `  removed  ${at}`;
  }
  if (change.kind === 'added') {
    return `  added    ${at}: ${change.signature}`;
  }
  return `  changed  ${at}\n             was: ${change.from}\n             now: ${change.signature}`;
};
