import { describe, expect, it, vi } from 'vite-plus/test';

import { createUrlStateCodec } from './createUrlStateCodec.util';

const { debugSpy } = vi.hoisted(() => ({ debugSpy: vi.fn() }));

vi.mock('#ui/utils/logger', () => ({ logger: { debug: debugSpy } }));

type Vocabulary = Record<string, 'off' | 'on'>;

const isVocabularyEntry = (
  entry: [string, unknown],
): entry is [string, 'off' | 'on'] => entry[1] === 'on' || entry[1] === 'off';

/**
 * A narrowing in the shape every migrated codec uses: it answers `undefined`
 * the moment it meets a token it does not know, and rebuilds the state with
 * `Object.fromEntries` rather than by assigning into `{}` — assignment would
 * route a `__proto__` key to the prototype setter and drop it. This example is
 * copied, so it follows the rule the codec documents.
 */
const narrowVocabulary = (parsed: unknown) => {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return;
  }

  const entries = Object.entries(parsed);

  if (!entries.every(isVocabularyEntry)) {
    return;
  }

  return Object.fromEntries(entries);
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

  it('logs the failure kind without echoing the param', () => {
    // V8 puts the input in a JSON.parse SyntaxError message, so logging the
    // error object would leak the param's leading characters. `filters` carries
    // user-entered text, so the log gets a discriminator and nothing else.
    debugSpy.mockClear();
    codec.deserialize('SESSIONTOKEN_abc123XYZ');

    const logged = debugSpy.mock.calls.flat().join(' ');

    expect(logged).toContain('vocabulary');
    expect(logged).toContain('SyntaxError');
    expect(logged).not.toContain('SESSIONTOK');
  });

  it('keeps a __proto__ key out of the prototype in the example narrowing', () => {
    const result = codec.deserialize('{"__proto__":"on","a":"off"}');

    expect(Object.keys(result)).toStrictEqual(['__proto__', 'a']);
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
  });
});
