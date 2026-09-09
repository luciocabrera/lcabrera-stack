/**
 * Whether a dependency range a shipped asset carries still admits the package
 * this repository publishes under that name, and the minor after it.
 *
 * Below 1.0.0 a caret stops at the next minor, so a literal in a bootstrapped
 * tree hands a consumer the release before last the day one ships — and stays
 * syntactically valid while it falls further behind. Background: #1129.
 *
 * A file that names a published package and yields no declaration for it is a
 * finding here, not a clean file: that is what a reader looks like once the
 * shape it parses has moved under it.
 *
 * Ranges are evaluated by `semver`, never by hand.
 */

import { inc, satisfies, validRange } from 'semver';

const DECLARING_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

const PLACE = /^(?:catalog|workspace):/u;

const INDENTED = /^\s/u;

const COMMENT = /\s#/u;

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
 * Every `name: value` pair a workspace YAML declares, wherever it sits in the
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
 * Every dependency a manifest declares, pointers included. A `catalog:`,
 * `workspace:` or `npm:` specifier names where the version is declared instead
 * of declaring it, so nothing there can fall behind — but it is still a
 * declaration this reader saw, which is what tells it apart from a name it
 * failed to read.
 *
 * @param {{ manifest: object, path: string }} args
 */
export const manifestRanges = ({ manifest, path }) =>
  DECLARING_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .filter(([, range]) => typeof range === 'string')
      .map(([name, range]) => ({ field, name, path, range })),
  );

const tokensIn = ({ hashComments, text }) =>
  new Set(
    text
      .split('\n')
      .flatMap((line) =>
        (hashComments ? withoutComment(line) : line).split(NOT_A_NAME),
      ),
  );

/**
 * Where a shipped file names a package this repository publishes, whether or
 * not a reader made a declaration of it. Read as whole tokens, so a longer name
 * that starts with a shorter one is not one mention of each; `hashComments` says
 * whether this file's syntax has `#` comments to drop, because applying one
 * syntax's rule to another file makes two readers disagree about it.
 *
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
 * What a shipped file is to this gate: a shape it reads declarations out of, a
 * data file it only scans for names, or nothing.
 *
 * Every shipped data file is scanned even when no reader parses it, because a
 * declaring file that leaves the reader's set — renamed, or a shape nobody
 * taught this gate — otherwise takes its own mentions with it and goes quiet
 * with no finding to name it.
 *
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
  { kind: 'manifest', shape: 'manifest' },
  { kind: 'catalog', shape: 'workspace catalog' },
];

/**
 * The shapes this gate knows how to read, both of which the shipped assets are
 * expected to carry. A run that found neither read less than it was built to
 * read, and says so instead of reporting the coverage it managed.
 *
 * @param {readonly { kind: string }[]} sources
 */
const missingShapes = (sources) =>
  REQUIRED_SHAPES.filter(
    ({ kind }) => !sources.some((source) => source.kind === kind),
  ).map(({ shape }) => ({ kind: 'no-source', shape }));

/**
 * A file the walk selected as a catalog and read nothing out of. A catalog is
 * the one shape that promises entries — a manifest may legitimately declare
 * none — so zero of them means the reader, not the file, has gone quiet.
 *
 * @param {{ declarations: readonly object[], sources: readonly object[] }} args
 */
const quietCatalogs = ({ declarations, sources }) =>
  sources
    .filter(({ kind }) => kind === 'catalog')
    .filter(({ path }) => !declarations.some((entry) => entry.path === path))
    .map(({ path }) => ({
      kind: 'no-declarations',
      path,
      shape: 'workspace catalog',
    }));

const verdict = ({ declaration, version }) => {
  if (validRange(declaration.range) === null) return 'malformed';
  if (!satisfies(version, declaration.range)) return 'excludes-current';
  if (!satisfies(inc(version, 'minor'), declaration.range)) {
    return 'excludes-next-minor';
  }
  return 'admits';
};

const rangeFinding = ({ declaration, versions }) => {
  const version = versions[declaration.name];
  const kind = verdict({ declaration, version });

  return kind === 'admits' ? [] : [{ ...declaration, kind, version }];
};

/**
 * What is wrong with the shipped ranges, given the versions this repository
 * publishes and where those packages are named.
 *
 * A name a shipped file mentions but no reader declared is reported per file,
 * because a reader that has gone quiet on one source reports exactly the pass a
 * correct one does — and one that still reads the other source hides it behind
 * a finding count above zero.
 *
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

  const unread = mentions
    .filter((mention) => !declared.has(at(mention)))
    .map((mention) => ({ ...mention, kind: 'unread' }));

  return [
    ...structural,
    ...quietCatalogs({ declarations, sources }),
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
  malformed: (finding) =>
    `\`${finding.range}\` is not a version range — only \`catalog:\` and \`workspace:\` stand in for one, because they name where the version is declared rather than pinning an artifact`,
};

const NOTHING_READ =
  'no shipped file names a package this repository publishes — the assets moved, or the walk stopped reaching them';

const noDeclarationsLine = (finding) =>
  `${finding.path}  is a ${finding.shape} and yielded no entry — the file changed shape, or the reader stopped reading it`;

const noSourceLine = (finding) =>
  `the shipped assets yielded no ${finding.shape} to read — the walk narrowed, or the assets moved`;

const unreadLine = (finding) =>
  `${finding.path}  names ${finding.name} and no declaration of it was read there — the file's shape moved, or the reader stopped reading it`;

/**
 * One line a reader can act on: where the range is, what is wrong with it, and
 * what admits every release up to the next major.
 *
 * @param {object} finding
 */
export const findingLine = (finding) => {
  if (finding.kind === 'no-declarations') return noDeclarationsLine(finding);
  if (finding.kind === 'no-source') return noSourceLine(finding);
  if (finding.kind === 'nothing-read') return NOTHING_READ;
  if (finding.kind === 'unread') return unreadLine(finding);

  return `${where(finding)}  ${finding.name}: ${REASONS[finding.kind](finding)} — write \`${suggestion(finding.version)}\``;
};
