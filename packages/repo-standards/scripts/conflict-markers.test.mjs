import { describe, expect, it } from 'vite-plus/test';

import {
  conflictMarkerLines,
  formatFinding,
  isBinaryContent,
  markerKind,
} from './conflict-markers.mjs';

const OPEN = '<'.repeat(7);
const BASE = '|'.repeat(7);
const SPLIT = '='.repeat(7);
const CLOSE = '>'.repeat(7);
const QUOTED_CLOSE = Array.from({ length: 7 }, () => '>').join(' ');

describe('markerKind', () => {
  it.each([
    `${OPEN} HEAD`,
    OPEN,
    `${BASE} merged common ancestors`,
    `${CLOSE} origin/main`,
    CLOSE,
  ])('reads the opening, base and closing markers git writes: %s', (line) => {
    expect(markerKind(line)).toBe('anchor');
  });

  it.each([`${QUOTED_CLOSE} origin/main`, QUOTED_CLOSE])(
    'reads a closing marker a formatter reprinted as nested block quotes: %s',
    (line) => {
      expect(markerKind(line)).toBe('anchor');
    },
  );

  it.each([`| ${OPEN} HEAD |`, `|${CLOSE}|`, `| ${CLOSE} origin/main |`])(
    'reads a marker a formatter folded into a table as its first cell: %s',
    (line) => {
      expect(markerKind(line)).toBe('anchor');
    },
  );

  it.each([
    `  ${OPEN} HEAD`,
    `   ${OPEN} HEAD`,
    `\t${CLOSE} topic`,
    `  ${QUOTED_CLOSE} origin/main`,
  ])(
    'reads a marker a formatter indented as a list continuation: %s',
    (line) => {
      expect(markerKind(line)).toBe('anchor');
    },
  );

  it.each([
    SPLIT,
    `${SPLIT}  `,
    `\\${SPLIT}`,
    `    \\${SPLIT}`,
    `  ${SPLIT}`,
    `| ${SPLIT}      |`,
    `| ${SPLIT}                        |`,
  ])('reads a separator, raw or reshaped: %s', (line) => {
    expect(markerKind(line)).toBe('separator');
  });

  it.each([
    `${OPEN}<`,
    `${SPLIT}=`,
    `${CLOSE}>`,
    `${OPEN}HEAD`,
    `${SPLIT} heading`,
    `text ${SPLIT}`,
    `text ${OPEN} HEAD`,
    Array.from({ length: 6 }, () => '>').join(' '),
    `${QUOTED_CLOSE}>`,
    `| \`${OPEN}\` | a marker named in prose |`,
    `| cell | ${SPLIT} |`,
    '|'.repeat(8),
    '',
  ])('leaves an ordinary line alone: %s', (line) => {
    expect(markerKind(line)).toBeUndefined();
  });
});

describe('conflictMarkerLines', () => {
  it('names every marker of a conflict with its one-based line number', () => {
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

  it('passes a heading underlined with exactly seven `=`', () => {
    expect(conflictMarkerLines(`Summary\n${SPLIT}\n\nText.\n`)).toEqual([]);
  });

  it('passes a heading underlined at the end of the file', () => {
    expect(conflictMarkerLines(`Text.\n\nSummary\n${SPLIT}`)).toEqual([]);
    expect(conflictMarkerLines(`Text.\n\nSummary\n${SPLIT}\n`)).toEqual([]);
  });

  it('passes a reStructuredText title with an overline and an underline', () => {
    expect(
      conflictMarkerLines(`${SPLIT}\nSummary\n${SPLIT}\n\nText.\n`),
    ).toEqual([]);
    expect(
      conflictMarkerLines(`Intro.\n\n${SPLIT}\nSummary\n${SPLIT}\nText.\n`),
    ).toEqual([]);
  });

  it('names a separator left alone between the two sides of a resolved conflict', () => {
    const text = ['const ours = 1;', SPLIT, 'const theirs = 2;', ''].join('\n');

    expect(conflictMarkerLines(text)).toEqual([{ line: 2, text: SPLIT }]);
  });

  it('names a separator two text lines below a blank line', () => {
    const text = [
      'intro.',
      '',
      'const ours = 1;',
      'const mid = 2;',
      SPLIT,
      'const theirs = 3;',
      '',
    ].join('\n');

    expect(conflictMarkerLines(text)).toEqual([{ line: 5, text: SPLIT }]);
  });

  it('names a separator with no text above it and text below it', () => {
    expect(conflictMarkerLines(`${SPLIT}\ntheirs\n`)).toEqual([
      { line: 1, text: SPLIT },
    ]);
  });

  it('names an escaped separator without any other marker in the file', () => {
    expect(conflictMarkerLines(`Text.\n\n\\${SPLIT}\n\nMore.\n`)).toEqual([
      { line: 3, text: `\\${SPLIT}` },
    ]);
  });

  it('passes a separator folded into a table cell when no marker is beside it', () => {
    expect(conflictMarkerLines(`| a |\n| ${SPLIT} |\n| b |\n`)).toEqual([]);
  });

  it('names that same underline once the file also holds a real marker', () => {
    expect(
      conflictMarkerLines(`Summary\n${SPLIT}\n\n${CLOSE} topic\n`),
    ).toEqual([
      { line: 2, text: SPLIT },
      { line: 4, text: `${CLOSE} topic` },
    ]);
  });

  it('names every line of a conflict a formatter reshaped inside a list', () => {
    const text = [
      '- item one',
      `  ${OPEN} HEAD`,
      '  - ours',
      `    \\${SPLIT}`,
      '  - theirs',
      `  ${QUOTED_CLOSE} origin/main`,
      '- item two',
    ].join('\n');

    expect(conflictMarkerLines(text).map(({ line }) => line)).toEqual([
      2, 4, 6,
    ]);
  });

  it('names every line of a conflict whose separator a formatter folded into a table', () => {
    const text = [
      '### Tooling',
      '',
      `${OPEN} HEAD`,
      '',
      '| Command         | Does   |',
      '| --------------- | ------ |',
      '| `vp run report` | ours   |',
      '| `vp run setup`  | shared |',
      `| ${SPLIT}         |`,
      '| Command         | Does   |',
      '| --------------- | ------ |',
      '| `vp run setup`  | shared |',
      '',
      `${QUOTED_CLOSE} origin/main`,
    ].join('\n');

    expect(conflictMarkerLines(text).map(({ line }) => line)).toEqual([
      3, 9, 14,
    ]);
  });

  it('reads a file with CRLF line endings the same way', () => {
    expect(conflictMarkerLines(`a\r\n${OPEN} x\r\n${SPLIT}\r\nb\r\n`)).toEqual([
      { line: 2, text: `${OPEN} x` },
      { line: 3, text: SPLIT },
    ]);
  });

  it('returns nothing for a clean file', () => {
    expect(conflictMarkerLines('# Readme\n\nText.\n')).toEqual([]);
  });
});

describe('isBinaryContent', () => {
  it('reads a NUL byte as binary, before any decoding', () => {
    expect(isBinaryContent(Buffer.from([0x3d, 0x00, 0x0a]))).toBe(true);
  });

  it('reads text bytes as text', () => {
    expect(isBinaryContent(Buffer.from(`${SPLIT}\n`, 'utf8'))).toBe(false);
  });
});

describe('formatFinding', () => {
  it('prints path, line and the marker text', () => {
    expect(
      formatFinding({ line: 3, path: 'doc.md', text: `  ${OPEN} HEAD` }),
    ).toBe(`doc.md:3: ${OPEN} HEAD`);
  });
});
