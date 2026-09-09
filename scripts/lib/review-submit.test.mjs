/**
 * The two pure decisions `submit-pr-review.mjs` makes before it talks to GitHub.
 * The I/O shell is not covered here.
 */
import { describe, expect, it } from 'vite-plus/test';

import { flattenPages, refuseReason } from './review-submit.mjs';

describe('refuseReason', () => {
  it('rejects a missing or blank body', () => {
    expect(refuseReason({ body: undefined })).toBe('empty');
    expect(refuseReason({ body: '' })).toBe('empty');
    expect(refuseReason({ body: '   \n' })).toBe('empty');
  });

  it('rejects the leftover placeholder, even with surrounding whitespace', () => {
    expect(
      refuseReason({
        body: '(replace this file with the review body)\n',
        placeholder: '(replace this file with the review body)',
      }),
    ).toBe('placeholder');
  });

  it('accepts a real body', () => {
    expect(
      refuseReason({
        body: 'no findings\n',
        placeholder: '(replace this file with the review body)',
      }),
    ).toBeUndefined();
  });
});

describe('flattenPages', () => {
  it('flattens gh --paginate --slurp pages', () => {
    expect(
      flattenPages([[{ filename: 'a.ts' }], [{ filename: 'b.ts' }]]),
    ).toEqual([{ filename: 'a.ts' }, { filename: 'b.ts' }]);
  });

  it('leaves a single page of files as-is', () => {
    expect(flattenPages([{ filename: 'a.ts' }])).toEqual([
      { filename: 'a.ts' },
    ]);
  });

  it('treats a non-array as empty rather than throwing', () => {
    expect(flattenPages(undefined)).toEqual([]);
    expect(flattenPages({ files: [] })).toEqual([]);
  });
});
