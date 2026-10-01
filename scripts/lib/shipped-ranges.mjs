/**
 * Whether a dependency range this repository ships — in a devkit asset, or in
 * a range constant a devkit command writes from — still admits the package
 * this repository publishes under that name, and the minor after it, and
 * admits no release older than that one.
 *
 * The decision and its boundaries are ADR-117 and its amendment. Ranges are
 * evaluated by `semver`, never by hand.
 */

import { inc, lt, minVersion, satisfies, validRange } from 'semver';

const DECLARING_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

const PLACE = /^(?:catalog|workspace):/u;

const INDENTED = /^\s/u;

const COMMENT = /(?:^|\s)#/u;

const WHITESPACE = /\s/u;

const QUOTES = new Set(["'", '"']);

const NOT_A_NAME = /[^\w./@-]+/u;

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

const at = ({ name, path }) => JSON.stringify([path, name]);

/**
 * @param {{ path: string, text: string }} args
 */
export const catalogRanges = ({ path, text }) =>
  text
    .split('\n')
    .flatMap((line, index) =>
      entryOn({ line: index + 1, path, text: withoutComment(line) }),
    );

/**
 * @param {{ manifest: object, path: string }} args
 */
export const manifestRanges = ({ manifest, path }) =>
  DECLARING_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .filter(([, range]) => typeof range === 'string')
      .map(([name, range]) => ({ field, name, path, range })),
  );

/**
 * @param {{ constant: string, path: string, ranges: Record<string, string> }} args
 */
export const constantRanges = ({ constant, path, ranges }) =>
  Object.entries(ranges).map(([name, range]) => ({
    constant,
    field: constant,
    name,
    path,
    range,
  }));

const tokensIn = ({ hashComments, text }) =>
  new Set(
    text
      .split('\n')
      .flatMap((line) =>
        (hashComments ? withoutComment(line) : line).split(NOT_A_NAME),
      ),
  );

/**
 * @param {{ hashComments?: boolean, names: readonly string[], path: string, text: string }} args
 */
export const mentionsIn = ({ hashComments = false, names, path, text }) => {
  const tokens = tokensIn({ hashComments, text });

  return names
    .filter((name) => tokens.has(name))
    .map((name) => ({ name, path }));
};

const READER_BY_NAME = new Map([
  ['package.json', 'manifest'],
  ['pnpm-workspace.yaml', 'catalog'],
]);

const SCANNED_EXTENSIONS = new Set([
  '.json',
  '.json5',
  '.jsonc',
  '.yaml',
  '.yml',
]);

const HASH_COMMENT_EXTENSIONS = new Set(['.yaml', '.yml']);

const extensionOf = (fileName) => fileName.slice(fileName.lastIndexOf('.'));

/**
 * @param {string} fileName
 */
export const sourceOf = (fileName) => {
  const extension = extensionOf(fileName);
  if (!SCANNED_EXTENSIONS.has(extension)) return undefined;

  return {
    hashComments: HASH_COMMENT_EXTENSIONS.has(extension),
    kind: READER_BY_NAME.get(fileName) ?? 'scanned',
  };
};

const REQUIRED_SHAPES = [
  { from: 'the shipped assets', kind: 'manifest', shape: 'manifest' },
  { from: 'the shipped assets', kind: 'catalog', shape: 'workspace catalog' },
  {
    from: 'the list of range constants',
    kind: 'constant',
    shape: 'range constant',
  },
];

/**
 * @param {readonly { kind: string }[]} sources
 */
const missingShapes = (sources) =>
  REQUIRED_SHAPES.filter(
    ({ kind }) => !sources.some((source) => source.kind === kind),
  ).map(({ from, shape }) => ({ from, kind: 'no-source', shape }));

const PROMISING_ENTRIES = new Map([
  ['catalog', 'workspace catalog'],
  ['constant', 'range constant'],
]);

/**
 * @param {{ declarations: readonly object[], sources: readonly object[] }} args
 */
const quietSources = ({ declarations, sources }) =>
  sources
    .filter(({ kind }) => PROMISING_ENTRIES.has(kind))
    .filter(
      (source) =>
        !declarations.some(
          (entry) =>
            entry.path === source.path && entry.constant === source.constant,
        ),
    )
    .map(({ constant, kind, path }) => ({
      constant,
      kind: 'no-declarations',
      path,
      shape: PROMISING_ENTRIES.get(kind),
    }));

/**
 * @param {{ declarations: readonly object[], versions: Record<string, string> }} args
 */
const unpublishedConstants = ({ declarations, versions }) =>
  declarations
    .filter(({ constant }) => constant !== undefined)
    .filter(({ name }) => typeof versions[name] !== 'string')
    .map((declaration) => ({ ...declaration, kind: 'unpublished' }));

