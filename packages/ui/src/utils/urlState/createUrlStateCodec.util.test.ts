import { describe, expect, it } from 'vite-plus/test';

import { createUrlStateCodec } from './createUrlStateCodec.util';

type Vocabulary = Record<string, 'off' | 'on'>;

/**
 * A narrowing in the shape every migrated codec uses: it rebuilds the state
 * from recognised tokens only, and answers `undefined` the moment it meets one
 * it does not know.
 */
const narrowVocabulary = (parsed: unknown) => {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return;
  }

  const state: Vocabulary = {};

  for (const [key, token] of Object.entries(parsed)) {
    if (token !== 'on' && token !== 'off') {
      return;
    }

    state[key] = token;
  }

  return state;
};

const codec = createUrlStateCodec<Vocabulary>({
  compact: (state) => state,
  fallback: {},
  label: 'vocabulary',
  narrow: narrowVocabulary,
});

describe('createUrlStateCodec', () => {
  it('serializes state to JSON and reads it back', () => {
    const state = { a: 'on', b: 'off' } as const;

    expect(codec.serialize(state)).toBe('{"a":"on","b":"off"}');
    expect(codec.deserialize(codec.serialize(state))).toStrictEqual(state);
  });

  it('drops the whole state when the narrowing refuses one token', () => {
    // `a` is a perfectly good token; the contract is that it goes anyway.
    expect(codec.deserialize('{"a":"on","b":"sideways"}')).toStrictEqual({});
  });

  it('drops the whole state for a payload of the wrong shape', () => {
    expect(codec.deserialize('["on"]')).toStrictEqual({});
    expect(codec.deserialize('"on"')).toStrictEqual({});
    expect(codec.deserialize('42')).toStrictEqual({});
  });

  it('degrades rather than throwing on malformed JSON', () => {
    expect(() => codec.deserialize('{not json')).not.toThrow();
    expect(codec.deserialize('{not json')).toStrictEqual({});
  });

  it('returns the declared fallback, whatever its type', () => {
    const nullableCodec = createUrlStateCodec<Vocabulary, undefined>({
      compact: (state) => state,
      fallback: undefined,
      label: 'nullable',
      narrow: narrowVocabulary,
    });

    expect(nullableCodec.deserialize('{"a":"sideways"}')).toBeUndefined();
    expect(nullableCodec.deserialize('nonsense')).toBeUndefined();
  });

  it('applies the transport in both directions', () => {
    const base64Codec = createUrlStateCodec<Vocabulary>({
      compact: (state) => state,
      decodeParam: (param) => atob(param),
      encodeParam: (json) => btoa(json),
      fallback: {},
      label: 'base64',
      narrow: narrowVocabulary,
    });

    const encoded = base64Codec.serialize({ a: 'on' });

    expect(encoded).toBe(btoa('{"a":"on"}'));
    expect(base64Codec.deserialize(encoded)).toStrictEqual({ a: 'on' });
  });

  it('treats a throwing transport as a refusal, not a crash', () => {
    const explodingCodec = createUrlStateCodec<Vocabulary>({
      compact: (state) => state,
      decodeParam: () => {
        throw new Error('undecodable');
      },
      fallback: {},
      label: 'exploding',
      narrow: narrowVocabulary,
    });

    expect(() => explodingCodec.deserialize('anything')).not.toThrow();
    expect(explodingCodec.deserialize('anything')).toStrictEqual({});
  });

  it('treats a throwing narrowing as a refusal, not a crash', () => {
    const explodingCodec = createUrlStateCodec<Vocabulary>({
      compact: (state) => state,
      fallback: {},
      label: 'exploding',
      narrow: () => {
        throw new Error('unnarrowable');
      },
    });

    expect(() => explodingCodec.deserialize('{"a":"on"}')).not.toThrow();
    expect(explodingCodec.deserialize('{"a":"on"}')).toStrictEqual({});
  });
});
