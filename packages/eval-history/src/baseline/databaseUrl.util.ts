import { evalsDatabaseEnvSchema } from '../migrate/evalsDatabaseEnv.schema.ts';

const UNSET =
  'evals:baseline: EVALS_DATABASE_URL is unset, so there is nowhere to write the baseline (ADR-130)';

const INVALID =
  'evals:baseline: EVALS_DATABASE_URL must be a postgres:// URL (ADR-130)';

export const databaseUrl = (connectionString: string | undefined) => {
  if (!connectionString) {
    return { message: UNSET, ok: false } as const;
  }

  const env = evalsDatabaseEnvSchema.safeParse({
    EVALS_DATABASE_URL: connectionString,
  });

  return env.success
    ? ({ ok: true, url: env.data.EVALS_DATABASE_URL } as const)
    : ({ message: INVALID, ok: false } as const);
};
