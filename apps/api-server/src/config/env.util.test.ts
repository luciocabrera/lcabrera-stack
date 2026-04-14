import { describe, expect, it } from 'vitest';

import { HttpError } from 'api-shared';

import { readEnvConfig } from './env.util';

describe('readEnvConfig', () => {
  it('parses valid environment values', () => {
    expect(
      readEnvConfig({
        env: {
          API_PORT: '4100',
          CORS_ALLOWED_ORIGINS:
            'https://app.example.com, http://localhost:5173',
          CORS_ALLOWED_ORIGINS_DEFAULT: 'https://fallback.example.com',
          DB_HOST: 'db',
          DB_NAME: 'orders',
          DB_PASSWORD: 'secret',
          DB_PORT: '5433',
          DB_USER: 'postgres',
          DISTINCT_VALUES_DELAY_MS: '500',
          ENTERPRISE_ORDERS_DELAY_MS: '750',
        },
      }),
    ).toEqual({
      API_PORT: 4100,
      CORS_ALLOWED_ORIGINS: 'https://app.example.com, http://localhost:5173',
      DB_HOST: 'db',
      DB_NAME: 'orders',
      DB_PASSWORD: 'secret',
      DB_PORT: 5433,
      DB_USER: 'postgres',
      DISTINCT_VALUES_DELAY_MS: 500,
      ENTERPRISE_ORDERS_DELAY_MS: 750,
    });
  });

  it('uses the default CORS origins when none are explicitly provided', () => {
    expect(
      readEnvConfig({
        env: {
          CORS_ALLOWED_ORIGINS_DEFAULT: 'https://fallback.example.com',
        },
      }).CORS_ALLOWED_ORIGINS,
    ).toBe('https://fallback.example.com');
  });

  it('throws a HttpError when the environment is invalid', () => {
    expect(() =>
      readEnvConfig({
        env: {
          CORS_ALLOWED_ORIGINS: 'http://example.com',
        },
      }),
    ).toThrow(HttpError);
  });
});
