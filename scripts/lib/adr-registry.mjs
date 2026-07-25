/**
 * The ADR taxonomy, as data plus pure decisions over it. The effectful half —
 * reading the directories, writing an index — is `scripts/verify-adrs.mjs`.
 *
 * The rule this encodes: one home per tier, chosen by what survives the CQMS
 * extraction, and one global number sequence across all of them. See
 * docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md.
 */

/**
 * Every directory allowed to hold an `ADR-NNN-*.md`, in index order. `tier` is
 * the stable key the gate reports; `keeps` says what happens to the directory
 * when CQMS moves to its own repository, which is the whole reason the split
 * runs where it does.
 */
export const ADR_HOMES = [
  {
    blurb:
      'The repository, its published `@lcabrera/*` packages, and the toolchain. Stays here when CQMS is extracted.',
    dir: 'docs/decisions',
    keeps: true,
    tier: 'repo',
    title: 'Repository, packages & tooling',
  },
  {
    blurb:
      'CQMS / CodePulse product decisions — schema, scanners, ingestion, orchestration. Moves with the app.',
    dir: 'docs/cqms/decisions',
    keeps: false,
    tier: 'cqms',
    title: 'CQMS / CodePulse',
  },
  {
    blurb:
      'Decisions internal to the `apps/react-router` showcase app — its components, routes and interaction model.',
    dir: 'apps/react-router/docs/decisions',
    keeps: true,
    tier: 'app',
    title: 'React Router showcase app',
  },
];

/** Where an unadopted proposal waits. A draft holds no number — see below. */
export const DRAFT_DIR = 'docs/agents/planning/adr-drafts';

/** The section shape a new ADR starts from. Named with a leading underscore so
 *  it sorts above the ADRs and cannot be mistaken for one. */
export const TEMPLATE_FILE = '_TEMPLATE.md';

/** The single home that holds the template; the other indexes link to it. */
export const TEMPLATE_HOME = 'docs/decisions';

/**
 * Markdown that lives in a home without being an ADR: the generated index, and
 * the template a new ADR is copied from. Both would otherwise be read as
 * entries and reported as malformed filenames.
 *
 * The template is kept in ONE home (`docs/decisions`) and linked from the other
 * two indexes rather than copied into each — three copies is three things to
 * keep in step, and `docs/README.md`'s rule is one canonical home per fact.
 */
export const NON_ADR_FILES = new Set(['README.md', TEMPLATE_FILE]);

/**
 * Numbers that already meant two things before the one-sequence rule existed:
 * the showcase app and the then-single `docs/cqms/decisions` sequence both
 * started at 001. They are not renumbered, because an ADR is a dated record and
 * every merged PR, issue and commit citing one would silently start pointing at
 * a different document. Each may appear exactly twice; nothing else may repeat.
 */
const GRANDFATHERED_DUPLICATES = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
]);

