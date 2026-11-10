import { describe, expect, it } from 'vite-plus/test';

import { seat, VERDICTS } from './adjudications.fixtures';
import { isAdversaryAlone } from './isAdversaryAlone.util';

const ofCase = (caseId: string) =>
  VERDICTS.filter((verdict) => verdict.caseId === caseId);

describe('isAdversaryAlone', () => {
  it('holds when the adversary said REAL and every judge dismissed it', () => {
    expect(isAdversaryAlone(ofCase('FP-0002'))).toBe(true);
  });

  it('fails when a judge said REAL too, or nobody did', () => {
    expect(isAdversaryAlone(ofCase('FP-0004'))).toBe(false);
    expect(isAdversaryAlone(ofCase('FP-0001'))).toBe(false);
  });

  it('fails without a judge or without an adversary', () => {
    expect(
      isAdversaryAlone([
        seat({
          caseId: 'FP-0006',
          model: 'm',
          role: 'adversary',
          verdict: 'REAL',
        }),
      ]),
    ).toBe(false);
    expect(isAdversaryAlone([])).toBe(false);
  });
});
