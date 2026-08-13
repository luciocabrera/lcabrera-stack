import { describe, expect, it } from 'vite-plus/test';

import { PersistenceError } from './persistence.error.ts';
import { QueryCanceledError } from './query-canceled.error.ts';

describe('QueryCanceledError', () => {
  it('replaces the driver message with one that names nothing', () => {
    const cause = new Error('canceling statement due to statement timeout');
    const error = new QueryCanceledError({ cause, fields: { code: '57014' } });

    expect(error.message).not.toContain('statement timeout');
    expect(error.message).toContain('Narrow it and try again.');
    expect(error.cause).toBe(cause);
  });

  it('is caught by a PersistenceError check', () => {
    const error = new QueryCanceledError({ cause: undefined, fields: {} });

    expect(error).toBeInstanceOf(PersistenceError);
    expect(error.name).toBe('QueryCanceledError');
  });

  it('carries the SQLSTATE for a consumer that branches on it', () => {
    const error = new QueryCanceledError({
      cause: undefined,
      fields: { code: '57014' },
    });

    expect(error.fields.code).toBe('57014');
  });
});
