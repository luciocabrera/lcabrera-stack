import { describe, expect, it } from 'vite-plus/test';

import { decodeStateFromURL } from './decodeStateFromURL.util';
import { encodeStateToURL } from './encodeStateToURL.util';

/** Hand-rolls the encoder so a refusal test can plant a payload it would never emit. */
const encodeUrlSafeBase64 = (json: string) =>
  btoa(json).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

describe('decodeStateFromURL', () => {
  it('decodes an encoded state object', () => {
    const state = { sorting: [{ columnKey: 'name', direction: 'asc' }] };
    const encoded = encodeStateToURL(state);
    const result = decodeStateFromURL({ encoded });
    expect(result).toEqual(state);
  });

  it('returns undefined for invalid base64', () => {
    expect(decodeStateFromURL({ encoded: '!!!invalid!!!' })).toBeUndefined();
  });

  it('returns undefined for invalid JSON', () => {
    const invalid = encodeUrlSafeBase64('not json');
    expect(decodeStateFromURL({ encoded: invalid })).toBeUndefined();
  });

  it('converts specified array keys to Sets', () => {
    const state = { columnVisibility: ['id', 'name'] };
    const encoded = encodeStateToURL(state);
    const result = decodeStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      encoded,
    });
    const columnVisibility = result?.columnVisibility;
    expect(columnVisibility).toBeInstanceOf(Set);
    expect((columnVisibility as Set<string>).has('id')).toBe(true);
  });

  it('skips convertArraysToSets when key is not an array', () => {
    const state = { columnVisibility: 'not-an-array' };
    const encoded = encodeStateToURL(state);
    const result = decodeStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      encoded,
    });
    expect(result?.columnVisibility).toBe('not-an-array');
  });

  it('rehydrates only the named keys, passing the rest through', () => {
    const state = { columnOrder: ['id'], columnVisibility: ['id', 'name'] };
    const result = decodeStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      encoded: encodeStateToURL(state),
    });

    expect(result?.columnVisibility).toBeInstanceOf(Set);
    expect(result?.columnOrder).toEqual(['id']);
    expect(result?.columnOrder).not.toBeInstanceOf(Set);
  });

  it('does not invent a key named in convertArraysToSets but absent', () => {
    const result = decodeStateFromURL({
      convertArraysToSets: ['columnVisibility'],
      encoded: encodeStateToURL({ columnOrder: ['id'] }),
    });

    expect(Object.keys(result ?? {})).toStrictEqual(['columnOrder']);
  });

  it('drops the whole state for a payload that is not an object', () => {
    expect(
      decodeStateFromURL({ encoded: encodeUrlSafeBase64('[1,2,3]') }),
    ).toBeUndefined();
    expect(
      decodeStateFromURL({ encoded: encodeUrlSafeBase64('"state"') }),
    ).toBeUndefined();
    expect(
      decodeStateFromURL({ encoded: encodeUrlSafeBase64('null') }),
    ).toBeUndefined();
  });

  it('degrades rather than throwing on a hand-edited param', () => {
    expect(() =>
      decodeStateFromURL({ encoded: '!!!invalid!!!' }),
    ).not.toThrow();
    expect(() => decodeStateFromURL({ encoded: 'aGVsbG8' })).not.toThrow();
  });
});
