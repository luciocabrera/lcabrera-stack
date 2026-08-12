import { describe, expect, it } from 'vite-plus/test';

import { filtersCodec } from './filtersCodec.util';

describe('filtersCodec', () => {
  it('round-trips a filters object', () => {
    const filters = {
      active: { type: 'boolean', value: true },
      name: { operator: 'contains', type: 'text', value: 'hello' },
    } as const;

    expect(filtersCodec.serialize(filters)).toBe(
      '{"active":true,"name":["ct","hello"]}',
    );
    expect(
      filtersCodec.deserialize(filtersCodec.serialize(filters)),
    ).toStrictEqual(filters);
  });

  it('refuses a payload that is not a column-keyed object', () => {
    expect(filtersCodec.deserialize('[["ct","hello"]]')).toStrictEqual({});
    expect(filtersCodec.deserialize('"hello"')).toStrictEqual({});
    expect(filtersCodec.deserialize('42')).toStrictEqual({});
    expect(filtersCodec.deserialize('null')).toStrictEqual({});
  });

  it('degrades rather than throwing on malformed JSON', () => {
    expect(() => filtersCodec.deserialize('{not json')).not.toThrow();
    expect(filtersCodec.deserialize('{not json')).toStrictEqual({});
  });

  it('yields no filter for a value it does not recognise', () => {
    // `[]` carries no operator at all; `["ct", 5]` pairs a text operator with a
    // payload no text filter can hold.
    const result = filtersCodec.deserialize(
      '{"bad":[],"mismatched":["ct",5],"name":["ct","test"]}',
    );

    expect(result.bad).toBeUndefined();
    expect(result.mismatched).toBeUndefined();
    expect(result.name).toStrictEqual({
      operator: 'contains',
      type: 'text',
      value: 'test',
    });
  });
});
