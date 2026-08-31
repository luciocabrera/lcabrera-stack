import { describe, expect, it } from 'vite-plus/test';

import { parseAuthToken } from './parseAuthToken.util';

describe('parseAuthToken', () => {
  it('splits a well-formed token into payload and signature', () => {
    expect(parseAuthToken({ token: 'cGF5bG9hZA.deadbeef' })).toEqual({
      payload: 'cGF5bG9hZA',
      signature: 'deadbeef',
    });
  });

  it('returns undefined when there is no separator', () => {
    expect(parseAuthToken({ token: 'garbage' })).toBeUndefined();
  });

  it('returns undefined when the payload half is empty', () => {
    expect(parseAuthToken({ token: '.deadbeef' })).toBeUndefined();
  });

  it('returns undefined when the signature half is empty', () => {
    expect(parseAuthToken({ token: 'cGF5bG9hZA.' })).toBeUndefined();
  });

  it('returns undefined for an empty token', () => {
    expect(parseAuthToken({ token: '' })).toBeUndefined();
  });

  it('rejects a token carrying an extra separator', () => {
    expect(parseAuthToken({ token: 'cGF5bG9hZA.dead.beef' })).toBeUndefined();
  });
});
