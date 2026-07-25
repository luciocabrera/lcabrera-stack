import { describe, expect, it } from 'vite-plus/test';

import { readEnvConfig } from './env.schema.ts';

const credentials = {
  DB_HOST: 'localhost',
  DB_NAME: 'car_sales_db',
  DB_PASSWORD: 'root',
  DB_PORT: '5434',
  DB_USER: 'root',
};

describe('readEnvConfig', () => {
  it('boots an environment that predates the tuning keys, with bounded defaults', () => {
    expect(readEnvConfig({ env: credentials })).toEqual({
      ...credentials,
      DB_CONNECTION_TIMEOUT_MS: 10_000,
      DB_IDLE_TIMEOUT_MS: 10_000,
      DB_POOL_MAX: 10,
      DB_PORT: 5434,
      DB_STATEMENT_TIMEOUT_MS: 30_000,
    });
  });

  it('coerces each tuning key from its string environment value', () => {
    const config = readEnvConfig({
      env: {
        ...credentials,
        DB_CONNECTION_TIMEOUT_MS: '2000',
        DB_IDLE_TIMEOUT_MS: '5000',
        DB_POOL_MAX: '25',
        DB_STATEMENT_TIMEOUT_MS: '15000',
      },
    });

    expect(config.DB_CONNECTION_TIMEOUT_MS).toBe(2000);
    expect(config.DB_IDLE_TIMEOUT_MS).toBe(5000);
    expect(config.DB_POOL_MAX).toBe(25);
    expect(config.DB_STATEMENT_TIMEOUT_MS).toBe(15_000);
  });

  it('rejects a non-positive tuning value rather than silently disabling the bound', () => {
    expect(() =>
      readEnvConfig({ env: { ...credentials, DB_POOL_MAX: '0' } }),
    ).toThrow();
    expect(() =>
      readEnvConfig({ env: { ...credentials, DB_STATEMENT_TIMEOUT_MS: '-1' } }),
    ).toThrow();
  });

  it('still requires every credential key', () => {
    expect(() => readEnvConfig({ env: { DB_HOST: 'localhost' } })).toThrow();
  });
});
