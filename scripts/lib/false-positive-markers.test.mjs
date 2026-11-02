import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vite-plus/test';

import {
  findClaimedMarkers,
  hashLines,
  markerSpelling,
} from './false-positive-markers.mjs';

const FILE = 'packages/x/src/query.util.ts';

describe('findClaimedMarkers', () => {
  it.each([
    ['eslint', 'eslint-disable-next-line'],
    ['oxlint', 'oxlint-disable-next-line'],
    ['react-doctor', 'react-doctor-disable-next-line'],
    ['fallow', 'fallow-ignore-next-line'],
  ])('reads the %s spelling', (analyzer, directive) => {
    const [found] = findClaimedMarkers({
      file: FILE,
      text: `  // ${directive} some/rule -- false positive, case FP-0012: reason here`,
    });
    expect(found).toMatchObject({
      analyzer,
      caseId: 'FP-0012',
      line: 1,
      reason: 'reason here',
      rule: 'some/rule',
    });
  });

  it("reads Biome's colon-separated spelling, in JSX too", () => {
    const [found] = findClaimedMarkers({
      file: FILE,
      text: '{/* biome-ignore lint/a11y/useButtonType: false positive, case FP-0003: a native reset */}',
    });
    expect(found).toMatchObject({
      analyzer: 'biome',
      caseId: 'FP-0003',
      reason: 'a native reset',
      rule: 'lint/a11y/useButtonType',
    });
  });

  it('ignores a marker that claims nothing, and one inside a string', () => {
    expect(
      findClaimedMarkers({
        file: FILE,
        text: [
          '// eslint-disable-next-line no-console -- logging',
          "const text = '// eslint-disable-next-line x -- false positive, case FP-0001: y';",
        ].join('\n'),
      }),
    ).toEqual([]);
  });
});

describe('findClaimedMarkers — every directive', () => {
  it.each([
    ['eslint', 'eslint-disable-next-line', true],
    ['eslint', 'eslint-disable-line', false],
    ['eslint', 'eslint-disable', false],
    ['oxlint', 'oxlint-disable-next-line', true],
    ['oxlint', 'oxlint-disable-line', false],
    ['oxlint', 'oxlint-disable', false],
    ['biome', 'biome-ignore-all', false],
    ['biome', 'biome-ignore-start', false],
    ['biome', 'biome-ignore', true],
    ['react-doctor', 'react-doctor-disable-next-line', true],
    ['react-doctor', 'react-doctor-disable-line', false],
    ['react-doctor', 'react-doctor-disable', false],
    ['fallow', 'fallow-ignore-next-line', true],
    ['fallow', 'fallow-ignore-file', false],
  ])(
    'reads %s %s, covering the next line: %s',
    (analyzer, directive, nextLine) => {
      const separator = analyzer === 'biome' ? ':' : ' --';
      const [found] = findClaimedMarkers({
        file: FILE,
        text: `// ${directive} x/y${separator} false positive, case FP-0001: why`,
      });
      expect(found).toEqual({
        analyzer,
        caseId: 'FP-0001',
        column: 3,
        directive,
        file: FILE,
        line: 1,
        nextLine,
        reason: 'why',
        rule: 'x/y',
      });
    },
  );
});

describe('findClaimedMarkers — what is not a directive', () => {
  it.each([
    '// eslint-disable-next-lines r -- false positive, case FP-0001: why',
    '// my-eslint-disable-next-line r -- false positive, case FP-0001: why',
    '// fallow-unknown r -- false positive, case FP-0001: why',
  ])('ignores "%s"', (text) => {
    expect(findClaimedMarkers({ file: FILE, text })).toEqual([]);
  });

  it('still reads a JSX marker after an apostrophe in the text', () => {
    expect(
      findClaimedMarkers({
        file: 'packages/x/src/a.tsx',
        text: "const p = <p>don't {/* biome-ignore x/y: false positive, case FP-0003: why */}</p>;",
      })[0],
    ).toMatchObject({ caseId: 'FP-0003', reason: 'why', rule: 'x/y' });
  });
});

