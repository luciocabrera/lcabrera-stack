import { describe, expect, it } from 'vite-plus/test';

import { groupingCodec } from './groupingCodec.util';

describe('groupingCodec', () => {
  it('round-trips a compact grouping object', () => {
    const compact = { keys: ['order_status'] } as const;

    expect(groupingCodec.serialize(compact)).toBe('{"keys":["order_status"]}');
    expect(
      groupingCodec.deserialize(groupingCodec.serialize(compact)),
    ).toStrictEqual(compact);
  });

  it('serializes without a transport layer, so the param is readable JSON', () => {
    // ADR-061: the same plain compact JSON as `sorting` and `filters` — a
    // Base64 or otherwise encoded param would round-trip just as well, which is
    // why this asserts the exact text rather than only the round trip.
    expect(groupingCodec.serialize({ keys: ['a', 'b'] })).toBe(
      '{"keys":["a","b"]}',
    );
  });

  it('refuses a key that is not a string, dropping the whole payload', () => {
    // `order_status` is valid and still goes: the refusal is of the payload.
    expect(
      groupingCodec.deserialize('{"keys":["order_status",7]}'),
    ).toStrictEqual({ keys: [] });
    expect(groupingCodec.deserialize('{"keys":[null]}')).toStrictEqual({
      keys: [],
    });
    expect(
      groupingCodec.deserialize('{"keys":[{"column":"order_status"}]}'),
    ).toStrictEqual({ keys: [] });
  });

  it('refuses a member outside the envelope', () => {
    expect(
      groupingCodec.deserialize('{"keys":["a"],"mode":"rollup"}'),
    ).toStrictEqual({ keys: [] });
    expect(groupingCodec.deserialize('{"key":["a"]}')).toStrictEqual({
      keys: [],
    });
    expect(groupingCodec.deserialize('{}')).toStrictEqual({ keys: [] });
  });

  it('refuses a `keys` that is not an array', () => {
    expect(groupingCodec.deserialize('{"keys":"order_status"}')).toStrictEqual({
      keys: [],
    });
    expect(groupingCodec.deserialize('{"keys":null}')).toStrictEqual({
      keys: [],
    });
  });

  it('refuses a payload that is not an object', () => {
    expect(groupingCodec.deserialize('["order_status"]')).toStrictEqual({
      keys: [],
    });
    expect(groupingCodec.deserialize('"order_status"')).toStrictEqual({
      keys: [],
    });
    expect(groupingCodec.deserialize('null')).toStrictEqual({ keys: [] });
  });

  it('degrades rather than throwing on malformed JSON', () => {
    expect(() => groupingCodec.deserialize('{not-json')).not.toThrow();
    expect(groupingCodec.deserialize('{not-json')).toStrictEqual({ keys: [] });
  });

  it('refuses a __proto__ member rather than silently dropping it', () => {
    const result = groupingCodec.deserialize('{"__proto__":["a"]}');

    expect(result).toStrictEqual({ keys: [] });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });

  it('accepts an empty key list, which is the same as no grouping', () => {
    expect(groupingCodec.deserialize('{"keys":[]}')).toStrictEqual({
      keys: [],
    });
  });
});
