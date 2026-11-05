/*
 * A false-positive marker's claim is spelled twice: in this repository's gate
 * (`case-id.mjs`) and in the published fallow gate, which cannot import from
 * a repository. This pins the two spellings together, so a marker one gate
 * accepts is a marker the other accepts.
 */
import { describe, expect, it } from 'vite-plus/test';

import { ADJUDICATED_REASON } from '../../packages/repo-standards/scripts/fallow-gate-report.mjs';
import { CLAIM } from './case-id.mjs';

describe('the claim spelling', () => {
  it('is the same pattern in both gates', () => {
    expect(ADJUDICATED_REASON.source).toBe(CLAIM.source);
    expect(ADJUDICATED_REASON.flags).toBe(CLAIM.flags);
  });

  it.each([
    'false positive, case FP-0001: why',
    'false positive, case FP-12345: a wider id',
    'false positive, case FP-0001: a reason: with a colon',
  ])('both accept %j with the same case and reason', (text) => {
    expect(ADJUDICATED_REASON.exec(text)?.slice(1)).toEqual(
      CLAIM.exec(text)?.slice(1),
    );
    expect(CLAIM.test(text)).toBe(true);
  });

  it.each([
    'false positive, case FP-0001:',
    'false positive, case FP-0001: ',
    'false positive, case FP-01: a short id',
    'false positive, case FP-0001 no colon',
    'see false positive, case FP-0001: why',
    'False positive, case FP-0001: why',
  ])('both reject %j', (text) => {
    expect(ADJUDICATED_REASON.test(text)).toBe(false);
    expect(CLAIM.test(text)).toBe(false);
  });
});
