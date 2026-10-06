import { describe, expect, it } from 'vite-plus/test';

import { canonicalHash } from './canonicalHash.util.ts';
import { contentHash } from './contentHash.util.ts';

describe('canonicalHash', () => {
  it('hashes two objects that differ only in key order equal', () => {
    expect(canonicalHash(JSON.parse('{"b":2,"a":1}'))).toBe(
      canonicalHash({ a: 1, b: 2 }),
    );
  });

  it('is the content hash of the canonical JSON', () => {
    expect(canonicalHash({ a: 1 })).toBe(contentHash('{"a":1}'));
  });
});
