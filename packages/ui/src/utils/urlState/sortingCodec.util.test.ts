import { describe, expect, it } from 'vite-plus/test';

import { sortingCodec } from './sortingCodec.util';

describe('sortingCodec', () => {
  it('round-trips a compact sorting object', () => {
    const compact = { age: 'desc', name: 'asc' } as const;

    expect(sortingCodec.serialize(compact)).toBe('{"age":"desc","name":"asc"}');
    expect(
      sortingCodec.deserialize(sortingCodec.serialize(compact)),
    ).toStrictEqual(compact);
  });

  it('refuses the whole payload for a hand-edited direction', () => {
    // `name` is valid and still goes: the refusal is of the payload, not the key.
    expect(
      sortingCodec.deserialize('{"name":"asc","age":"; DROP TABLE"}'),
    ).toStrictEqual({});
  });

  it('refuses a direction that is the right type but the wrong token', () => {
    expect(sortingCodec.deserialize('{"name":"ASC"}')).toStrictEqual({});
    expect(sortingCodec.deserialize('{"name":"ascending"}')).toStrictEqual({});
  });

  it('refuses a direction that is not a string at all', () => {
    expect(sortingCodec.deserialize('{"name":1}')).toStrictEqual({});
    expect(sortingCodec.deserialize('{"name":null}')).toStrictEqual({});
    expect(
      sortingCodec.deserialize('{"name":{"direction":"asc"}}'),
    ).toStrictEqual({});
  });

  it('refuses a payload that is not an object', () => {
    expect(sortingCodec.deserialize('["name","asc"]')).toStrictEqual({});
    expect(sortingCodec.deserialize('"asc"')).toStrictEqual({});
    expect(sortingCodec.deserialize('null')).toStrictEqual({});
  });

  it('degrades rather than throwing on malformed JSON', () => {
    expect(() => sortingCodec.deserialize('not-json')).not.toThrow();
    expect(sortingCodec.deserialize('not-json')).toStrictEqual({});
  });

  it('accepts an empty object', () => {
    expect(sortingCodec.deserialize('{}')).toStrictEqual({});
  });

  it('keeps a __proto__ key rather than dropping that one field', () => {
    // Assigning into `{}` routes this to the prototype setter and loses it,
    // which is the per-field drop the refusal contract rules out.
    const result = sortingCodec.deserialize(
      '{"__proto__":"asc","name":"desc"}',
    );

    expect(Object.keys(result)).toStrictEqual(['__proto__', 'name']);
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')?.value).toBe(
      'asc',
    );
  });

  it('leaves Object.prototype untouched by a __proto__ key', () => {
    sortingCodec.deserialize('{"__proto__":"asc"}');

    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
    expect(Object.prototype).not.toHaveProperty('asc');
  });
});
