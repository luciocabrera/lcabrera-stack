import { HttpError } from 'api-shared';

import { type EnvConfig, envSchema } from './env.schema';

type ReadEnvConfigArgs = {
  readonly env: NodeJS.ProcessEnv;
};

/**
 * Parse and validate environment configuration for the API server.
 */
export const readEnvConfig = ({ env }: ReadEnvConfigArgs): EnvConfig => {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    throw new HttpError({
      message: `Invalid API server environment: ${result.error.message}`,
      statusCode: 500,
    });
  }

  return result.data;
};
