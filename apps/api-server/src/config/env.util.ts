import { HttpError } from 'api-shared';

import { createEnvSchema, type EnvConfig } from './env.schema';

type ReadEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

/**
 * Parse and validate environment configuration for the API server.
 */
export const readEnvConfig = ({ env }: ReadEnvConfigArgs): EnvConfig => {
  const corsAllowedOriginsDefault = env.CORS_ALLOWED_ORIGINS_DEFAULT ?? '';
  const envSchema = createEnvSchema({ corsAllowedOriginsDefault });
  const result = envSchema.safeParse(env);

  if (!result.success) {
    throw new HttpError({
      message: `Invalid API server environment: ${result.error.message}`,
      statusCode: 500,
    });
  }

  return result.data;
};
