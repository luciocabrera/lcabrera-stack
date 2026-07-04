import { afterEach, describe, expect, it } from 'vitest';

import { getStreamTimeout } from './getStreamTimeout.util';

describe('getStreamTimeout', () => {
  const originalValue = process.env.STREAM_TIMEOUT_MS;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.STREAM_TIMEOUT_MS;
    } else {
      process.env.STREAM_TIMEOUT_MS = originalValue;
    }
  });

  it('defaults to 15000ms when STREAM_TIMEOUT_MS is unset', () => {
    delete process.env.STREAM_TIMEOUT_MS;
    expect(getStreamTimeout()).toBe(15_000);
  });

  it('uses STREAM_TIMEOUT_MS when set to a valid number', () => {
    process.env.STREAM_TIMEOUT_MS = '5000';
    expect(getStreamTimeout()).toBe(5000);
  });

  it('falls back to the default when STREAM_TIMEOUT_MS is not a valid number', () => {
    process.env.STREAM_TIMEOUT_MS = 'not-a-number';
    expect(getStreamTimeout()).toBe(15_000);
  });
});
