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
});
