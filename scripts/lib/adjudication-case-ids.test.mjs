import { describe, expect, it } from 'vite-plus/test';

import {
  nextCaseId,
  parseFindingId,
  takenCaseNames,
} from './adjudication-case.mjs';

describe('takenCaseNames', () => {
  it('counts a number the default branch holds, so a fresh checkout cannot reuse it', () => {
    const names = takenCaseNames({
      committed: [
        'docs/agents/adjudications/FP-0012.json',
        'docs/agents/adjudications/FP-0012',
      ],
      local: ['FP-0003', 'README.md'],
    });
    expect(names).toEqual(['FP-0003', 'README.md', 'FP-0012.json', 'FP-0012']);
    expect(nextCaseId(names)).toBe('FP-0013');
  });
});

describe('nextCaseId', () => {
  it('ignores a name that only contains a case id', () => {
    expect(
      nextCaseId(['notes-FP-0099.json', 'FP-0098.json.bak', 'FP-0003']),
    ).toBe('FP-0004');
  });
});

describe('parseFindingId', () => {
  it('reads a file, a line range and a rule that itself holds a colon', () => {
    expect(
      parseFindingId('packages/a.ts:4-9:policy-violation:pack/rule'),
    ).toEqual({
      end: 9,
      file: 'packages/a.ts',
      rule: 'policy-violation:pack/rule',
      start: 4,
    });
  });

  it.each([
    ['packages/a.ts:3:', 'names no rule'],
    ['packages/a.ts:3:-rule', 'names no rule'],
    ['../outside.ts:3:r', 'no repository-relative file'],
    ['/etc/passwd:3:r', 'no repository-relative file'],
    ['-x.ts:3:r', 'no repository-relative file'],
    ['a//b.ts:3:r', 'no repository-relative file'],
    ['a\\b.ts:3:r', 'no repository-relative file'],
    ['./a.ts:3:r', 'no repository-relative file'],
  ])('refuses "%s"', (id, message) => {
    expect(() => parseFindingId(id)).toThrow(message);
  });

  it.each([
    ['3:4:r', { end: 4, file: '3', rule: 'r', start: 4 }],
    ['a:b.ts:3:r', { end: 3, file: 'a:b.ts', rule: 'r', start: 3 }],
    ['a.ts:3:4:r', { end: 3, file: 'a.ts', rule: '4:r', start: 3 }],
  ])('reads "%s"', (id, parsed) => {
    expect(parseFindingId(id)).toEqual(parsed);
  });

  it.each(['a.ts:3', 'a.ts:3x:r', 'a.ts:x3:r', 'a.ts:3-:r'])(
    'refuses "%s" as no line range',
    (id) => {
      expect(() => parseFindingId(id)).toThrow(
        `the finding id "${id}" is not <file>:<line>[-<end line>]:<rule>`,
      );
    },
  );

  it('refuses a rule with a space in it', () => {
    expect(() => parseFindingId('a.ts:3:r x')).toThrow('names no rule');
  });

  it.each(['packages/a.ts', 'packages/a.ts:9-4:x', 'packages/a.ts:0:x'])(
    'refuses "%s"',
    (id) => {
      expect(() => parseFindingId(id)).toThrow(/finding id/u);
    },
  );
});

describe('nextCaseId — numbering', () => {
  it('takes the next number after every case file and directory', () => {
    expect(nextCaseId(['FP-0009.json', 'FP-0012', 'notes.md'])).toBe('FP-0013');
    expect(nextCaseId([])).toBe('FP-0001');
  });
});
