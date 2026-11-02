import { describe, expect, it } from 'vite-plus/test';

import { CASE_FILE, CASE_ID, CLAIM } from './case-id.mjs';

describe('the case-id patterns', () => {
  it.each(['FP-0001', 'FP-10000'])(
    'accept %s as an id, a file and a claim',
    (id) => {
      expect(CASE_ID.test(id)).toBe(true);
      expect(CASE_FILE.exec(`${id}.json`)?.[1]).toBe(id.slice(3));
      expect(CASE_FILE.exec(id)?.[1]).toBe(id.slice(3));
      expect(CLAIM.exec(`false positive, case ${id}: why`)?.slice(1)).toEqual([
        id,
        'why',
      ]);
    },
  );

  it.each(['FP-001', 'xFP-0001', 'FP-0001x', 'fp-0001'])(
    'refuse %s',
    (value) => {
      expect(CASE_ID.test(value)).toBe(false);
      expect(CASE_FILE.test(value)).toBe(false);
      expect(CLAIM.test(`false positive, case ${value}: why`)).toBe(false);
    },
  );

  it('refuses a case file name with another suffix, and a claim not at the start', () => {
    expect(CASE_FILE.test('FP-0001.json.bak')).toBe(false);
    expect(CLAIM.test('see false positive, case FP-0001: why')).toBe(false);
  });
});
