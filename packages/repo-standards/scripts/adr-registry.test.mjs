/**
 * The rules worth a test are the ones that already failed in the wild: a number
 * reused across two homes (there were two ADR-047s), a draft holding a number it
 * does not own (that is where the second one came from), and the one number still
 * tolerated in both homes — the set shrinks as a pair loses a side, so a number it
 * no longer covers must be rejected like any other repeat.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  ADR_HOMES,
  adrFindings,
  headingNumber,
  headingTitle,
  looksLikeAdr,
  nextFreeNumber,
  normalizeIndex,
  parseAdrFilename,
  renderIndex,
  renderListing,
} from './adr-registry.mjs';
import { DEFAULT_REGISTERS } from './config.mjs';

const home = (dir, filenames) => ({
  dir,
  entries: filenames.map((filename) => ({
    filename,
    headingNumber: parseAdrFilename(filename)?.number,
    title: 'A decision',
  })),
});

const findings = ({ drafts = [], grandfathered, homes = [], strays = [] }) =>
  adrFindings({ drafts, grandfathered, homes, strays });

describe('parseAdrFilename', () => {
  it('reads the number and slug from a well-formed name', () => {
    expect(parseAdrFilename('ADR-047-declare-optional-peers.md')).toEqual({
      number: 47,
      slug: 'declare-optional-peers',
    });
  });

  it('rejects a name the gate must not silently accept', () => {
    for (const name of [
      'ADR-47-two-digits.md',
      'ADR-047.md',
      'ADR-047-Not-Kebab.md',
      'adr-047-lowercase.md',
      'README.md',
    ]) {
      expect(parseAdrFilename(name)).toBe(undefined);
    }
  });
});

describe('adrFindings', () => {
  it('rejects the last overlap once the register empties, 005 included', () => {
    const result = findings({
      homes: [
        home('docs/decisions', ['ADR-005-a.md']),
        home('apps/showcase/docs/decisions', ['ADR-005-b.md']),
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('ADR-005');
  });

  it('rejects a number the shrinking set no longer grandfathers', () => {
    const result = findings({
      homes: [
        home('docs/decisions', ['ADR-001-a.md']),
        home('apps/showcase/docs/decisions', ['ADR-001-b.md']),
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('ADR-001');
  });

  it('fails a number reused outside that overlap — the two-ADR-047 case', () => {
    const result = findings({
      homes: [
        home('docs/decisions', ['ADR-047-a.md']),
        home('apps/showcase/docs/decisions', ['ADR-047-b.md']),
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('ADR-047');
  });

  it('fails a number used three times, in one home or across two', () => {
    expect(
      findings({
        homes: [
          home('docs/decisions', ['ADR-005-a.md', 'ADR-005-c.md']),
          home('apps/showcase/docs/decisions', ['ADR-005-b.md']),
        ],
      }),
    ).toHaveLength(1);
  });

  it('passes a grandfathered number used exactly twice', () => {
    expect(
      findings({
        grandfathered: new Set([5]),
        homes: [
          home('docs/decisions', ['ADR-005-a.md']),
          home('apps/showcase/docs/decisions', ['ADR-005-b.md']),
        ],
      }),
    ).toEqual([]);
  });

  it('fails a grandfathered number used a third time', () => {
    const result = findings({
      grandfathered: new Set([5]),
      homes: [
        home('docs/decisions', ['ADR-005-a.md', 'ADR-005-c.md']),
        home('apps/showcase/docs/decisions', ['ADR-005-b.md']),
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('ADR-005');
  });

  it('fails a numbered draft, which is how a number gets reserved but not owned', () => {
    const result = findings({ drafts: ['ADR-047-server-errors.md'] });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('must not carry an ADR number');
  });

  it('passes an unnumbered draft', () => {
    expect(findings({ drafts: ['server-errors.md'] })).toEqual([]);
  });

  it('fails an ADR outside every declared home', () => {
    const result = findings({ strays: ['docs/agents/ADR-099-somewhere.md'] });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('not in a declared ADR home');
  });

  it('fails a malformed filename inside a home', () => {
    expect(
      findings({ homes: [home('docs/decisions', ['ADR-47-short.md'])] }),
    ).toHaveLength(1);
  });

  it('fails a heading whose number disagrees with its filename', () => {
    const result = findings({
      homes: [
        {
          dir: 'docs/decisions',
          entries: [{ filename: 'ADR-048-a.md', headingNumber: 47, title: '' }],
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('heading says ADR-047');
  });

  it('reports every violation in one pass, not just the first', () => {
    expect(
      findings({
        drafts: ['ADR-099-draft.md'],
        homes: [home('docs/decisions', ['ADR-47-short.md'])],
        strays: ['ADR-098-stray.md'],
      }),
    ).toHaveLength(3);
  });
});

describe('headingNumber / headingTitle', () => {
  it('reads both separator styles the repo actually uses', () => {
    expect(headingNumber('# ADR-001: Extract `packages/ui`')).toBe(1);
    expect(headingTitle('# ADR-001: Extract `packages/ui`')).toBe(
      'Extract `packages/ui`',
    );
    expect(headingNumber('# ADR-040 — The public packages')).toBe(40);
    expect(headingTitle('# ADR-040 — The public packages')).toBe(
      'The public packages',
    );
  });

  it('ignores body text and reads only the H1', () => {
    expect(headingNumber('Intro prose\n\n# ADR-012: Title\n\n## ADR-099')).toBe(
      12,
    );
  });

  it('returns undefined for a document with no ADR heading', () => {
    expect(headingNumber('# Just a document')).toBe(undefined);
  });
});

describe('nextFreeNumber', () => {
  it('hands back the highest number once its ADR is deleted', () => {
    const before = home('docs/decisions', ['ADR-047-a.md', 'ADR-048-b.md']);
    const after = home('docs/decisions', ['ADR-047-a.md']);

    expect(nextFreeNumber([before])).toBe(49);
    expect(nextFreeNumber([after])).toBe(48);
  });

  it('never fills a gap below the highest', () => {
    expect(
      nextFreeNumber([
        home('docs/decisions', ['ADR-001-a.md', 'ADR-047-b.md']),
      ]),
    ).toBe(48);
  });

  it('is one past the highest anywhere, not per home', () => {
    expect(
      nextFreeNumber([
        home('docs/decisions', ['ADR-047-a.md']),
        home('apps/showcase/docs/decisions', ['ADR-041-b.md']),
      ]),
    ).toBe(48);
  });
});

describe('looksLikeAdr', () => {
  it('catches near-misses, so a badly named ADR is a finding not a silent skip', () => {
    for (const name of [
      'ADR-001-x.md',
      'adr_002_x.md',
      'ADR 003 x.md',
      'ADR47.md',
    ]) {
      expect(looksLikeAdr(name)).toBe(true);
    }
  });

  it('needs a digit, so an ordinary doc starting with those letters is not an ADR', () => {
    for (const name of ['ADRIFT.md', 'adr-taxonomy.md', 'adrs-explained.md']) {
      expect(looksLikeAdr(name)).toBe(false);
    }
  });
});

describe('renderIndex', () => {
  it('links the template relative to the home it renders', () => {
    const [repo] = ADR_HOMES;

    expect(renderIndex(repo)).toContain('](./_TEMPLATE.md)');
  });

  it('links the template up out of a nested home', () => {
    expect(
      renderIndex({
        blurb: 'A nested home.',
        dir: 'apps/showcase/docs/decisions',
        tier: 'app',
        title: 'Nested',
      }),
    ).toContain('](../../../../docs/decisions/_TEMPLATE.md)');
  });

  it('names nothing a repository generating its first index would not have', () => {
    const rendered = renderIndex(DEFAULT_REGISTERS.adrHomes[0]);

    for (const absent of ['vp run', 'ADR-048', 'ADR-075']) {
      expect(rendered).not.toContain(absent);
    }
    expect(rendered).toContain('npx repo-adr');
  });

  it("names a repository's own commands when it declares them", () => {
    const rendered = renderIndex(ADR_HOMES[0]);

    expect(rendered).toContain(ADR_HOMES[0].commands.new);
    expect(rendered).not.toContain('npx repo-adr');
  });

  const index = (options) =>
    renderIndex(ADR_HOMES[0], { exemptionCount: 0, homeCount: 1, ...options });

  it('says what numbering means for a single-home repository', () => {
    const rendered = index({});

    expect(rendered).toContain('A number identifies exactly one ADR');
    expect(rendered).toContain('unless it was the highest');
    expect(rendered).not.toContain('ADR home in this repository');
  });

  it('says what numbering means across several homes', () => {
    const rendered = index({ homeCount: 2 });

    expect(rendered).toContain(
      'unique across every ADR home in this repository',
    );
    expect(rendered).not.toContain('A number identifies exactly one ADR');
  });

  it('admits the exemption when the repository declares one', () => {
    const rendered = index({ exemptionCount: 1 });

    expect(rendered).toContain('adrGrandfatheredDuplicates');
    expect(rendered).toContain('may name two ADRs');
  });

  it('says nothing about exemptions when there are none', () => {
    expect(index({})).not.toContain('adrGrandfatheredDuplicates');
  });

  it('renders the branch this repository\u2019s registers imply', () => {
    const rendered = renderIndex(ADR_HOMES[0]);

    expect(rendered).toContain(
      ADR_HOMES.length > 1
        ? 'ADR home in this repository'
        : 'A number identifies exactly one ADR',
    );
  });

  it('names no ADR, however it is handed the directory', () => {
    const planted = [
      { filename: 'ADR-901-planted.md', title: 'A planted decision' },
    ];

    for (const each of ADR_HOMES) {
      const rendered = renderIndex({ ...each, entries: planted }, planted);

      expect(rendered).not.toMatch(/\[ADR-901/u);
      expect(rendered).not.toContain('A planted decision');
      expect(rendered).not.toMatch(/^\|\s*\[ADR-/mu);
    }
  });
});

describe('normalizeIndex', () => {
  it('survives Oxfmt padding a table, but not a changed cell', () => {
    const rendered = '| ADR | Decision |\n| --- | --- |\n| A | One |';
    const padded = '| ADR | Decision |\n| --- | ------ |\n| A   | One    |';

    expect(normalizeIndex(padded)).toBe(normalizeIndex(rendered));
    expect(normalizeIndex(padded.replace('One', 'Two'))).not.toBe(
      normalizeIndex(rendered),
    );
  });

  it('ignores trailing whitespace, which is what Oxfmt strips from prose', () => {
    expect(normalizeIndex('a line   \nanother\n')).toBe('a line\nanother');
  });
});

describe('renderListing', () => {
  it('rows every ADR, linked from the repository root', () => {
    const listing = renderListing([
      {
        dir: 'docs/decisions',
        entries: [{ filename: 'ADR-002-b.md', title: 'Two' }],
        title: 'Repo',
      },
    ]);

    expect(listing).toContain(
      '| [ADR-002](docs/decisions/ADR-002-b.md) | Two |',
    );
  });

  it('sorts by filename and escapes a pipe in a title', () => {
    const listing = renderListing([
      {
        dir: 'docs/decisions',
        entries: [
          { filename: 'ADR-002-b.md', title: 'A | B' },
          { filename: 'ADR-001-a.md', title: 'One' },
        ],
        title: 'Repo',
      },
    ]);
    const rows = listing.split('\n').filter((line) => line.includes('](docs/'));

    expect(rows[0]).toContain('ADR-001');
    expect(rows[1]).toContain(String.raw`| A \| B |`);
  });
});
