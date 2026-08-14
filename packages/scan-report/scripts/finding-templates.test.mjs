// Pins the two pieces of finding text that were rewritten out of nested
// ternaries and nested template literals (Sonar S3358/S4624). Both feed
// `report.json` fields a consumer parses, so the rewrite has to be
// character-for-character behaviour-preserving, not merely equivalent-looking.

import { describe, expect, test } from 'vite-plus/test';

import {
  buildCloneGroupFinding,
  buildUnusedExportFinding,
} from './finding-templates.mjs';

describe('the line:column hint', () => {
  test('is line and column when both are numbers', () => {
    expect(
      buildUnusedExportFinding({ col: 7, line: 42, name: 'x', path: 'a.ts' })
        .locationHint,
    ).toBe('42:7');
  });

  test('is the line alone when there is no column', () => {
    expect(
      buildUnusedExportFinding({ line: 42, name: 'x', path: 'a.ts' })
        .locationHint,
    ).toBe('42');
  });

  test('is the line alone when the column is not a number', () => {
    expect(
      buildUnusedExportFinding({ col: null, line: 42, name: 'x', path: 'a.ts' })
        .locationHint,
    ).toBe('42');
  });

  test('is undefined — not "undefined:7" — when there is no line', () => {
    expect(
      buildUnusedExportFinding({ col: 7, name: 'x', path: 'a.ts' })
        .locationHint,
    ).toBeUndefined();
  });
});

describe('the clone-group fix text', () => {
  const group = (extra) => ({
    instances: [{ end_line: 20, file: 'a.ts', start_line: 1 }],
    line_count: 20,
    token_count: 100,
    ...extra,
  });

  test('names the suggested helper, backticked, when fallow proposed one', () => {
    expect(buildCloneGroupFinding(group({ suggested_name: 'toRow' })).fix).toBe(
      'Extract the duplicated block into a shared helper (suggested name: `toRow`).',
    );
  });

  test('omits the whole parenthetical when it did not', () => {
    expect(buildCloneGroupFinding(group()).fix).toBe(
      'Extract the duplicated block into a shared helper.',
    );
  });
});
