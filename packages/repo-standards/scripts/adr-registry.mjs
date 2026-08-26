/**
 * The ADR taxonomy, as data plus pure decisions over it. The effectful half —
 * reading the directories, writing an index — is `verify-adrs.mjs`.
 *
 * The rule this encodes: one home per tier, and one global number sequence
 * across all of them. See
 * docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md.
 */

import { DEFAULT_ADR_COMMANDS, readRegisters } from './config.mjs';

/**
 * Every directory allowed to hold an `ADR-NNN-*.md`, in index order. `tier` is
 * the stable key the gate reports.
 *
 * Homes are declared data, not derived: the reasoning is ADR-048's.
 */
const registers = readRegisters();

export const ADR_HOMES = registers.adrHomes;

/** Where an unadopted proposal waits. A draft holds no number — see below. */
export const DRAFT_DIR = registers.adrDraftDir;

/** The section shape a new ADR starts from. Named with a leading underscore so
 *  it sorts above the ADRs and cannot be mistaken for one. */
export const TEMPLATE_FILE = '_TEMPLATE.md';

/** The single home that holds the template; the other indexes link to it. */
export const TEMPLATE_HOME = registers.adrTemplateHome;

/**
 * How a home's readers run these gates. It rides on the HOME rather than on
 * module state, for two reasons that pull the same way.
 *
 * Module state would read this repository's config at load, so anything
 * rendering an index for somewhere else — the seed `@lcabrera/devkit` ships — would
 * silently get this repository's task runner in it, which is the exact leak the
 * seed gate exists to catch. And a home is already `renderIndex`'s one argument,
 * so carrying it here costs nothing: the signature stays arity 1, which is the
 * property that keeps the directory from coming back in (ADR-075).
 */
const commandsFor = (home) => home.commands ?? DEFAULT_ADR_COMMANDS;

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
 * Numbers a repository already lets mean two things, because each of its homes
 * once started its own sequence at 001. They are not renumbered: an ADR is a
 * dated record, and every merged PR, issue and commit citing one would silently
 * start pointing elsewhere. Each may appear exactly twice; nothing else may
 * repeat.
 *
 * Declared rather than hardcoded, and empty by default — an overlap is the host
 * repository's own history, so a set baked in here would exempt numbers a
 * consumer never duplicated. Adding one licenses a NEW collision rather than
 * tolerating an old one, so a repository declares only the pairs it really has.
 */
const GRANDFATHERED_DUPLICATES = new Set(registers.adrGrandfatheredDuplicates);

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

/**
 * Every number used more than the taxonomy allows, with where it is used.
 *
 * `grandfathered` is a parameter rather than a direct read of the module-level set
 * so both branches stay reachable from a test. This repository declares none, so
 * without the seam the `> 2` side would have no coverage at all and deleting it
 * would keep the suite green — while remaining live behaviour for any consumer
 * that declares its own overlaps.
 */
