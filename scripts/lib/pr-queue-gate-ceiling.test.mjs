/**
 * The ceiling is what stops a model reasoning its way past a hard stop, so these
 * pin the direction it fails in: a verdict may only move toward ESCALATE, and a
 * word that is not in the vocabulary is not a weaker verdict but no verdict at
 * all. The second half is why this file exists. Ranking the proposed verdict by
 * its position in the list admitted every value that had none, so renaming
 * `MERGE` to `ENQUEUE` left `MERGE` — and any other string — clearing every
 * ceiling, including ESCALATE.
 *
 * Separate from `pr-queue-gate.test.mjs` because that file decides a verdict
 * from a fact record and this one bounds what may be done with the answer.
 */
import { describe, expect, it } from 'vite-plus/test';

import { isVerdict, isWithinCeiling } from './pr-queue-gate.mjs';

describe('isWithinCeiling — the model may only tighten', () => {
  it('allows tightening', () => {
    expect(isWithinCeiling('ENQUEUE', 'ESCALATE')).toBe(true);
    expect(isWithinCeiling('ACT', 'ESCALATE')).toBe(true);
    expect(isWithinCeiling('WAIT', 'WAIT')).toBe(true);
  });

  it('refuses any loosening — the whole point of the leash', () => {
    expect(isWithinCeiling('ESCALATE', 'ENQUEUE')).toBe(false);
    expect(isWithinCeiling('ESCALATE', 'ACT')).toBe(false);
    expect(isWithinCeiling('ACT', 'ENQUEUE')).toBe(false);
    expect(isWithinCeiling('WAIT', 'ENQUEUE')).toBe(false);
  });

  it('refuses MERGE — the spelling this vocabulary used to have', () => {
    expect(isVerdict('MERGE')).toBe(false);
    expect(isWithinCeiling('ESCALATE', 'MERGE')).toBe(false);
    expect(isWithinCeiling('ENQUEUE', 'MERGE')).toBe(false);
  });

  for (const proposed of ['TOTAL_NONSENSE', 'enqueue', '', undefined, null]) {
    it(`refuses ${JSON.stringify(proposed)} under every ceiling — not a verdict at all`, () => {
      expect(isVerdict(proposed)).toBe(false);
      for (const ceiling of ['ESCALATE', 'ACT', 'WAIT', 'ENQUEUE']) {
        expect(isWithinCeiling(ceiling, proposed)).toBe(false);
      }
    });
  }

  it('refuses a ceiling it cannot rank either', () => {
    expect(isWithinCeiling('MERGE', 'ESCALATE')).toBe(false);
    expect(isWithinCeiling(undefined, 'ESCALATE')).toBe(false);
  });

  it('knows exactly the four policy §1 verdicts', () => {
    expect(['ESCALATE', 'ACT', 'WAIT', 'ENQUEUE'].filter(isVerdict)).toEqual([
      'ESCALATE',
      'ACT',
      'WAIT',
      'ENQUEUE',
    ]);
  });
});
