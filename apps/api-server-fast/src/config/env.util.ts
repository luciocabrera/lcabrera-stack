import type { EnvConfig } from './env.schema';

type ReadEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

const readEnvInteger = (
  value: string | undefined,
  fallback: number,
): number => {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const readEnvString = (value: string | undefined, fallback: string): string => {
  return value && value.length > 0 ? value : fallback;
};

/**
 * Parse and validate environment configuration for the API server.
 */
export const readEnvConfig = ({ env }: ReadEnvConfigArgs): EnvConfig => ({
  API_PORT: readEnvInteger(env.API_PORT, 3001),
  DB_HOST: readEnvString(env.DB_HOST, 'localhost'),
  DB_NAME: readEnvString(env.DB_NAME, 'car_sales_db'),
  DB_PASSWORD: readEnvString(env.DB_PASSWORD, 'root'),
  DB_PORT: readEnvInteger(env.DB_PORT, 5432),
  DB_USER: readEnvString(env.DB_USER, 'root'),
  DISTINCT_VALUES_DELAY_MS: readEnvInteger(
    env.DISTINCT_VALUES_DELAY_MS,
    10_000,
  ),
  ENTERPRISE_ORDERS_DELAY_MS: readEnvInteger(
    env.ENTERPRISE_ORDERS_DELAY_MS,
    3000,
  ),
});
