import { describe, expect, it } from 'vite-plus/test';

import { dropNullishValues } from './drop-nullish-values.util';

const fromJson = <T extends object>(json: string) => JSON.parse(json) as T;

describe('dropNullishValues', () => {
  it('drops null and undefined entries and keeps the rest', () => {
    const record = {
      ...fromJson<{ readonly line_count: null | number }>(
        '{"line_count":null}',
      ),
      end_line: 42,
      is_exported: true,
      symbol_name: undefined,
    };

    expect(dropNullishValues(record)).toEqual({
      end_line: 42,
      is_exported: true,
    });
  });

  it('omits the key rather than emitting it as null, so JSON drops it', () => {
    const result = dropNullishValues(
      fromJson<{ readonly kept: number; readonly removed: null | number }>(
        '{"kept":1,"removed":null}',
      ),
    );

    expect(Object.keys(result)).toEqual(['kept']);
    expect(JSON.stringify(result)).toBe('{"kept":1}');
  });

  it('keeps falsy values that are not nullish', () => {
    expect(dropNullishValues({ empty: '', off: false, zero: 0 })).toEqual({
      empty: '',
      off: false,
      zero: 0,
    });
  });

  it('returns an empty object when every value is nullish', () => {
    const record = {
      ...fromJson<{ readonly a: null | number }>('{"a":null}'),
      b: undefined,
    };

    expect(dropNullishValues(record)).toEqual({});
  });

  it('passes nested objects through untouched (it is shallow)', () => {
    const record = fromJson<{ readonly nested: { readonly inner: null } }>(
      '{"nested":{"inner":null}}',
    );

    expect(JSON.stringify(dropNullishValues(record))).toBe(
      '{"nested":{"inner":null}}',
    );
  });

  it('does not mutate the input', () => {
    const input = fromJson<{ readonly a: number; readonly b: null | number }>(
      '{"a":1,"b":null}',
    );

    dropNullishValues(input);

    expect(Object.keys(input)).toEqual(['a', 'b']);
  });
});
