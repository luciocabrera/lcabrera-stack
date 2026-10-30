import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { isoDay, readFalsePositiveList } from './false-positive-list.mjs';

const roots = [];

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { force: true, recursive: true });
});

const repo = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'false-positive-list-'));
  roots.push(root);
  for (const [name, text] of Object.entries(files)) {
    writeFileSync(join(root, name), text);
  }
  return root;
};

describe('readFalsePositiveList', () => {
  it('reads nothing when the repository keeps no list', () => {
    expect(readFalsePositiveList(repo({}))).toEqual([]);
  });

  it('reads the list from the path devkit.config.json names', () => {
    const root = repo({
      'devkit.config.json': JSON.stringify({
        registers: { falsePositives: 'fp.json' },
      }),
      'fp.json': JSON.stringify([{ case: 'FP-0001' }]),
    });
    expect(readFalsePositiveList(root)).toEqual([{ case: 'FP-0001' }]);
  });

  it('refuses a list that is not an array', () => {
    const root = repo({
      'devkit.config.json': JSON.stringify({
        registers: { falsePositives: 'fp.json' },
      }),
      'fp.json': JSON.stringify({ case: 'FP-0001' }),
    });
    expect(() => readFalsePositiveList(root)).toThrow(
      `${join(root, 'fp.json')} is not a JSON array of false-positive entries.`,
    );
  });
});

describe('isoDay', () => {
  it('is the UTC calendar day', () => {
    expect(isoDay(new Date('2026-10-30T23:59:59.000Z'))).toBe('2026-10-30');
  });
});
