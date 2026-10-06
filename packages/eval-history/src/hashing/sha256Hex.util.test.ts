import { describe, expect, it } from 'vite-plus/test';

import { sha256Hex } from './sha256Hex.util.ts';

describe('sha256Hex', () => {
  it('returns the lowercase hex SHA-256 of the UTF-8 text', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