const FILENAME = /^ADR-(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

/** The H1 of an ADR, whose number must agree with its filename. */
const HEADING = /^#\s*ADR-(\d+)\b/;

/** `ADR-001-slug.md` to its parts, or undefined when the name is malformed. */
export const parseAdrFilename = (filename) => {
  const match = FILENAME.exec(filename);
  return match === null
    ? undefined
    : { number: Number(match[1]), slug: match[2] };
};

/**
 * Whether a filename claims to be an ADR at all, however badly spelled — a
 * numbered `ADR` prefix in any casing or separator. The digit is what keeps this
 * from swallowing ordinary documents that merely start with the letters, such as
 * the `adr-taxonomy` coordination task that produced this rule.
 */
export const looksLikeAdr = (filename) => /^ADR[-_ ]?\d/i.test(filename);

/** The number an ADR's H1 declares, or undefined when it declares none. */
export const headingNumber = (markdown) => {
  const line = markdown.split('\n').find((text) => text.startsWith('# '));
  const match = line === undefined ? null : HEADING.exec(line);
  return match === null ? undefined : Number(match[1]);
};

/** The H1 with its `ADR-NNN` prefix and separator removed. (pure) */
export const headingTitle = (markdown) => {
  const line = markdown.split('\n').find((text) => text.startsWith('# '));
  return line === undefined
    ? ''
    : line
        .replace(/^#\s*/, '')
        .replace(/^ADR-\d+\s*(?:[:—–-]\s*)?/, '')
        .trim();
};

const pad = (number) => String(number).padStart(3, '0');

/**
 * Findings for one home's entries: a malformed filename, or an H1 whose number
 * disagrees with the file it is in. Both are silent today — nothing reads an
 * ADR's heading — and both make a citation resolve to the wrong document.
 */
const homeFindings = (home, entries) =>
  entries.flatMap((entry) => {
    const parsed = parseAdrFilename(entry.filename);
    if (parsed === undefined) {
      return [
        `${home.dir}/${entry.filename} — filename must be ADR-NNN-kebab-slug.md`,
      ];
    }
    const declared = entry.headingNumber;
    return declared === undefined || declared === parsed.number
      ? []
      : [
          `${home.dir}/${entry.filename} — its heading says ADR-${pad(declared)}; the filename says ADR-${pad(parsed.number)}`,
        ];
  });

/** Every number used more than the taxonomy allows, with where it is used. */
const duplicateFindings = (homes) => {
  const uses = new Map();
  for (const home of homes) {
    for (const entry of home.entries) {
      const parsed = parseAdrFilename(entry.filename);
      if (parsed === undefined) {
        continue;
      }
      const at = uses.get(parsed.number) ?? [];
      uses.set(parsed.number, [...at, `${home.dir}/${entry.filename}`]);
    }
  }
  return [...uses.entries()]
    .filter(([number, at]) =>
      GRANDFATHERED_DUPLICATES.has(number) ? at.length > 2 : at.length > 1,
    )
    .map(
      ([number, at]) =>
        `ADR-${pad(number)} is used by ${at.length} documents: ${at.join(', ')}. A number identifies one ADR; take the next free one.`,
    );
};

/**
 * A draft that carries a number has reserved it without owning it, and the
 * sequence moves on underneath: that is exactly how two ADR-047s came to exist.
 * A draft is numbered at promotion, never before.
 */
const draftFindings = (draftFilenames) =>
  draftFilenames
    .filter((filename) => looksLikeAdr(filename))
    .map(
      (filename) =>
        `${DRAFT_DIR}/${filename} — a draft must not carry an ADR number; it gets one when it is adopted`,
    );

/** An `ADR-*.md` sitting outside every declared home. */
const strayFindings = (strayPaths) =>
  strayPaths.map(
    (path) =>
      `${path} — not in a declared ADR home (${ADR_HOMES.map((home) => home.dir).join(', ')})`,
  );

/**
 * Every violation, in one pass, so a run reports the whole picture rather than
 * the first thing it trips over.
 *
 * `homes` is `{ dir, entries: [{ filename, headingNumber }] }` per home.
 */
export const adrFindings = ({ drafts, homes, strays }) => [
  ...strayFindings(strays),
  ...homes.flatMap((home) => homeFindings(home, home.entries)),
  ...duplicateFindings(homes),
  ...draftFindings(drafts),
];

/** One greater than the highest number in use anywhere — the next free one. */
export const nextFreeNumber = (homes) => {
  const numbers = homes.flatMap((home) =>
    home.entries
      .map((entry) => parseAdrFilename(entry.filename)?.number)
      .filter((number) => number !== undefined),
  );
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
};

/** A pipe inside a title would end the cell, so it is escaped. */
const ESCAPED_PIPE = String.raw`\|`;

const indexRow = (entry) => {
  const parsed = parseAdrFilename(entry.filename);
  const number = parsed === undefined ? '?' : pad(parsed.number);
  const title = entry.title.replaceAll('|', ESCAPED_PIPE);
  return `| [ADR-${number}](./${entry.filename}) | ${title} |`;
};

const TAXONOMY_ADR_FILE = 'ADR-048-adr-taxonomy-and-one-sequence.md';

/** The path from one home back up to `docs/decisions`, which holds both ADR-048
 *  and the template. `docs/decisions` links to its own files directly. */
const fileInTemplateHome = (dir, filename) => {
  const up = dir
    .split('/')
    .map(() => '..')
    .join('/');
  const prefix = dir === TEMPLATE_HOME ? '.' : `${up}/${TEMPLATE_HOME}`;
  return `${prefix}/${filename}`;
};

/**
 * An index reduced to its content, so the freshness check survives Oxfmt.
 *
 * Oxfmt formats markdown, and it pads table columns to align them; this renders
 * them compact. Both spellings are the same index, so a byte comparison would
 * report every generated file as stale the moment `vp fmt` touched it — and
 * regenerating would un-format it again, which is a loop with no exit. Collapse
 * the padding and compare what the table says.
 */
export const normalizeIndex = (markdown) =>
  markdown
    .split('\n')
    .map((line) =>
      line.startsWith('|')
        ? line
            .split('|')
            .map((cell) => cell.trim().replace(/^-{3,}$/, '---'))
            .join('|')
        : line.trimEnd(),
    )
    .join('\n')
    .trim();

/**
 * A home's `README.md`, rendered from the directory itself. Generated rather
 * than hand-kept: an index nobody regenerates is the same rot the ADRs already
 * had, one level up.
 */
export const renderIndex = (home, entries) =>
  [
    `# ${home.title} — ADR index`,
    '',
    '<!-- Generated by `vp run adr:verify -- --write`. Do not edit by hand. -->',
    '',
    home.blurb,
    '',
    home.keeps
      ? '**Survives the CQMS extraction.**'
      : '**Moves with CQMS when it is extracted.**',
    '',
    `Numbers are unique across every ADR home in this repo — see [ADR-048](${fileInTemplateHome(home.dir, TAXONOMY_ADR_FILE)})`,
    'for why, and for what to do with a decision that spans two tiers.',
    '',
    `Writing one: start from [\`_TEMPLATE.md\`](${fileInTemplateHome(home.dir, TEMPLATE_FILE)})`,
    'or run `vp run adr:new`, which takes the next free number for you.',
    '',
    '| ADR | Decision |',
    '| --- | --- |',
    ...[...entries]
      .sort((a, b) => a.filename.localeCompare(b.filename))
      .map((entry) => indexRow(entry)),
    '',
  ].join('\n');
