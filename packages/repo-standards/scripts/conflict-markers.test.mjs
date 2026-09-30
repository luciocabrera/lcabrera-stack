import { describe, expect, it } from 'vite-plus/test';

import {
  conflictMarkerLines,
  conflictMarkersIn,
  formatFinding,
  isConflictMarker,
} from './conflict-markers.mjs';

const OPEN = '<'.repeat(7);
const BASE = '|'.repeat(7);
const SPLIT = '='.repeat(7);
const CLOSE = '>'.repeat(7);
const QUOTED_CLOSE = Array.from({ length: 7 }, () => '>').join(' ');

describe('isConflictMarker', () => {
  it.each([
    `${OPEN} HEAD`,
    OPEN,
    `${BASE} merged common ancestors`,
    SPLIT,
    `${SPLIT}  `,
    `${CLOSE} origin/main`,
    CLOSE,
  ])('flags the marker git writes: %s', (line) => {
    expect(isConflictMarker(line)).toBe(true);
  });

  it.each([`${QUOTED_CLOSE} origin/main`, QUOTED_CLOSE])(
    'flags a closing marker a formatter reprinted as nested block quotes: %s',
    (line) => {
      expect(isConflictMarker(line)).toBe(true);
    },
  );

  it.each([
    `| ${OPEN} HEAD |`,
    `| ${SPLIT}      |`,
    `|${CLOSE}|`,
    `| ${CLOSE} origin/main |`,
  ])(
    'flags a marker a formatter folded into a table as its first cell: %s',
    (line) => {
      expect(isConflictMarker(line)).toBe(true);
    },
  );

  it.each([
    `${OPEN}<`,
    `${SPLIT}=`,
    `${CLOSE}>`,
    `${OPEN}HEAD`,
    `${SPLIT} heading`,
    `  ${OPEN} HEAD`,
    `text ${SPLIT}`,
    Array.from({ length: 6 }, () => '>').join(' '),
    `${QUOTED_CLOSE}>`,
    `| \`${OPEN}\` | a marker named in prose |`,
    `| cell | ${SPLIT} |`,
    '|'.repeat(8),
    '',
  ])('leaves an ordinary line alone: %s', (line) => {
    expect(isConflictMarker(line)).toBe(false);
  });
});

describe('conflictMarkerLines', () => {
  it('reports each marker with its one-based line number', () => {
    const text = [
      '# Title',
      `${OPEN} HEAD`,
      'ours',
      SPLIT,
      'theirs',
      `${QUOTED_CLOSE} origin/main`,
      '',
    ].join('\n');

    expect(conflictMarkerLines(text)).toEqual([
      { line: 2, text: `${OPEN} HEAD` },
      { line: 4, text: SPLIT },
      { line: 6, text: `${QUOTED_CLOSE} origin/main` },
    ]);
  });

  it('reads a file with CRLF line endings the same way', () => {
    expect(conflictMarkerLines(`a\r\n${SPLIT}\r\nb\r\n`)).toEqual([
      { line: 2, text: SPLIT },
    ]);
  });
});

describe('conflictMarkersIn', () => {
  it('names the file and the line of every marker across the files it is given', () => {
    expect(
      conflictMarkersIn([
        { path: 'clean.md', text: 'nothing here\n' },
        { path: 'doc.md', text: `intro\n${OPEN} HEAD\n` },
        { path: 'src/a.ts', text: `${CLOSE} topic\n` },
      ]),
    ).toEqual([
      { line: 2, path: 'doc.md', text: `${OPEN} HEAD` },
      { line: 1, path: 'src/a.ts', text: `${CLOSE} topic` },
    ]);
  });

  it('skips a binary file, whose bytes can spell a marker by chance', () => {
    expect(
      conflictMarkersIn([{ path: 'image.png', text: `\0\n${SPLIT}\n` }]),
    ).toEqual([]);
  });

  it('returns nothing for a clean tree', () => {
    expect(
      conflictMarkersIn([{ path: 'README.md', text: '# Readme\n\nText.\n' }]),
    ).toEqual([]);
  });
});

describe('formatFinding', () => {
  it('prints path, line and the marker text', () => {
    expect(
      formatFinding({ line: 3, path: 'doc.md', text: `${OPEN} HEAD` }),
    ).toBe(`doc.md:3: ${OPEN} HEAD`);
  });
});
