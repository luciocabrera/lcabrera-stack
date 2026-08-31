/**
 * The ADR taxonomy, as data plus pure decisions over it. The effectful half —
 * reading the directories, writing an index — is `verify-adrs.mjs`.
 *
 * The rule this encodes: one home per tier, and one global number sequence
 * across all of them. See
 * docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md.
 */

import { REPOSITORY_SCOPE } from './adr-content.mjs';
import { DEFAULT_ADR_COMMANDS, readRegisters } from './config.mjs';

const registers = readRegisters();

export const ADR_HOMES = registers.adrHomes;

export const DRAFT_DIR = registers.adrDraftDir;

export const TEMPLATE_FILE = '_TEMPLATE.md';

export const TEMPLATE_HOME = registers.adrTemplateHome;

export const commandsFor = (home) => home.commands ?? DEFAULT_ADR_COMMANDS;

export const NON_ADR_FILES = new Set(['README.md', TEMPLATE_FILE]);

const GRANDFATHERED_DUPLICATES = new Set(registers.adrGrandfatheredDuplicates);

const FILENAME = /^ADR-(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

const HEADING = /^#\s*ADR-(\d+)\b/;

export const parseAdrFilename = (filename) => {
  const match = FILENAME.exec(filename);
  return match === null
    ? undefined
    : { number: Number(match[1]), slug: match[2] };
};

export const looksLikeAdr = (filename) => /^ADR[-_ ]?\d/i.test(filename);

export const headingNumber = (markdown) => {
  const line = markdown.split('\n').find((text) => text.startsWith('# '));
  const match = line === undefined ? null : HEADING.exec(line);
  return match === null ? undefined : Number(match[1]);
};

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

const draftFindings = (draftFilenames) =>
  draftFilenames
    .filter((filename) => looksLikeAdr(filename))
    .map(
      (filename) =>
        `${DRAFT_DIR}/${filename} — a draft must not carry an ADR number; it gets one when it is adopted`,
    );

const strayFindings = (strayPaths) =>
  strayPaths.map(
    (path) =>
      `${path} — not in a declared ADR home (${ADR_HOMES.map((home) => home.dir).join(', ')})`,
  );

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

export const nextFreeNumber = (homes) => {
  const numbers = homes.flatMap((home) =>
    home.entries
      .map((entry) => parseAdrFilename(entry.filename)?.number)
      .filter((number) => number !== undefined),
  );
  return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
};

const ESCAPED_PIPE = String.raw`\|`;

const listingRow = (home, entry) => {
  const parsed = parseAdrFilename(entry.filename);
  const number = parsed === undefined ? '?' : pad(parsed.number);
  const title = entry.title.replaceAll('|', ESCAPED_PIPE);
  return `| [ADR-${number}](${home.dir}/${entry.filename}) | ${title} |`;
};

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

const sortedRows = (homes, matches) =>
  homes.flatMap((home) =>
    [...home.entries]
      .sort((a, b) => a.filename.localeCompare(b.filename))
      .filter((entry) => matches(entry.governs ?? []))
      .map((entry) => listingRow(home, entry)),
  );

const governedTable = (title, rows) => [
  `## ${title}`,
  '',
  ...(rows.length === 0
    ? ['_None._']
    : ['| ADR | Decision |', '| --- | --- |', ...rows]),
  '',
];

export const renderGoverned = ({ homes, workspace }) =>
  [
    ...governedTable(
      `Governing \`${workspace}\``,
      sortedRows(homes, (governs) => governs.includes(workspace)),
    ),
    ...governedTable(
      'Repository-wide — every workspace inherits these',
      sortedRows(homes, (governs) => governs.includes(REPOSITORY_SCOPE)),
    ),
  ].join('\n');

const fileInTemplateHome = (dir, filename) => {
  const up = dir
    .split('/')
    .map(() => '..')
    .join('/');
  const prefix = dir === TEMPLATE_HOME ? '.' : `${up}/${TEMPLATE_HOME}`;
  return `${prefix}/${filename}`;
};

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
