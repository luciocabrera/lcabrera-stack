import { describe, expect, it } from 'vite-plus/test';

import { PersistenceError } from './persistence.error.ts';
import { UniqueConstraintViolationError } from './unique-constraint-violation.error.ts';

describe('UniqueConstraintViolationError', () => {
  it('names the constraint without leaking the offending value', () => {
    const cause = new Error(
      'duplicate key value violates unique constraint "orders_order_number_key"',
    );
    const error = new UniqueConstraintViolationError({
      cause,
      fields: { code: '23505', constraint: 'orders_order_number_key' },
    });

    expect(error.fields.constraint).toBe('orders_order_number_key');
    expect(error.message).toBe('A record with these values already exists.');
    expect(error.cause).toBe(cause);
  });

  it('is caught by a PersistenceError check', () => {
    const error = new UniqueConstraintViolationError({
      cause: undefined,
      fields: {},
    });

    expect(error).toBeInstanceOf(PersistenceError);
    expect(error.name).toBe('UniqueConstraintViolationError');
  });
});
