import { describe, expect, it } from 'vite-plus/test';

import { stateCodec } from './stateCodec.util';

const toUrlSafeBase64 = (json: string) =>
  btoa(json).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

describe('stateCodec', () => {
  it('round-trips a state object through URL-safe Base64', () => {
    const state = { columnOrder: ['id', 'name'] };

    expect(stateCodec.serialize(state)).toBe(
      toUrlSafeBase64('{"columnOrder":["id","name"]}'),
    );
    expect(stateCodec.deserialize(stateCodec.serialize(state))).toStrictEqual(
      state,
    );
  });

  it('serializes Sets as arrays', () => {
    expect(stateCodec.serialize({ columnVisibility: new Set(['id']) })).toBe(
      toUrlSafeBase64('{"columnVisibility":["id"]}'),
    );
  });

  it('refuses a payload that is not an object', () => {
    expect(stateCodec.deserialize(toUrlSafeBase64('[1,2,3]'))).toBeUndefined();
    expect(stateCodec.deserialize(toUrlSafeBase64('"state"'))).toBeUndefined();
    expect(stateCodec.deserialize(toUrlSafeBase64('null'))).toBeUndefined();
  });

  it('degrades rather than throwing on undecodable Base64', () => {
    expect(() => stateCodec.deserialize('!!!invalid!!!')).not.toThrow();
    expect(stateCodec.deserialize('!!!invalid!!!')).toBeUndefined();
  });

  it('degrades rather than throwing on Base64 that is not JSON', () => {
    expect(stateCodec.deserialize(toUrlSafeBase64('not json'))).toBeUndefined();
  });
});
