/**
 * Raising the floor of every range this repository ships to the version it
 * publishes, so a repository created by a release cannot resolve a package
 * older than that release (ADR-117). Text in, text out: the file keeps every
 * byte the raise does not touch, and a floor this cannot locate is refused
 * rather than skipped, since the gate would then fail the release.
 */

import { inc, lt, minVersion, satisfies, validRange } from 'semver';

const PLACE = /^(?:catalog|workspace):/u;

const escaped = (value) => value.replaceAll(/[$()*+.?[\\\]^{|}]/gu, '\\$&');

/**
 * @param {{ range: string, version: string }} args
 * @returns {string}
 */
export const raisedRange = ({ range, version }) => {
  if (PLACE.test(range) || validRange(range) === null) return range;

  const floor = minVersion(range).version;
  if (!lt(floor, version)) return range;
  if (!range.includes(floor)) {
    throw new Error(
      `\`${range}\` has no literal floor to raise to ${version} — write it as \`>=${floor} <ceiling>\``,
    );
  }

  const raised = range.replace(floor, version);
  if (
    !satisfies(version, raised) ||
    !satisfies(inc(version, 'minor'), raised)
  ) {
    throw new Error(
      `raising \`${range}\` to ${version} gives \`${raised}\`, which excludes ${version} or the minor after it — its ceiling has to move by hand`,
    );
  }
  return raised;
};

const occurrences = ({ pattern, text }) => text.match(pattern)?.length ?? 0;

const replacedOnce = ({ path, pattern, replacement, text }) => {
  const found = occurrences({ pattern, text });
  if (found !== 1) {
    throw new Error(
      `${path}: expected one ${pattern.source} to raise and found ${found}`,
    );
  }
  return text.replace(pattern, replacement);
};

const inManifest = ({ declaration, raised, text }) =>
  text.replaceAll(
    `${JSON.stringify(declaration.name)}: ${JSON.stringify(declaration.range)}`,
    `${JSON.stringify(declaration.name)}: ${JSON.stringify(raised)}`,
  );

const inCatalog = ({ declaration, raised, text }) =>
  text
    .split('\n')
    .map((line, index) =>
      index + 1 === declaration.line
        ? line.replace(declaration.range, raised)
        : line,
    )
    .join('\n');

const inConstant = ({ declaration, raised, text }) =>
  replacedOnce({
    path: declaration.path,
    pattern: new RegExp(`(['"])${escaped(declaration.range)}\\1`, 'gu'),
    replacement: `$1${raised}$1`,
    text,
  });

const REWRITERS = {
  catalog: inCatalog,
  constant: inConstant,
  manifest: inManifest,
};

const rewriteOne = ({ declaration, kind, text, versions }) => {
  const version = versions[declaration.name];
  if (typeof version !== 'string') return text;

  const raised = raisedRange({ range: declaration.range, version });
  if (raised === declaration.range) return text;

  const next = REWRITERS[kind]({ declaration, raised, text });
  if (next === text) {
    throw new Error(
      `${declaration.path}: \`${declaration.name}\` reads \`${declaration.range}\` and the text holding it was not found`,
    );
  }
  return next;
};

/**
 * The source's text with every floor below the published version raised to it.
 *
 * @param {{ declarations: readonly object[], kind: string, text: string,
 *           versions: Record<string, string> }} args
 * @returns {string}
 */
export const withRaisedFloors = ({ declarations, kind, text, versions }) =>
  REWRITERS[kind] === undefined
    ? text
    : declarations.reduce(
        (current, declaration) =>
          rewriteOne({ declaration, kind, text: current, versions }),
        text,
      );
