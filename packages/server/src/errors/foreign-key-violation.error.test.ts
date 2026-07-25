import { describe, expect, it } from 'vite-plus/test';

import { ForeignKeyViolationError } from './foreign-key-violation.error.ts';
import { PersistenceError } from './persistence.error.ts';

describe('ForeignKeyViolationError', () => {
  it('names the constraint and reports a safe message', () => {
    const cause = new Error(
      'insert or update on table "orders" violates foreign key constraint "orders_customer_id_fkey"',
    );
    const error = new ForeignKeyViolationError({
      cause,
      fields: { code: '23503', constraint: 'orders_customer_id_fkey' },
    });

    expect(error.fields.constraint).toBe('orders_customer_id_fkey');
    expect(error.message).toBe('A referenced record does not exist.');
    expect(error.cause).toBe(cause);
  });

  it('is caught by a PersistenceError check', () => {
    const error = new ForeignKeyViolationError({
      cause: undefined,
      fields: {},
    });

    expect(error).toBeInstanceOf(PersistenceError);
    expect(error.name).toBe('ForeignKeyViolationError');
  });
});
