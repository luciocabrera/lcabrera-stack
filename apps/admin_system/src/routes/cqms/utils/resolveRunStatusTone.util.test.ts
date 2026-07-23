import { describe, expect, it } from 'vite-plus/test';

import { resolveRunStatusTone } from './resolveRunStatusTone.util';

describe('resolveRunStatusTone', () => {
  it.each([
    { status: 'succeeded', tone: 'success' },
    { status: 'failed', tone: 'error' },
    { status: 'partially_failed', tone: 'warning' },
    { status: 'running', tone: 'info' },
    { status: 'queued', tone: 'neutral' },
    { status: 'canceled', tone: 'neutral' },
  ] as const)('maps $status to $tone', ({ status, tone }) => {
    expect(resolveRunStatusTone(status)).toBe(tone);
  });

  it('maps a null status (no run yet, from a LEFT JOIN view) to neutral', () => {
    // eslint-disable-next-line unicorn/no-null -- real Postgres nullable column value, not an invented one
    expect(resolveRunStatusTone(null)).toBe('neutral');
  });
});
