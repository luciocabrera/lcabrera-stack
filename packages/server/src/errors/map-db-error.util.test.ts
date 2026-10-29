import { describe, expect, it } from 'vite-plus/test';

import { ForeignKeyViolationError } from './foreign-key-violation.error.ts';
import { GroupingRefusedError } from './grouping-refused.error.ts';
import { mapDbError } from './map-db-error.util.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryCanceledError } from './query-canceled.error.ts';
import { QueryRefusedError } from './query-refused.error.ts';
import { toSerializableDbError } from './to-serializable-db-error.util.ts';
import { UniqueConstraintViolationError } from './unique-constraint-violation.error.ts';

type PgErrorArgs = {
  readonly code: string;
  readonly fields?: Readonly<Record<string, string>>;
};

const pgError = ({ code, fields = {} }: PgErrorArgs) =>
  Object.assign(new Error(`driver said ${code}`), { code, ...fields });

describe('mapDbError', () => {
  it('translates 23505 into a unique-constraint violation', () => {
    const cause = pgError({
      code: '23505',
      fields: { constraint: 'orders_order_number_key' },
    });
    const error = mapDbError(cause);

    expect(error).toBeInstanceOf(UniqueConstraintViolationError);
    expect(error).toMatchObject({
      cause,
      fields: {
        code: '23505',
        column: undefined,
        constraint: 'orders_order_number_key',
      },
    });
  });

  it('translates 23503 into a foreign-key violation', () => {
    const cause = pgError({
      code: '23503',
      fields: { constraint: 'orders_customer_id_fkey' },
    });

    expect(mapDbError(cause)).toBeInstanceOf(ForeignKeyViolationError);
  });

  it('translates 57014 into a query cancellation', () => {
    const cause = pgError({ code: '57014' });
    const error = mapDbError(cause);

    expect(error).toBeInstanceOf(QueryCanceledError);
    expect(error).toBeInstanceOf(PersistenceError);
    expect(error).toMatchObject({ cause, fields: { code: '57014' } });
  });

  it('falls back to PersistenceError for an unnamed SQLSTATE', () => {
    const error = mapDbError(
      pgError({ code: '42703', fields: { column: 'nope' } }),
    );

    expect(error).toBeInstanceOf(PersistenceError);
    expect(error).not.toBeInstanceOf(UniqueConstraintViolationError);
    expect(error).toMatchObject({ fields: { code: '42703' } });
  });

  it('falls back to PersistenceError for a rejection that is not a pg error', () => {
    const error = mapDbError('connection reset');

    expect(error).toBeInstanceOf(PersistenceError);
    expect(error).toMatchObject({
      cause: 'connection reset',
      fields: { code: undefined, column: undefined, constraint: undefined },
    });
  });

  it('never puts the driver message on the translated error', () => {
    const error = mapDbError(
      Object.assign(
        new Error(
          'duplicate key value violates unique constraint "orders_order_number_key"',
        ),
        { code: '23505', detail: 'Key (order_number)=(A-1) already exists.' },
      ),
    );

    expect(error.message).toBe('A record with these values already exists.');
    expect(error.message).not.toContain('order_number');
  });

  it('passes an already-translated error through, so composed executors do not re-wrap', () => {
    const translated = mapDbError(pgError({ code: '23505' }));

    expect(mapDbError(translated)).toBe(translated);
    expect(mapDbError(translated)).toBeInstanceOf(
      UniqueConstraintViolationError,
    );
  });

  it('returns a query refusal unchanged, so it still serialises as query-refused', () => {
    const refusal = new QueryRefusedError({
      column: 'secret',
      message: 'Column "secret" is not allowed.',
      reason: 'column-not-allowed',
    });
    const error = mapDbError(refusal);

    expect(error).toBe(refusal);
    expect(error).not.toBeInstanceOf(PersistenceError);
    expect(toSerializableDbError(error)).toEqual({
      kind: 'query-refused',
      message: 'The request named a column this query does not allow.',
      reason: 'column-not-allowed',
    });
  });

  it('returns a grouping refusal unchanged, keeping its subclass', () => {
    const refusal = new GroupingRefusedError({
      estimatedRows: 10,
      message: 'The grouping would return too many rows.',
      reason: 'estimate-too-large',
    });
    const error = mapDbError(refusal);

    expect(error).toBe(refusal);
    expect(toSerializableDbError(error)).toMatchObject({
      kind: 'grouping-refused',
      reason: 'estimate-too-large',
    });
  });
});
