import { describe, expect, it } from 'vite-plus/test';

import { canonicalHash } from './canonicalHash.util.ts';
import { catalogHash } from './catalogHash.util.ts';

const alpha = { description: 'Use for alpha.', name: 'alpha' };
const beta = { description: 'Use for beta.', name: 'beta', paths: ['*.md'] };

describe('catalogHash', () => {
  it('hashes the entries sorted by name', () => {
    expect(catalogHash([beta, alpha])).toBe(canonicalHash([alpha, beta]));
  });

  it('changes when a description changes', () => {
    expect(
      catalogHash([alpha, { ...beta, description: 'Use for gamma.' }]),
    ).not.toBe(catalogHash([alpha, beta]));
  });
});