describe('findClaimedMarkers — the explanation', () => {
  const read = (text) => findClaimedMarkers({ file: FILE, text })[0];

  it('keeps a reason that itself holds the separator', () => {
    expect(
      read(
        '// eslint-disable-next-line r -- false positive, case FP-0001: a -- b',
      ).reason,
    ).toBe('a -- b');
  });

  it('stops at the end of a block comment, and keeps the last character without one', () => {
    expect(
      read(
        '/* eslint-disable-next-line r -- false positive, case FP-0001: why */',
      ).reason,
    ).toBe('why');
    expect(
      read('// eslint-disable-next-line r -- false positive, case FP-0001: why')
        .reason,
    ).toBe('why');
  });

  it.each([
    '// biome-ignore lint/x/y false positive FP-0004',
    '// eslint-disable-next-line r -- see FP-0005',
    '// eslint-disable-next-line r -- see false positive, case FP-0006: x',
    '// eslint-disable-next-line r -- false positive, FP-0006: x',
  ])('reads prose that is not the claim form as no marker: %s', (text) => {
    expect(findClaimedMarkers({ file: FILE, text })).toEqual([]);
  });

  it('keeps a directive the reason mentions as part of the reason', () => {
    const text =
      '// eslint-disable-next-line r -- false positive, case FP-0001: why oxlint-disable no-console';
    expect(findClaimedMarkers({ file: FILE, text })).toEqual([
      expect.objectContaining({
        column: 3,
        directive: 'eslint-disable-next-line',
        reason: 'why oxlint-disable no-console',
      }),
    ]);
  });

  it('reads a second directive after a nested opener on its own', () => {
    const text =
      '// eslint-disable-next-line r -- false positive, case FP-0001: why /* oxlint-disable-next-line q -- false positive, case FP-0002: other */';
    expect(
      findClaimedMarkers({ file: FILE, text }).map(({ caseId, reason }) => [
        caseId,
        reason,
      ]),
    ).toEqual([
      ['FP-0001', 'why /*'],
      ['FP-0002', 'other'],
    ]);
  });
});

describe('the documented spellings', () => {
  it.each([
    [
      'fallow',
      '// fallow-ignore-next-line security/sql-concat -- false positive, case FP-0007: the identifier comes from a fixed allow-list',
      'security/sql-concat',
    ],
    [
      'biome',
      '// biome-ignore lint/a11y/useButtonType: false positive, case FP-0012: a native reset button',
      'lint/a11y/useButtonType',
    ],
  ])(
    'reads the %s example from the docs as a claim',
    (analyzer, text, rule) => {
      const [found] = findClaimedMarkers({ file: FILE, text });
      expect(found).toMatchObject({ analyzer, nextLine: true, rule });
      expect(found.caseId).toMatch(/^FP-\d{4}$/u);
      expect(
        markerSpelling({
          analyzer,
          caseId: found.caseId,
          reason: found.reason,
          rule,
        }),
      ).toBe(text);
    },
  );
});

describe('hashLines and markerSpelling', () => {
  it('hashes the lines joined by newlines', () => {
    expect(hashLines(['a', 'b'])).toBe(
      createHash('sha256').update('a\nb').digest('hex'),
    );
  });

  it.each([
    [
      'eslint',
      '// eslint-disable-next-line r -- false positive, case FP-0001: why',
    ],
    [
      'oxlint',
      '// oxlint-disable-next-line r -- false positive, case FP-0001: why',
    ],
    [
      'fallow',
      '// fallow-ignore-next-line r -- false positive, case FP-0001: why',
    ],
    [
      'react-doctor',
      '// react-doctor-disable-next-line r -- false positive, case FP-0001: why',
    ],
    ['biome', '// biome-ignore r: false positive, case FP-0001: why'],
  ])('spells the %s marker', (analyzer, spelling) => {
    expect(
      markerSpelling({ analyzer, caseId: 'FP-0001', reason: 'why', rule: 'r' }),
    ).toBe(spelling);
  });
});