const duplicateFindings = (homes, grandfathered = GRANDFATHERED_DUPLICATES) => {
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
      grandfathered.has(number) ? at.length > 2 : at.length > 1,
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
export const adrFindings = ({
  drafts,
  grandfathered = GRANDFATHERED_DUPLICATES,
  homes,
  strays,
}) => [
  ...strayFindings(strays),
  ...homes.flatMap((home) => homeFindings(home, home.entries)),
  ...duplicateFindings(homes, grandfathered),
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

/** One listing row, linked from the repository root so that every home's rows
 *  read the same way in one combined listing. */
const listingRow = (home, entry) => {
  const parsed = parseAdrFilename(entry.filename);
  const number = parsed === undefined ? '?' : pad(parsed.number);
  const title = entry.title.replaceAll('|', ESCAPED_PIPE);
  return `| [ADR-${number}](${home.dir}/${entry.filename}) | ${title} |`;
};

/**
 * Every home's ADRs with their titles, for `vp run adr:list`. This is the table
 * that used to be committed into each index; producing it on demand is what
 * keeps two concurrent ADR branches off the same lines (ADR-075).
 *
 * `homes` is `{ dir, title, entries: [{ filename, title }] }` per home.
 */
export const renderListing = (homes) =>
  homes
    .flatMap((home) => [
      `## ${home.title} — \`${home.dir}\``,
      '',
      '| ADR | Decision |',
      '| --- | --- |',
      ...[...home.entries]
        .sort((a, b) => a.filename.localeCompare(b.filename))
        .map((entry) => listingRow(home, entry)),
      '',
    ])
    .join('\n');

/** The path from one home back up to the home that holds the template; that
 *  home links to its own copy directly. */
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
 * Oxfmt formats markdown after this file has generated it. Compare bytes
 * instead of this, and the reformatted file reads as stale while regenerating
 * un-formats it again — a loop with no exit. The two differences absorbed here
 * are table column padding, which is what produced that loop back when the
 * index carried a table, and line-end whitespace.
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
 * What the index says about numbering, which depends on what the consuming
 * repository has declared — and both registers default to the quiet case.
 *
 * The cross-home sentence is the whole point of the register when there are
 * several homes: a number identifies one ADR across the repository, not one per
 * directory. Rendered into a repository with a single home it is not false, it
 * is vacuous, and it reads as though the reader has missed a second directory.
 *
 * The uniqueness claim is stated flatly only while `adrGrandfatheredDuplicates`
 * is empty, which is its default. A declared exemption lets one number name two
 * ADRs — in ONE home as readily as across two, because the duplicate check is
 * home-agnostic — so a repository that declares one would otherwise be handed a
 * generated page contradicting its own directory.
 *
 * The single-home wording carries the fact that is load-bearing there and is not
 * obvious from the directory: `nextFreeNumber` takes the highest number in use
 * and adds one, so a gap is never filled and a retired ADR's number stays
 * retired.
 *
 * The exception is stated because it is reachable and is the likeliest
 * retirement: the maximum is computed from the files PRESENT, so deleting the
 * highest-numbered ADR lowers it and the next `adr:new` takes that number back.
 * A citation of the retired one then points at a different decision. Promising
 * otherwise would be a load-bearing claim in generated prose that no mechanism
 * keeps (#974).
 */
const numberingParagraph = ({ exemptionCount, homeCount }) => [
  ...(homeCount > 1
    ? [
        'Numbers are unique across every ADR home in this repository, so a decision',
        'that spans two of them is still one record.',
      ]
    : ['A number identifies exactly one ADR.']),
  ...(exemptionCount > 0
    ? [
        'The exception is the numbers this repository has declared in',
        '`adrGrandfatheredDuplicates`, each of which may name two ADRs; every other',
        'repeat is rejected.',
      ]
    : []),
  'The next free number is taken from the highest in use rather than the first',
  'gap, so retiring an ADR leaves its number unused — unless it was the highest,',
  'which frees it for the next.',
];

/**
 * A home's `README.md`: what is true of the home itself, and deliberately not a
 * row per ADR.
 *
 * **It takes no entries, and that is deliberate.** A committed list is one
 * region every ADR branch appends to, so two branches adding different ADRs
 * conflict on it however carefully their numbers are sequenced (#724). An index
 * that cannot see the directory cannot differ between two branches that hold
 * different ADRs, so there is nothing to conflict on. `renderListing` produces
 * the list on demand instead — see ADR-075.
 *
 * Feeding the directory back in restores the conflict. The test that catches
 * that reads the rendered output, not this signature: a defaulted second
 * parameter would leave the arity at 1.
 *
 * Everything it writes has to resolve in the repository it is generated INTO:
 * the commands are this package's own bins, not one repository's task names,
 * and the reasoning it used to cite by link is inlined, because a fresh home
 * has neither file.
 *
 * `homeCount` rides in an options object rather than as a bare second argument
 * for two reasons: `Function.length` stops counting at the first default, so the
 * arity stays 1; and the ADR-075 test above deliberately calls this with an
 * array as the second argument to prove entries cannot be injected that way —
 * destructuring an array yields the default, so that probe keeps working.
 */
export const renderIndex = (
  home,
  {
    exemptionCount = GRANDFATHERED_DUPLICATES.size,
    homeCount = ADR_HOMES.length,
  } = {},
) => {
  const commands = commandsFor(home);

  return [
    `# ${home.title} — ADR index`,
    '',
    `<!-- Generated by \`${commands.write}\`. Do not edit by hand. -->`,
    '',
    home.blurb,
    '',
    ...numberingParagraph({ exemptionCount, homeCount }),
    '',
    `Writing one: start from [\`_TEMPLATE.md\`](${fileInTemplateHome(home.dir, TEMPLATE_FILE)})`,
    `or run \`${commands.new}\`, which takes the next free number for you.`,
    '',
    'The ADRs are the `ADR-NNN-*.md` files [in this directory](./), whose names',
    'carry their titles; this page does not list them on purpose, because a',
    'committed list is one region every ADR branch appends to, so any two',
    'concurrent ADRs would conflict on it even when their numbers are correctly',
    `sequenced. Run \`${commands.list}\` for every ADR with its title.`,
    '',
  ].join('\n');
};
