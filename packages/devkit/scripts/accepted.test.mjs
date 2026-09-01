import { describe, expect, test } from 'vite-plus/test';

import {
  acceptDecision,
  acceptedEntry,
  isAccepted,
  parseAcceptArgs,
  parseAccepted,
  serialiseAccepted,
  withAccepted,
} from './accepted.mjs';

const PATH = '.github/skills/demo/SKILL.md';
const EDIT = 'a'.repeat(64);
const OTHER_EDIT = 'b'.repeat(64);

const record = (overrides) => ({
  [PATH]: { hash: EDIT, reason: 'our tracker is not GitHub', ...overrides },
});

describe('parseAccepted', () => {
  test('reads back a record this module wrote', () => {
    expect(parseAccepted(serialiseAccepted(record()))).toEqual(record());
  });

  test('treats absent, blank and malformed records as no record', () => {
    expect(parseAccepted(undefined)).toEqual({});
    expect(parseAccepted('')).toEqual({});
    expect(parseAccepted('{ not json')).toEqual({});
    expect(parseAccepted('[]')).toEqual({});
    expect(parseAccepted('"a string"')).toEqual({});
  });

  test('drops an entry whose hash is not a hash', () => {
    const raw = JSON.stringify({
      'bad.md': { hash: null, reason: 'deliberate' },
      'good.md': { hash: EDIT, reason: 'deliberate' },
    });
    expect(Object.keys(parseAccepted(raw))).toEqual(['good.md']);
  });

  test('drops an entry with no stated reason, so a hand-edit cannot skip --reason', () => {
    const raw = JSON.stringify({
      'blank.md': { hash: EDIT, reason: '   ' },
      'missing.md': { hash: EDIT },
      'stated.md': { hash: EDIT, reason: 'deliberate' },
    });
    expect(Object.keys(parseAccepted(raw))).toEqual(['stated.md']);
  });

  test('drops an entry that is not an object at all', () => {
    const raw = JSON.stringify({ 'bad.md': EDIT, 'good.md': record()[PATH] });
    expect(Object.keys(parseAccepted(raw))).toEqual(['good.md']);
  });
});

describe('serialiseAccepted', () => {
  test('orders paths so re-recording produces no incidental diff', () => {
    const raw = serialiseAccepted({
      'b.md': { hash: EDIT, reason: 'x' },
      'a.md': { hash: OTHER_EDIT, reason: 'y' },
    });
    expect(raw.indexOf('a.md')).toBeLessThan(raw.indexOf('b.md'));
    expect(raw.endsWith('\n')).toBe(true);
  });
});

describe('isAccepted', () => {
  test('matches only the exact content that was acknowledged', () => {
    expect(isAccepted({ accepted: record(), hash: EDIT, path: PATH })).toBe(
      true,
    );
    expect(
      isAccepted({ accepted: record(), hash: OTHER_EDIT, path: PATH }),
    ).toBe(false);
  });

  test('two absences do not read as a match', () => {
    const broken = withAccepted(
      {},
      { hash: undefined, path: PATH, reason: 'x' },
    );
    expect(isAccepted({ accepted: broken, hash: undefined, path: PATH })).toBe(
      false,
    );
  });

  test('does not read an acknowledgement off the prototype chain', () => {
    expect(isAccepted({ accepted: {}, hash: EDIT, path: 'constructor' })).toBe(
      false,
    );
    expect(
      acceptedEntry({ accepted: {}, path: 'constructor' }),
    ).toBeUndefined();
  });
});

describe('withAccepted', () => {
  test('adds exactly one acknowledgement and leaves the rest alone', () => {
    expect(
      withAccepted(record(), {
        hash: OTHER_EDIT,
        path: 'other.md',
        reason: 'second',
      }),
    ).toEqual({
      ...record(),
      'other.md': { hash: OTHER_EDIT, reason: 'second' },
    });
  });
});

describe('parseAcceptArgs', () => {
  test('is undefined when nothing was asked for', () => {
    expect(parseAcceptArgs(['--check', '--verbose'])).toBeUndefined();
  });

  test('reads the path and the reason', () => {
    expect(parseAcceptArgs(['--accept', PATH, '--reason', 'ours'])).toEqual({
      path: PATH,
      reason: 'ours',
    });
  });

  test('a flag where a value should be reads as no value', () => {
    expect(parseAcceptArgs(['--accept', '--reason', 'ours'])).toEqual({
      path: undefined,
      reason: 'ours',
    });
    expect(parseAcceptArgs(['--accept', PATH, '--reason'])).toEqual({
      path: PATH,
      reason: undefined,
    });
  });
});

describe('acceptDecision', () => {
  const modified = {
    onDiskHash: EDIT,
    path: PATH,
    state: 'modified',
  };

  test('takes the on-disk hash of a locally modified file', () => {
    expect(
      acceptDecision({
        entries: [modified],
        path: PATH,
        reason: '  our tracker is not GitHub  ',
      }),
    ).toEqual({ hash: EDIT, reason: 'our tracker is not GitHub' });
  });

  test('refuses an acknowledgement with no stated reason', () => {
    for (const reason of [undefined, '', '   ']) {
      const decision = acceptDecision({
        entries: [modified],
        path: PATH,
        reason,
      });
      expect(decision.hash).toBeUndefined();
      expect(decision.error).toContain('--reason');
    }
  });

  test('refuses when no path was given', () => {
    const decision = acceptDecision({ entries: [modified], reason: 'ours' });
    expect(decision.hash).toBeUndefined();
    expect(decision.error).toContain('--accept');
  });

  test('refuses a path this kit does not materialise', () => {
    const decision = acceptDecision({
      entries: [modified],
      path: 'README.md',
      reason: 'ours',
    });
    expect(decision.hash).toBeUndefined();
    expect(decision.error).toContain('README.md');
  });

  test('refuses every state that is not a live divergence, naming the one it found', () => {
    const refusals = ['acknowledged', 'added', 'current', 'unmet', 'unresolved']
      .map((state) =>
        acceptDecision({
          entries: [{ ...modified, state }],
          path: PATH,
          reason: 'ours',
        }),
      )
      .map((decision) => decision.error);
    expect(refusals.every((error) => error !== undefined)).toBe(true);
    expect(refusals[0]).toContain('acknowledged');
  });

  test('accepts a conflict, which is the state that made --check unusable', () => {
    const decision = acceptDecision({
      entries: [{ ...modified, state: 'conflict' }],
      path: PATH,
      reason: 'ours predates the kit',
    });

    expect(decision.error).toBeUndefined();
    expect(decision.hash).toBe(modified.onDiskHash);
  });
});
