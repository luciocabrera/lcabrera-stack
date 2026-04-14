import { describe, expect, it } from 'vitest';

import { readEnvConfig } from './env.util';

describe('readEnvConfig', () => {
  it('uses defaults when environment values are missing', () => {
    expect(readEnvConfig({ env: {} })).toEqual({
      API_PORT: 3001,
      DB_HOST: 'localhost',
      DB_NAME: 'car_sales_db',
      DB_PASSWORD: 'root',
      DB_PORT: 5432,
      DB_USER: 'root',
      DISTINCT_VALUES_DELAY_MS: 10_000,
      ENTERPRISE_ORDERS_DELAY_MS: 3000,
    });
  });

  it('parses provided values and falls back for invalid integers', () => {
    expect(
      readEnvConfig({
        env: {
          API_PORT: '4000',
          DB_HOST: 'db',
          DB_NAME: 'orders',
          DB_PASSWORD: 'secret',
          DB_PORT: 'bad',
          DB_USER: 'postgres',
          DISTINCT_VALUES_DELAY_MS: '',
          ENTERPRISE_ORDERS_DELAY_MS: '1500',
        },
      }),
    ).toEqual({
      API_PORT: 4000,
      DB_HOST: 'db',
      DB_NAME: 'orders',
      DB_PASSWORD: 'secret',
      DB_PORT: 5432,
      DB_USER: 'postgres',
      DISTINCT_VALUES_DELAY_MS: 10_000,
      ENTERPRISE_ORDERS_DELAY_MS: 1500,
    });
  });
});
