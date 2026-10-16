import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  closeEvalsReaderPool,
  evalsReaderPool,
} from './evalsReaderPool.service.ts';

const env = (database: string) => ({
  EVALS_READER_DATABASE_URL: `postgres://reader@localhost/${database}`,
});

afterEach(async () => {
  await closeEvalsReaderPool();
});

describe('evalsReaderPool', () => {
  it('hands back one pool while the URL stays the same', () => {
    expect(evalsReaderPool(env('a'))).toBe(evalsReaderPool(env('a')));
  });

  it('opens a new pool when the URL changes', () => {
    expect(evalsReaderPool(env('a'))).not.toBe(evalsReaderPool(env('b')));
  });

  it('refuses an environment without a reader URL', () => {
    expect(() => evalsReaderPool({})).toThrow();
  });
});
