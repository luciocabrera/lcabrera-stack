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

  it('reads the grouping mode, and omits it when the URL states none', () => {
    expect(
      groupingCodec.deserialize('{"keys":["a"],"mode":"rollup"}'),
    ).toStrictEqual({ keys: ['a'], mode: 'rollup' });
    expect(groupingCodec.deserialize('{"keys":["a"]}')).toStrictEqual({
      keys: ['a'],
    });
  });

  it('refuses a mode outside the vocabulary rather than falling back to flat', () => {
    // Whole-state refusal (ADR-061): the mode decides which grouping sets the
    // read emits, so substituting one answers a different question from the
    // one the link describes. `cube` is a real server-side mode and still not
    // one this package renders (#574).
    expect(
      groupingCodec.deserialize('{"keys":["a"],"mode":"cube"}'),
    ).toStrictEqual({ keys: [] });
    expect(
      groupingCodec.deserialize('{"keys":["a"],"mode":"toString"}'),
    ).toStrictEqual({ keys: [] });
  });

  it('refuses a member outside the envelope', () => {
    // The vocabulary was *extended* twice — to admit `agg`, then `mode` — not
    // opened: a fourth member still refuses the payload (ADR-061).
    expect(groupingCodec.deserialize('{"keys":["a"],"depth":2}')).toStrictEqual(
      { keys: [] },
    );
    expect(groupingCodec.deserialize('{"key":["a"]}')).toStrictEqual({
      keys: [],
    });
    expect(groupingCodec.deserialize('{}')).toStrictEqual({ keys: [] });
    expect(groupingCodec.deserialize('{"agg":{"amount":"sum"}}')).toStrictEqual(
      { keys: [] },
    );
  });

  it('round-trips an aggregate map beside the keys', () => {
    const compact = {
      agg: { total_amount: 'sum' },
      keys: ['order_status'],
    } as const;

    expect(groupingCodec.serialize(compact)).toBe(
      '{"agg":{"total_amount":"sum"},"keys":["order_status"]}',
    );
    expect(
      groupingCodec.deserialize(groupingCodec.serialize(compact)),
    ).toStrictEqual(compact);
  });

  it('refuses an aggregate token outside the vocabulary, dropping the whole payload', () => {
    // The keys here are valid and still go: an unrecognised token would index
    // the SQL aggregate map and resolve to `undefined` (ADR-061).
    expect(
      groupingCodec.deserialize(
        '{"agg":{"total_amount":"median"},"keys":["order_status"]}',
      ),
    ).toStrictEqual({ keys: [] });
    expect(
      groupingCodec.deserialize(
        '{"agg":{"total_amount":"toString"},"keys":["a"]}',
      ),
    ).toStrictEqual({ keys: [] });
    expect(
      groupingCodec.deserialize('{"agg":{"total_amount":7},"keys":["a"]}'),
    ).toStrictEqual({ keys: [] });
  });

  it('refuses an `agg` that is not an object', () => {
    expect(
      groupingCodec.deserialize('{"agg":["sum"],"keys":["a"]}'),
    ).toStrictEqual({ keys: [] });
    expect(
      groupingCodec.deserialize('{"agg":null,"keys":["a"]}'),
    ).toStrictEqual({ keys: [] });
  });

  it('accepts an empty aggregate map', () => {
    expect(groupingCodec.deserialize('{"agg":{},"keys":["a"]}')).toStrictEqual({
      agg: {},
      keys: ['a'],
    });
  });

  it('drops an empty aggregate map on the way out', () => {
    expect(groupingCodec.serialize({ agg: {}, keys: ['a'] })).toBe(
      '{"keys":["a"]}',
    );
  });

  it('carries an aggregate column named __proto__ as an own property', () => {
    // `agg` is rebuilt with `Object.fromEntries`, so a `__proto__` column name
    // survives as data rather than reaching the prototype setter — the
    // per-field drop the refusal contract exists to rule out. The loader's
    // sanitizer is what then refuses it for not being a column.
    const result = groupingCodec.deserialize(
      '{"agg":{"__proto__":"sum"},"keys":["a"]}',
    );

    expect(result.keys).toStrictEqual(['a']);
    expect(Object.hasOwn(result.agg ?? {}, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(result.agg)).toBe(Object.prototype);
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

describe('the granularity map', () => {
  it('round-trips beside the keys', () => {
    const serialized = groupingCodec.serialize({
      gran: { order_date: 'month' },
      keys: ['order_date', 'status'],
      mode: 'rollup',
    });

    expect(groupingCodec.deserialize(serialized)).toStrictEqual({
      gran: { order_date: 'month' },
      keys: ['order_date', 'status'],
      mode: 'rollup',
    });
  });

  it('drops an empty map, so an untruncated grouping is the param it always was', () => {
    expect(
      groupingCodec.serialize({ gran: {}, keys: ['status'] }),
    ).toStrictEqual(groupingCodec.serialize({ keys: ['status'] }));
  });

  it('refuses the whole payload for a period outside the vocabulary', () => {
    // Whole-state refusal (ADR-061): a partly-accepted configuration runs a
    // query nobody asked for while the URL still reads as the one shared.
    expect(
      groupingCodec.deserialize(
        JSON.stringify({
          gran: { order_date: 'fortnight' },
          keys: ['order_date'],
        }),
      ),
    ).toStrictEqual({ keys: [] });
  });

  it('refuses a granularity naming a column that is not a key', () => {
    // Not inert: the server refuses it too, so accepting it here would turn a
    // shared link into a failed read rather than into a table.
    expect(
      groupingCodec.deserialize(
        JSON.stringify({ gran: { order_date: 'month' }, keys: ['status'] }),
      ),
    ).toStrictEqual({ keys: [] });
  });

  it('refuses a granularity map that is not a map', () => {
    expect(
      groupingCodec.deserialize(
        JSON.stringify({ gran: ['month'], keys: ['order_date'] }),
      ),
    ).toStrictEqual({ keys: [] });
  });

  it('still refuses a fifth member', () => {
    // The envelope stays closed; `gran` widened it by exactly one.
    expect(
      groupingCodec.deserialize(
        JSON.stringify({ keys: ['status'], somethingElse: 1 }),
      ),
    ).toStrictEqual({ keys: [] });
  });
});
