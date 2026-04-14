import { z } from 'zod';

type CreateEnvSchemaArgs = {
  readonly corsAllowedOriginsDefault: string;
};

const parseCorsAllowedOrigins = (origins: string): readonly string[] =>
  origins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

const isLocalhostOrigin = (url: URL): boolean => {
  const normalizedHostname = url.hostname.toLowerCase();

  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1'
  );
};

const isAllowedOriginProtocol = (origin: string): boolean => {
  try {
    const parsedOrigin = new URL(origin);

    if (isLocalhostOrigin(parsedOrigin)) {
      return (
        parsedOrigin.protocol === 'http:' || parsedOrigin.protocol === 'https:'
      );
    }

    return parsedOrigin.protocol === 'https:';
  } catch {
    return false;
  }
};

export const createEnvSchema = ({
  corsAllowedOriginsDefault,
}: CreateEnvSchemaArgs) =>
  z.object({
    API_PORT: z.coerce.number().int().positive().default(3001),
    CORS_ALLOWED_ORIGINS: z
      .string()
      .default(corsAllowedOriginsDefault)
      .refine(
        (origins) =>
          parseCorsAllowedOrigins(origins).every(isAllowedOriginProtocol),
        {
          message:
            'CORS_ALLOWED_ORIGINS must contain absolute URLs separated by commas. Non-local origins must use https.',
        },
      ),
    DB_HOST: z.string().default('localhost'),
    DB_NAME: z.string().default('car_sales_db'),
    DB_PASSWORD: z.string().default('root'),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_USER: z.string().default('root'),
    DISTINCT_VALUES_DELAY_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(10_000),
    ENTERPRISE_ORDERS_DELAY_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(3000),
  });

export type EnvConfig = z.infer<ReturnType<typeof createEnvSchema>>;
