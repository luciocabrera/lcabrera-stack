import { describe, expect, it } from 'vite-plus/test';

import {
  isBaselined,
  prunedBaseline,
  prunedCount,
  sortBaseline,
  withAccepted,
} from './docs-paths-baseline.mjs';

const finding = (doc, token) => ({ doc, token });

describe('isBaselined', () => {
  const baseline = { 'a.md': { 'packages/x': 'illustrative' } };

  it('is true only for a recorded (doc, reference) pair', () => {
    expect(isBaselined(baseline, 'a.md', 'packages/x')).toBe(true);
    expect(isBaselined(baseline, 'a.md', 'packages/y')).toBe(false);
    expect(isBaselined(baseline, 'b.md', 'packages/x')).toBe(false);
  });

  it('handles a document with no entries at all', () => {
    expect(isBaselined({}, 'a.md', 'packages/x')).toBe(false);
  });

  it('is not fooled by inherited Object properties', () => {
    expect(isBaselined(baseline, 'a.md', 'constructor')).toBe(false);
    expect(isBaselined({}, 'toString', 'toString')).toBe(false);
  });
});

describe('prunedBaseline', () => {
  it('drops entries whose reference now resolves', () => {
    const baseline = {
      'a.md': { 'packages/gone': 'why', 'packages/still': 'why' },
    };
    expect(
      prunedBaseline(baseline, [finding('a.md', 'packages/still')]),
    ).toEqual({
      'a.md': { 'packages/still': 'why' },
    });
  });

  it('drops a document entirely once it has no entries left', () => {
    const baseline = { 'a.md': { 'packages/gone': 'why' } };
    expect(prunedBaseline(baseline, [])).toEqual({});
  });

  it('NEVER adds a finding that is not already baselined', () => {
    const baseline = { 'a.md': { 'packages/known': 'why' } };
    const findings = [
      finding('a.md', 'packages/known'),
      finding('a.md', 'packages/brand-new'),
      finding('b.md', 'packages/also-new'),
    ];

    expect(prunedBaseline(baseline, findings)).toEqual({
      'a.md': { 'packages/known': 'why' },
    });
  });

  it("preserves each entry's reason verbatim", () => {
    const baseline = { 'a.md': { 'packages/x': 'a very specific reason' } };
    expect(prunedBaseline(baseline, [finding('a.md', 'packages/x')])).toEqual(
      baseline,
    );
  });

  it('does not match a reference against the wrong document', () => {
    const baseline = { 'a.md': { 'packages/x': 'why' } };
    expect(prunedBaseline(baseline, [finding('b.md', 'packages/x')])).toEqual(
      {},
    );
  });
});

describe('prunedCount', () => {
  it('counts how many entries a prune would drop', () => {
    const baseline = {
      'a.md': { 'packages/gone': 'why', 'packages/still': 'why' },
      'b.md': { 'packages/also-gone': 'why' },
    };
    expect(prunedCount(baseline, [finding('a.md', 'packages/still')])).toBe(2);
  });

  it('is zero when every entry still fails', () => {
    const baseline = { 'a.md': { 'packages/x': 'why' } };
    expect(prunedCount(baseline, [finding('a.md', 'packages/x')])).toBe(0);
  });
});

describe('withAccepted', () => {
  it('adds exactly one reference with its reason', () => {
    expect(
      withAccepted(
        {},
        { doc: 'a.md', reason: 'illustrative', token: 'packages/x' },
      ),
    ).toEqual({ 'a.md': { 'packages/x': 'illustrative' } });
  });

  it('keeps the other references in the same document', () => {
    const baseline = { 'a.md': { 'packages/one': 'first' } };
    expect(
      withAccepted(baseline, {
        doc: 'a.md',
        reason: 'second',
        token: 'packages/two',
      }),
    ).toEqual({
      'a.md': { 'packages/one': 'first', 'packages/two': 'second' },
    });
  });

  it('does not mutate the baseline it was given', () => {
    const baseline = { 'a.md': { 'packages/one': 'first' } };
    withAccepted(baseline, { doc: 'a.md', reason: 'x', token: 'packages/two' });
    expect(baseline).toEqual({ 'a.md': { 'packages/one': 'first' } });
  });
});

describe('sortBaseline', () => {
  it('orders documents and references so a diff shows only real changes', () => {
    const sorted = sortBaseline({
      'z.md': { 'packages/b': 'x', 'packages/a': 'x' },
      'a.md': { 'packages/c': 'x' },
    });

    expect(Object.keys(sorted)).toEqual(['a.md', 'z.md']);
    expect(Object.keys(sorted['z.md'])).toEqual(['packages/a', 'packages/b']);
  });
});
