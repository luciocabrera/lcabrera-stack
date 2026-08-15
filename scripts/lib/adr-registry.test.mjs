/**
 * The rules worth a test are the ones that already failed in the wild: a number
 * reused across two homes (there were two ADR-047s), a draft holding a number it
 * does not own (that is where the second one came from), and the grandfathered
 * 001–012 overlap, which must keep passing or the gate cannot land at all.
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

const home = (dir, filenames) => ({
  dir,
  entries: filenames.map((filename) => ({
    filename,
    headingNumber: parseAdrFilename(filename)?.number,
    title: 'A decision',
  })),
});

const findings = ({ drafts = [], homes = [], strays = [] }) =>
  adrFindings({ drafts, homes, strays });

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
  it('passes the grandfathered 001–012 overlap, twice each', () => {
    expect(
      findings({
        homes: [
          home('docs/decisions', ['ADR-001-a.md']),
          home('apps/react-router/docs/decisions', ['ADR-001-b.md']),
        ],
      }),
    ).toEqual([]);
  });

  it('fails a number reused outside that overlap — the two-ADR-047 case', () => {
    const result = findings({
      homes: [
        home('docs/decisions', ['ADR-047-a.md']),
        home('docs/cqms/decisions', ['ADR-047-b.md']),
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('ADR-047');
  });

  it('fails a grandfathered number used a third time', () => {
    expect(
      findings({
        homes: [
          home('docs/decisions', ['ADR-001-a.md', 'ADR-001-c.md']),
          home('apps/react-router/docs/decisions', ['ADR-001-b.md']),
        ],
      }),
    ).toHaveLength(1);
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
  it('is one past the highest anywhere, not per home', () => {
    expect(
      nextFreeNumber([
        home('docs/decisions', ['ADR-047-a.md']),
        home('docs/cqms/decisions', ['ADR-041-b.md']),
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
  it('links ADR-048 relative to the home it renders', () => {
    const [repo, , app] = ADR_HOMES;

    expect(renderIndex(repo)).toContain('](./ADR-048-');
    expect(renderIndex(app)).toContain('](../../../../docs/decisions/ADR-048-');
  });

  /**
   * The whole of ADR-075 in two assertions. A committed index that names the
   * ADRs is a file every ADR branch appends to, so two of them conflict; an
   * index that cannot see the directory cannot differ between two branches.
   * The arity is the enforceable half — putting the entries back is how the
   * conflict returns, and it cannot be done quietly.
   */
  it('names no ADR, and cannot be given the directory to name one from', () => {
    for (const each of ADR_HOMES) {
      expect(renderIndex(each)).not.toMatch(/^\|\s*\[ADR-/mu);
    }

    expect(renderIndex).toHaveLength(1);
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
