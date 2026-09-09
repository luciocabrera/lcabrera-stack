/**
 * Whether a dependency range a shipped asset carries still admits the package
 * this repository publishes under that name, and the minor after it.
 *
 * Below 1.0.0 a caret stops at the next minor, so a literal in a bootstrapped
 * tree hands a consumer the release before last the day one ships — and stays
 * syntactically valid while it falls further behind. Background: #1129.
 *
 * Ranges are evaluated by `semver`, never by hand.
 */

import { inc, satisfies, validRange } from 'semver';

const LITERAL_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

const PROTOCOL = /^[a-z]+:/u;

const INDENTED = /^\s/u;

const COMMENT = /\s#/u;

const WHITESPACE = /\s/u;

const QUOTES = new Set(["'", '"']);

const unquoted = (value) =>
  value.length > 1 && QUOTES.has(value[0]) && value.at(-1) === value[0]
    ? value.slice(1, -1)
    : value;

const withoutComment = (line) => {
  const start = line.search(COMMENT);
  return start === -1 ? line : line.slice(0, start);
};

const entryOn = ({ line, path, text }) => {
  const separator = text.indexOf(':');
  if (separator === -1 || !INDENTED.test(text)) return [];

  const name = unquoted(text.slice(0, separator).trim());
  const range = unquoted(text.slice(separator + 1).trim());
  if (name === '' || range === '' || WHITESPACE.test(name)) return [];

  return [{ line, name, path, range }];
};

/**
 * Every `name: range` pair a workspace YAML declares, wherever it sits in the
 * file. Which of them matter is decided against the published roster, not here.
 *
 * @param {{ path: string, text: string }} args
 */
export const catalogRanges = ({ path, text }) =>
  text
    .split('\n')
    .flatMap((line, index) =>
      entryOn({ line: index + 1, path, text: withoutComment(line) }),
    );

/**
 * Every literal range a manifest declares. A `catalog:`, `workspace:` or `npm:`
 * specifier is not one: it names where the version is declared instead of
 * declaring it, so there is nothing here that can fall behind.
 *
 * @param {{ manifest: object, path: string }} args
 */
export const manifestRanges = ({ manifest, path }) =>
  LITERAL_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .filter(([, range]) => typeof range === 'string' && !PROTOCOL.test(range))
      .map(([name, range]) => ({ field, name, path, range })),
  );

const verdict = ({ declaration, version }) => {
  if (validRange(declaration.range) === null) return 'malformed';
  if (!satisfies(version, declaration.range)) return 'excludes-current';
  if (!satisfies(inc(version, 'minor'), declaration.range)) {
    return 'excludes-next-minor';
  }
  return 'admits';
};

/**
 * What is wrong with the shipped ranges, given the versions this repository
 * publishes.
 *
 * An empty roster match is itself a finding: an extractor that reads nothing
 * reports the same clean pass as assets that are correct, and a gate nobody can
 * distinguish from a broken one settles nothing.
 *
 * @param {{ declarations: readonly object[], versions: Record<string, string> }} args
 */
export const shippedRangeFindings = ({ declarations, versions }) => {
  const owned = declarations.filter(
    ({ name }) => typeof versions[name] === 'string',
  );

  if (owned.length === 0) return [{ kind: 'nothing-read' }];

  return owned.flatMap((declaration) => {
    const version = versions[declaration.name];
    const kind = verdict({ declaration, version });

    return kind === 'admits' ? [] : [{ ...declaration, kind, version }];
  });
};

const where = ({ field, line, path }) =>
  [path, line === undefined ? field : line].filter(Boolean).join(':');

const suggestion = (version) => `>=${version} <${inc(version, 'major')}`;

const REASONS = {
  'excludes-current': (finding) =>
    `\`${finding.range}\` excludes ${finding.version}, the version this repository publishes`,
  'excludes-next-minor': (finding) =>
    `\`${finding.range}\` admits ${finding.version} but not ${inc(finding.version, 'minor')}, so the next minor release leaves a created repository behind`,
  malformed: (finding) => `\`${finding.range}\` is not a version range`,
};

/**
 * One line a reader can act on: where the range is, what is wrong with it, and
 * what admits every release up to the next major.
 *
 * @param {object} finding
 */
export const findingLine = (finding) =>
  finding.kind === 'nothing-read'
    ? 'no shipped file declares a range for a package this repository publishes — the assets moved, or the reader stopped reading them'
    : `${where(finding)}  ${finding.name}: ${REASONS[finding.kind](finding)} — write \`${suggestion(finding.version)}\``;
