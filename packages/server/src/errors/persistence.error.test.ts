import { describe, expect, it } from 'vite-plus/test';

import { PersistenceError } from './persistence.error.ts';

describe('PersistenceError', () => {
  it('replaces the driver message with a safe one and keeps the cause', () => {
    const cause = new Error(
      'duplicate key value violates unique constraint "orders_order_number_key"',
    );
    const error = new PersistenceError({ cause, fields: { code: '23505' } });

    expect(error.message).toBe('The database rejected the operation.');
    expect(error.message).not.toContain('orders_order_number_key');
    expect(error.cause).toBe(cause);
  });

  it('carries the pg fields a consumer routes on', () => {
    const error = new PersistenceError({
      cause: undefined,
      fields: { code: '23502', column: 'customer_name' },
    });

    expect(error.fields).toEqual({ code: '23502', column: 'customer_name' });
  });

  it('is an Error with its own name, so logs and instanceof both work', () => {
    const error = new PersistenceError({ cause: undefined, fields: {} });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PersistenceError);
    expect(error.name).toBe('PersistenceError');
  });

  it('accepts an explicit message for a subclass to override', () => {
    const error = new PersistenceError({
      cause: undefined,
      fields: {},
      message: 'Something specific.',
    });

    expect(error.message).toBe('Something specific.');
  });
});
