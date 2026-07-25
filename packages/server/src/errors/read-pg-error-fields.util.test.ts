import { describe, expect, it } from 'vite-plus/test';

import { readPgErrorFields } from './read-pg-error-fields.util.ts';

describe('readPgErrorFields', () => {
  it('reads code, column and constraint off a driver rejection', () => {
    const error = Object.assign(new Error('duplicate key value'), {
      code: '23505',
      constraint: 'orders_order_number_key',
      detail: 'Key (order_number)=(A-1) already exists.',
    });

    expect(readPgErrorFields(error)).toEqual({
      code: '23505',
      column: undefined,
      constraint: 'orders_order_number_key',
    });
  });

  it('never carries pg detail forward — that is the value leak', () => {
    const error = Object.assign(new Error('duplicate key value'), {
      code: '23505',
      detail: 'Key (email)=(a@b.c) already exists.',
    });

    expect(readPgErrorFields(error)).not.toHaveProperty('detail');
  });

  it('returns every field undefined for an ordinary Error', () => {
    expect(readPgErrorFields(new Error('socket hang up'))).toEqual({
      code: undefined,
      column: undefined,
      constraint: undefined,
    });
  });

  it('returns every field undefined for a non-Error rejection', () => {
    expect(readPgErrorFields('nope')).toEqual({
      code: undefined,
      column: undefined,
      constraint: undefined,
    });
  });
});
