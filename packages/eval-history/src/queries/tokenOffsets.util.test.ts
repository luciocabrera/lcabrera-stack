import { describe, expect, it } from 'vite-plus/test';

import { tokenOffsets } from './tokenOffsets.util.ts';

describe('tokenOffsets', () => {
  it('finds every whole-word occurrence of a token', () => {
    expect(
      tokenOffsets({
        text: 'd.detail, d.detail_schema, xd.detail',
        token: 'd.detail',
      }),
    ).toEqual([0]);
    expect(tokenOffsets({ text: 'a.b a.b', token: 'a.b' })).toEqual([0, 4]);
  });

  it('treats the token literally, not as a pattern', () => {
    expect(tokenOffsets({ text: 'aXb a.b', token: 'a.b' })).toEqual([4]);
  });

  it('finds nothing for an empty or absent token', () => {
    expect(tokenOffsets({ text: 'abc', token: '' })).toEqual([]);
    expect(tokenOffsets({ text: 'abc', token: 'x' })).toEqual([]);
  });
});
