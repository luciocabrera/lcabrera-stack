/**
 * Raising the floor of every range this repository ships to the version it
 * publishes, so a repository created by a release cannot resolve a package
 * older than that release (ADR-117). Text in, text out: the file keeps every
 * byte the raise does not touch, and a floor this cannot locate is refused
 * rather than skipped, since the gate would then fail the release.
 */

import { inc, lt, minVersion, satisfies, validRange } from 'semver';

const PLACE = /^(?:catalog|workspace):/u;

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

const ENTRY =
  /^\s*(?:\[(?<identifier>\w+)\]|(?<keyQuote>['"])(?<key>[^'"]+)\k<keyQuote>)\s*:\s*(?<quote>['"])(?<range>[^'"]*)\k<quote>,?\s*$/u;

const BLOCK_END = /^\s*\};?\s*$/u;

const identifierValue = ({ identifier, text }) =>
  new RegExp(String.raw`const ${identifier} =\s*(['"])([^'"]+)\1`, 'u').exec(
    text,
  )?.[2];

const keyOf = ({ groups, text }) =>
  groups.identifier === undefined
    ? groups.key
    : identifierValue({ identifier: groups.identifier, text });

const blockOf = ({ constant, lines }) => {
  const start = lines.findIndex((line) =>
    line.includes(`const ${constant} = {`),
  );
  if (start === -1) return { end: -1, start };
  const length = lines
    .slice(start + 1)
    .findIndex((line) => BLOCK_END.test(line));
  return { end: length === -1 ? -1 : start + 1 + length, start };
};

const entryLines = ({ declaration, lines, text }) => {
  const { end, start } = blockOf({ constant: declaration.constant, lines });
  if (end === -1) {
    throw new Error(
      `${declaration.path}: no \`${declaration.constant}\` object literal found to raise \`${declaration.name}\` in`,
    );
  }
  return lines
    .map((line, index) => ({ groups: ENTRY.exec(line)?.groups, index }))
    .filter(({ index }) => index > start && index < end)
    .filter(({ groups }) => groups !== undefined)
    .filter(
      ({ groups }) =>
        keyOf({ groups, text }) === declaration.name &&
        groups.range === declaration.range,
    )
    .map(({ index }) => index);
};

const inConstant = ({ declaration, raised, text }) => {
  const lines = text.split('\n');
  const found = entryLines({ declaration, lines, text });
  if (found.length !== 1) {
    throw new Error(
      `${declaration.path}: \`${declaration.constant}\` holds ${found.length} literal entries for \`${declaration.name}\` reading \`${declaration.range}\`, and a raise needs exactly one`,
    );
  }
  return lines
    .map((line, index) =>
      index === found[0] ? line.replace(declaration.range, raised) : line,
    )
    .join('\n');
};

const REWRITERS = {
  catalog: inCatalog,
  constant: inConstant,
  manifest: inManifest,
};

/**
 * Every declaration whose floor sits below the published version, with the
 * range it is raised to.
 *
 * @param {{ declarations: readonly object[], versions: Record<string, string> }} args
 * @returns {{ declaration: object, raised: string }[]}
 */
export const floorRaises = ({ declarations, versions }) =>
  declarations
    .filter(({ name }) => typeof versions[name] === 'string')
    .map((declaration) => ({
      declaration,
      raised: raisedRange({
        range: declaration.range,
        version: versions[declaration.name],
      }),
    }))
    .filter(({ declaration, raised }) => raised !== declaration.range);

const rewriteOne = ({ declaration, kind, raised, text }) => {
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
    : floorRaises({ declarations, versions }).reduce(
        (current, { declaration, raised }) =>
          rewriteOne({ declaration, kind, raised, text: current }),
        text,
      );

/**
 * The changeset that publishes raised floors with the kit that ships them.
 *
 * @param {{ packageName: string, raised: readonly { from: string, name: string,
 *           path: string, to: string }[] }} args
 * @returns {string}
 */
export const floorChangeset = ({ packageName, raised }) =>
  [
    '---',
    `'${packageName}': patch`,
    '---',
    '',
    'A repository this release creates declares each of these from the version released with it, so it cannot resolve an older one:',
    '',
    ...raised.map(
      ({ from, name, path, to }) =>
        `- \`${name}\` \`${to}\` (was \`${from}\`) in \`${path}\``,
    ),
    '',
  ].join('\n');