const verdict = ({ declaration, version }) => {
  if (validRange(declaration.range) === null) return 'malformed';
  if (!satisfies(version, declaration.range)) return 'excludes-current';
  if (!satisfies(inc(version, 'minor'), declaration.range)) {
    return 'excludes-next-minor';
  }
  if (lt(minVersion(declaration.range).version, version)) {
    return 'floor-below-current';
  }
  return 'admits';
};

const rangeFinding = ({ declaration, versions }) => {
  const version = versions[declaration.name];
  const kind = verdict({ declaration, version });

  return kind === 'admits' ? [] : [{ ...declaration, kind, version }];
};

/**
 * @param {{ declarations: readonly object[], mentions: readonly object[], sources?: readonly object[], versions: Record<string, string> }} args
 */
export const shippedRangeFindings = ({
  declarations,
  mentions,
  sources = [],
  versions,
}) => {
  const structural = missingShapes(sources);
  if (mentions.length === 0) return [...structural, { kind: 'nothing-read' }];

  const owned = declarations.filter(
    ({ name }) => typeof versions[name] === 'string',
  );
  const declared = new Set(owned.map((declaration) => at(declaration)));

  const shapeOf = new Map(sources.map(({ kind, path }) => [path, kind]));

  const unread = mentions
    .filter((mention) => !declared.has(at(mention)))
    .map((mention) => ({
      ...mention,
      kind: 'unread',
      shape: shapeOf.get(mention.path),
    }));

  return [
    ...structural,
    ...quietSources({ declarations, sources }),
    ...unpublishedConstants({ declarations, versions }),
    ...unread,
    ...owned
      .filter((declaration) => !PLACE.test(declaration.range))
      .flatMap((declaration) => rangeFinding({ declaration, versions })),
  ];
};

const where = ({ field, line, path }) =>
  [path, line === undefined ? field : line].filter(Boolean).join(':');

const suggestion = (version) => `>=${version} <${inc(version, 'major')}`;

const REASONS = {
  'excludes-current': (finding) =>
    `\`${finding.range}\` excludes ${finding.version}, the version this repository publishes`,
  'excludes-next-minor': (finding) =>
    `\`${finding.range}\` admits ${finding.version} but not ${inc(finding.version, 'minor')}, so the next minor release leaves a created repository behind`,
  'floor-below-current': (finding) =>
    `\`${finding.range}\` admits releases older than ${finding.version}, the version this repository publishes, so a repository created by this release can resolve one that predates it; \`vp run shipped-ranges:raise\` raises every floor`,
  malformed: (finding) =>
    `\`${finding.range}\` is not a version range — only \`catalog:\` and \`workspace:\` stand in for one, because they name where the version is declared rather than pinning an artifact`,
};

const NOTHING_READ =
  'no shipped file names a package this repository publishes — the assets moved, or the walk stopped reaching them';

const noDeclarationsLine = (finding) =>
  `${[finding.path, finding.constant].filter(Boolean).join(':')}  is a ${finding.shape} and yielded no entry — the file changed shape, or the reader stopped reading it`;

const noSourceLine = (finding) =>
  `${finding.from} yielded no ${finding.shape} to read — the walk narrowed, or the sources moved`;

const unpublishedLine = (finding) =>
  `${where(finding)}  ${finding.name}: this repository publishes no package of that name, and a range constant holds only its own — the package was renamed, or the entry is stale`;

const unreadLine = (finding) =>
  finding.shape === 'scanned'
    ? `${finding.path}  names ${finding.name}, and this gate reads no declaration out of a file of that shape — either it declares a range in a shape the gate has not been taught, or the mention is incidental there`
    : `${finding.path}  names ${finding.name} and no declaration of it was read there — the file's shape moved, or the reader stopped reading it`;

/**
 * @param {object} finding
 */
export const findingLine = (finding) => {
  if (finding.kind === 'no-declarations') return noDeclarationsLine(finding);
  if (finding.kind === 'no-source') return noSourceLine(finding);
  if (finding.kind === 'nothing-read') return NOTHING_READ;
  if (finding.kind === 'unread') return unreadLine(finding);
  if (finding.kind === 'unpublished') return unpublishedLine(finding);

  return `${where(finding)}  ${finding.name}: ${REASONS[finding.kind](finding)} — write \`${suggestion(finding.version)}\``;
};

/**
 * @param {{ declarations: readonly object[], mentions: readonly object[], sources: readonly { kind: string }[] }} args
 */
export const passLine = ({ declarations, mentions, sources }) => {
  const files = sources.filter(({ kind }) => kind !== 'constant');
  const parsed = files.filter(({ kind }) => kind !== 'scanned').length;
  const constants = sources.length - files.length;

  return `Shipped range gate passed: ${declarations.length} declaration(s) read from ${parsed} shipped file(s) and ${constants} range constant(s); ${files.length} shipped data file(s) scanned for a package this repository publishes, ${mentions.length} mention(s) found, each one read.`;
};
