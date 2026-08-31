import { describe, expect, it } from 'vite-plus/test';

import { ForeignKeyViolationError } from './foreign-key-violation.error.ts';
import { GroupingRefusedError } from './grouping-refused.error.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryCanceledError } from './query-canceled.error.ts';
import { toSerializableDbError } from './to-serializable-db-error.util.ts';

describe('toSerializableDbError', () => {
  it('maps a refusal with the reason, the column and the bound', () => {
    expect(
      toSerializableDbError(
        new GroupingRefusedError({
          column: 'city',
          estimatedRows: 120_000,
          message: 'This grouping is estimated to return 120000 rows.',
          reason: 'estimate-too-large',
        }),
      ),
    ).toEqual({
      column: 'city',
      estimatedRows: 120_000,
      kind: 'grouping-refused',
      message: 'This grouping is estimated to return 120000 rows.',
      reason: 'estimate-too-large',
    });
  });

  it('omits the optional fields a refusal did not name', () => {
    expect(
      toSerializableDbError(
        new GroupingRefusedError({
          message: 'too deep',
          reason: 'too-many-keys',
        }),
      ),
    ).toEqual({
      kind: 'grouping-refused',
      message: 'too deep',
      reason: 'too-many-keys',
    });
  });

  it('maps a cancellation before the PersistenceError it extends', () => {
    expect(
      toSerializableDbError(
        new QueryCanceledError({ cause: undefined, fields: { code: '57014' } }),
      ),
    ).toEqual({
      kind: 'db-canceled',
      message:
        'The database stopped the query before it finished. Narrow it and try again.',
    });
  });

  it('maps a translated driver failure with its SQLSTATE', () => {
    expect(
      toSerializableDbError(
        new ForeignKeyViolationError({
          cause: undefined,
          fields: { code: '23503', constraint: 'orders_customer_id_fkey' },
        }),
      ),
    ).toMatchObject({ code: '23503', kind: 'db-failed' });
  });

  it('says nothing about an untranslated throw', () => {
    const mapped = toSerializableDbError(
      new Error('relation "orders" does not exist at character 15'),
    );

    expect(mapped).toEqual({
      kind: 'unexpected',
      message: 'The request could not be completed.',
    });
    expect(JSON.stringify(mapped)).not.toContain('orders');
  });

  it('produces plain data that survives a structured clone unchanged', () => {
    const mapped = toSerializableDbError(
      new GroupingRefusedError({
        column: 'city',
        message: 'refused',
        reason: 'column-not-groupable',
      }),
    );

    expect(structuredClone(mapped)).toEqual(mapped);
    expect(Object.getPrototypeOf(mapped)).toBe(Object.prototype);
  });

  it('recovers the message the class hides behind a non-enumerable property', () => {
    const error = new PersistenceError({
      cause: undefined,
      fields: { code: '42703' },
    });

    expect(Object.prototype.propertyIsEnumerable.call(error, 'message')).toBe(
      false,
    );
    expect(Object.keys(error)).not.toContain('message');

    const mapped = toSerializableDbError(error);

    expect(Object.keys(mapped)).toContain('message');
    expect(mapped.message).toBe('The database rejected the operation.');
  });
});
